import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const {
        server_name,
        function_name,
        parameters = {},
        required_capabilities = [],
        preferred_location = null,
        server_type = null,
        cost_credits = 10,
    } = await req.json();

    console.log("Executing function:", {
      server_name,
      function_name,
      server_type,
      required_capabilities,
    });

    // Select best host for execution
    const { data: hostId, error: hostError } = await supabaseClient.rpc("select_best_host", {
      required_capabilities,
      preferred_location,
      required_server_type: server_type,
    });

    if (hostError || !hostId) {
      console.error("No available hosts:", hostError);
      return new Response(
        JSON.stringify({ error: "No available compute hosts found" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Selected host:", hostId);

    // Get host details
    const { data: host, error: hostDetailsError } = await supabaseClient
      .from("compute_hosts")
      .select("*")
      .eq("id", hostId)
      .single();

    if (hostDetailsError || !host) {
      throw new Error("Failed to get host details");
    }

    // Create execution record
    const { data: execution, error: executionError } = await supabaseClient
      .from("compute_executions")
      .insert({
        requester_id: user.id,
        host_id: hostId,
        server_name,
        server_type: server_type || 'misc',
        function_name,
        parameters,
        cost_credits,
        status: "pending",
      })
      .select()
      .single();

    if (executionError) {
      throw executionError;
    }

    console.log("Created execution:", execution.id);

    // Execute function on host
    const startTime = Date.now();
    let executionResult;
    let executionStatus = "completed";
    let errorMessage = null;

    try {
      // Update status to running
      await supabaseClient
        .from("compute_executions")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", execution.id);

      // Call the host endpoint
      const response = await fetch(`${host.endpoint}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          server: server_name,
          server_type: server_type || 'misc',
          function: function_name,
          parameters,
        }),
      });

      if (!response.ok) {
        throw new Error(`Host returned ${response.status}: ${await response.text()}`);
      }

      executionResult = await response.json();
      console.log("Execution successful");
    } catch (error) {
      console.error("Execution failed:", error);
      executionStatus = "failed";
      errorMessage = error instanceof Error ? error.message : "Unknown error";
    }

    const executionTime = Date.now() - startTime;

    // Calculate earnings based on profit share
    const hostEarnings = (cost_credits * host.profit_share_percentage) / 100;
    const platformEarnings = cost_credits - hostEarnings;

    // Update execution with results
    await supabaseClient
      .from("compute_executions")
      .update({
        status: executionStatus,
        result: executionResult,
        error_message: errorMessage,
        execution_time_ms: executionTime,
        host_earnings: hostEarnings,
        platform_earnings: platformEarnings,
        completed_at: new Date().toISOString(),
      })
      .eq("id", execution.id);

    // Update host statistics
    if (executionStatus === "completed") {
      await supabaseClient.rpc("increment", {
        row_id: hostId,
        x: 1,
      });
      
      await supabaseClient
        .from("compute_hosts")
        .update({
          total_executions: host.total_executions + 1,
          successful_executions: host.successful_executions + 1,
          total_earnings: parseFloat(host.total_earnings) + hostEarnings,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", hostId);

      // Create payment record
      await supabaseClient.from("compute_payments").insert({
        host_id: hostId,
        execution_id: execution.id,
        amount: hostEarnings,
        status: "pending",
      });
    } else {
      await supabaseClient
        .from("compute_hosts")
        .update({
          total_executions: host.total_executions + 1,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", hostId);
    }

    return new Response(
      JSON.stringify({
        success: executionStatus === "completed",
        execution_id: execution.id,
        result: executionResult,
        error: errorMessage,
        execution_time_ms: executionTime,
        host_id: hostId,
        host_earnings: hostEarnings,
        platform_earnings: platformEarnings,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in execute-mcp function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
