import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, CreditCard, ArrowUpRight, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const MODEL_COSTS = {
  "self-hosted": 1,
  "google/gemini-2.5-flash": 1,
  "google/gemini-2.5-flash-lite": 1,
  "google/gemini-2.5-pro": 3,
  "openai/gpt-5-nano": 2,
  "openai/gpt-5-mini": 5,
  "openai/gpt-5": 10,
};

type Deposit = {
  id: string;
  amount_usdc: number;
  credits_awarded: number;
  transaction_hash: string;
  network: string;
  created_at: string;
};

export const CreditsPanel = ({ selectedNetwork, addresses }: { selectedNetwork: { name: string; chainId: number; type: string } | null; addresses: { evm: string; solana: string } }) => {
  const [credits, setCredits] = useState<number>(0);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const walletAddress = selectedNetwork?.type === "solana" ? addresses.solana : addresses.evm;

  // Supported networks: Base and Solana only
  const SUPPORTED_NETWORKS = [
    { name: "Base", chainId: 8453, type: "evm", active: selectedNetwork?.name === "Base" },
    { name: "Solana", chainId: null, type: "solana", active: selectedNetwork?.name === "Solana" },
  ];

  useEffect(() => {
    fetchCredits();
    fetchDeposits();
  }, []);

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
        // Initialize credits for new user with 0 credits
        const { error: insertError } = await supabase
          .from("user_credits")
          .insert({ user_id: user.id, credits: 0 });

        if (!insertError) {
          setCredits(0);
        }
      }
    } catch (error) {
      console.error("Error in fetchCredits:", error);
    }
  };

  const fetchDeposits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("token_deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching deposits:", error);
        return;
      }

      setDeposits(data || []);
    } catch (error) {
      console.error("Error in fetchDeposits:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress) {
      toast.error("Please enter amount and address");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    const creditsNeeded = Math.ceil(amount * 10);
    if (creditsNeeded > credits) {
      toast.error("Insufficient credits");
      return;
    }

    setIsWithdrawing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in");
        return;
      }

      // Call edge function to process withdrawal
      const { data, error } = await supabase.functions.invoke("withdraw-usdc", {
        body: {
          amount_usdc: amount,
          recipient_address: withdrawAddress,
          network: selectedNetwork?.name || "Base",
        },
      });

      if (error) throw error;

      toast.success("Withdrawal request submitted");
      setWithdrawAmount("");
      setWithdrawAddress("");
      fetchCredits();
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const usdBalance = (credits / 10).toFixed(2);

  return (
    <div className="space-y-4">
      <Card className="bg-card/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-primary" />
            Total Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">${usdBalance}</div>
          <p className="text-xs text-muted-foreground mt-1">{credits} credits</p>
        </CardContent>
      </Card>

      <Card className="bg-card/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-accent" />
            Fund Credits with USDC
          </CardTitle>
          <CardDescription className="text-xs">
            Send USDC on Base or Solana to fund your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {walletAddress ? (
            <div className="space-y-3">
              <div className="bg-secondary/20 rounded-lg p-4 space-y-3 border border-border/50">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Your Deposit Address</p>
                    <p className="font-mono text-sm break-all text-foreground">{walletAddress}</p>
                  </div>
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
                  <div className="pt-2 space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Network:</span>
                      <span className="font-medium">{selectedNetwork?.name || "Select Network"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Token:</span>
                      <span className="font-medium">USDC {selectedNetwork?.type === "evm" ? "(ERC-20)" : "(SPL)"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span className="font-medium">1 USDC = $1.00</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold mb-2">Supported Networks:</p>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_NETWORKS.map((network) => (
                    <Badge 
                      key={network.name}
                      variant={network.active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {network.name} {network.active && "✓"}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-2 text-xs">
                USD is automatically added when USDC is received
              </div>

              {deposits.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <History className="h-4 w-4 mr-2" />
                      View Deposit History ({deposits.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>USDC Deposit History</DialogTitle>
                      <DialogDescription>Your verified on-chain USDC deposits</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      {deposits.map((deposit) => (
                        <Card key={deposit.id} className="bg-card/50">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Amount</p>
                                <p className="font-semibold">{deposit.amount_usdc} USDC</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Credits Awarded</p>
                                <p className="font-semibold text-primary">{deposit.credits_awarded}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground text-xs">Network</p>
                                <p className="font-mono text-xs">{deposit.network}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground text-xs">Transaction Hash</p>
                                <p className="font-mono text-xs break-all">{deposit.transaction_hash}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground text-xs">Date</p>
                                <p className="text-xs">{new Date(deposit.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Please sign in to view your deposit address
            </div>
          )}
        </CardContent>
      </Card>

      {deposits.length > 0 && (selectedNetwork?.name === "Base" || selectedNetwork?.name === "Solana") && (
        <Card className="bg-card/30 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpRight className="h-5 w-5 text-accent" />
              Withdraw USDC
            </CardTitle>
            <CardDescription className="text-xs">
              Convert credits back to USDC on {selectedNetwork?.name} (1 USDC = 10 credits)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="withdraw-amount" className="text-xs">Amount (USDC)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="mt-1"
                />
                {withdrawAmount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Will deduct {Math.ceil(parseFloat(withdrawAmount) * 10)} credits
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="withdraw-address" className="text-xs">Recipient Address</Label>
                <Input
                  id="withdraw-address"
                  placeholder={selectedNetwork?.type === "solana" ? "Solana address..." : "0x..."}
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
              </div>
              <Button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount || !withdrawAddress}
                className="w-full"
              >
                {isWithdrawing ? "Processing..." : "Withdraw USDC"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
