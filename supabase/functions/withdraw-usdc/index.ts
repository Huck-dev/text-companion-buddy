import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credits per USDC: 1 USDC = 10 credits
const CREDITS_PER_USDC = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { amount_usdc, recipient_address, network = "Base" } = await req.json();

    if (!amount_usdc || !recipient_address || !network) {
      throw new Error("Amount, recipient address, and network are required");
    }

    // Validate network
    if (!["Base", "Solana"].includes(network)) {
      throw new Error("Only Base and Solana networks are supported");
    }

    console.log(`Withdrawal request: ${amount_usdc} USDC to ${recipient_address} on ${network}`);

    const creditsNeeded = Math.ceil(amount_usdc * CREDITS_PER_USDC);

    // Check user has enough credits
    const { data: userCredits, error: creditsError } = await supabaseClient
      .from("user_credits")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (creditsError || !userCredits) {
      throw new Error("Could not fetch user credits");
    }

    if (userCredits.credits < creditsNeeded) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    const { error: updateError } = await supabaseClient
      .from("user_credits")
      .update({ credits: userCredits.credits - creditsNeeded })
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error("Failed to deduct credits");
    }

    // Log the transaction
    await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: -creditsNeeded,
        transaction_type: "withdrawal",
        description: `Withdrew ${amount_usdc} USDC to ${recipient_address} on ${network}`,
      });

    // TODO: In production, integrate with blockchain:
    // - Base: Use ethers.js to send USDC via ERC-20 transfer
    // - Solana: Use @solana/web3.js to send USDC via SPL token transfer
    
    return new Response(
      JSON.stringify({
        success: true,
        amount_usdc,
        credits_deducted: creditsNeeded,
        recipient_address,
        network,
        message: `Withdrawal request submitted. ${amount_usdc} USDC will be sent to ${recipient_address} on ${network} within 24 hours.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
