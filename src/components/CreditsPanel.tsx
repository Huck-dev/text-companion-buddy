import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const MODEL_COSTS = {
  "self-hosted": 1,
  "google/gemini-2.5-flash": 1,
  "google/gemini-2.5-flash-lite": 1,
  "google/gemini-2.5-pro": 3,
  "openai/gpt-5-nano": 2,
  "openai/gpt-5-mini": 5,
  "openai/gpt-5": 10,
};

export const CreditsPanel = ({ selectedNetwork }: { selectedNetwork: { name: string; chainId: number; type: string } | null }) => {
  const [credits, setCredits] = useState<number>(0);
  const [evmAddress, setEvmAddress] = useState<string>("");
  const [solanaAddress, setSolanaAddress] = useState<string>("");

  const walletAddress = selectedNetwork?.type === "solana" ? solanaAddress : evmAddress;

  // Update USDC_NETWORKS based on selected network - only EVM networks support USDC deposits
  const USDC_NETWORKS = [
    { name: "Base", chainId: 8453, active: selectedNetwork?.name === "Base" },
    { name: "Ethereum", chainId: 1, active: selectedNetwork?.name === "Ethereum" },
    { name: "Arbitrum", chainId: 42161, active: selectedNetwork?.name === "Arbitrum" },
    { name: "Optimism", chainId: 10, active: selectedNetwork?.name === "Optimism" },
    { name: "Polygon", chainId: 137, active: selectedNetwork?.name === "Polygon" },
  ];

  useEffect(() => {
    fetchCredits();
    loadWalletAddress();
  }, []);

  const loadWalletAddress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_address, solana_address")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading wallet:", error);
      return;
    }

    if (data?.wallet_address) {
      setEvmAddress(data.wallet_address);
    } else {
      // Create EVM address if it doesn't exist
      const newAddress = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error: insertError } = await supabase
        .from("profiles")
        .update({ wallet_address: newAddress })
        .eq("id", user.id);
      
      if (!insertError) {
        setEvmAddress(newAddress);
      }
    }

    // @ts-ignore - solana_address column exists
    if (data?.solana_address) {
      // @ts-ignore
      setSolanaAddress(data.solana_address);
    } else {
      // Create Solana address if it doesn't exist
      const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      const newSolanaAddress = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => chars[b % chars.length])
        .join('');
      
      // @ts-ignore
      const { error: insertError } = await supabase
        .from("profiles")
        .update({ solana_address: newSolanaAddress })
        .eq("id", user.id);
      
      if (!insertError) {
        setSolanaAddress(newSolanaAddress);
      }
    }
  };

  const fetchCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching credits:", error);
        return;
      }

      if (data) {
        setCredits(data.credits);
      } else {
        // Initialize credits for new user
        const { error: insertError } = await supabase
          .from("user_credits")
          .insert({ user_id: user.id, credits: 50 }); // Free starter credits

        if (!insertError) {
          setCredits(50);
          toast.success("Welcome! 50 free credits added to your account");
        }
      }
    } catch (error) {
      console.error("Error in fetchCredits:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/30 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="h-5 w-5 text-primary" />
              Your Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{credits}</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-sm mb-2">Model Costs per Use:</p>
              <div className="grid grid-cols-2 gap-1">
                <div>Self Hosted: 1</div>
                <div>Gemini Flash: 1</div>
                <div>Flash Lite: 1</div>
                <div>Gemini Pro: 3</div>
                <div>GPT-5 Nano: 2</div>
                <div>GPT-5 Mini: 5</div>
                <div>GPT-5: 10</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-accent" />
              Fund Credits with USDC
            </CardTitle>
            <CardDescription className="text-xs">
              {selectedNetwork?.type === "solana" 
                ? "Solana USDC deposits coming soon" 
                : "Send USDC on supported EVM networks to your wallet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {walletAddress ? (
              <div className="space-y-3">
                <div className="bg-secondary/20 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Your Deposit Address:</p>
                  <p className="font-mono text-sm break-all">{walletAddress}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(walletAddress);
                      toast.success("Address copied!");
                    }}
                  >
                    Copy Address
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedNetwork?.type === "evm" ? (
                    <>
                      <div className="text-xs text-muted-foreground">
                        <p className="font-semibold mb-2">Supported Networks:</p>
                        <div className="flex flex-wrap gap-2">
                          {USDC_NETWORKS.map((network) => (
                            <Badge 
                              key={network.chainId}
                              variant={network.active ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {network.name} {network.active && "✓"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground pt-2">
                        <p><strong>Token:</strong> USDC (ERC-20)</p>
                        <p><strong>Rate:</strong> 1 USDC = 10 Credits</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
                      <p className="font-semibold mb-1">Solana Support Coming Soon</p>
                      <p>USDC deposits on Solana will be available in a future update. For now, please use an EVM network.</p>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-2 text-xs">
                  Credits are automatically added when USDC is received
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Please sign in to view your deposit address
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
