import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// USDC contract addresses
const USDC_CONTRACTS = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  solana: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC on Solana
};

const USDC_DECIMALS = 6;
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

    const { wallet_address, network = "base" } = await req.json();

    if (!wallet_address) {
      throw new Error("Wallet address is required");
    }

    console.log(`Checking deposits for wallet: ${wallet_address} on ${network}`);

    // Find user by wallet address (EVM or Solana)
    const isEVM = network.toLowerCase() === "base";
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id")
      .or(isEVM ? `wallet_address.eq.${wallet_address}` : `solana_address.eq.${wallet_address}`)
      .single();

    if (profileError || !profile) {
      throw new Error("User not found for this wallet address");
    }

    // In production, integrate with blockchain RPCs:
    // - Base: Use ethers.js/web3.js to query USDC transfers
    // - Solana: Use @solana/web3.js to query SPL token transfers
    
    // For now, return deposit instructions
    const contract = network.toLowerCase() === "solana" 
      ? USDC_CONTRACTS.solana 
      : USDC_CONTRACTS.base;

    const response = {
      wallet_address,
      user_id: profile.id,
      network: network.charAt(0).toUpperCase() + network.slice(1),
      instructions: {
        network: network.charAt(0).toUpperCase() + network.slice(1),
        token: "USDC",
        contract,
        deposit_address: wallet_address,
        rate: `1 USDC = ${CREDITS_PER_USDC} credits`,
        type: network.toLowerCase() === "solana" ? "SPL Token" : "ERC-20",
      },
      message: `Send USDC to your ${network} wallet address to automatically receive credits`,
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
