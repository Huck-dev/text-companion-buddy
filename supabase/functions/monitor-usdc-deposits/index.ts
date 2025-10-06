import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// USDC contract address on Base mainnet
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

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

    const { wallet_address } = await req.json();

    if (!wallet_address) {
      throw new Error("Wallet address is required");
    }

    console.log("Checking deposits for wallet:", wallet_address);

    // Find user by wallet address
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("wallet_address", wallet_address)
      .single();

    if (profileError || !profile) {
      throw new Error("User not found for this wallet address");
    }

    // Here you would integrate with Base network RPC to check for USDC transfers
    // For now, we'll return a structure for manual deposit processing
    // In production, you'd use ethers.js or web3.js to query the blockchain

    // Example response structure:
    const response = {
      wallet_address,
      user_id: profile.id,
      instructions: {
        network: "Base",
        token: "USDC",
        contract: USDC_CONTRACT,
        deposit_address: wallet_address,
        rate: `1 USDC = ${CREDITS_PER_USDC} credits`,
      },
      message: "Send USDC to your wallet address to automatically receive credits",
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
