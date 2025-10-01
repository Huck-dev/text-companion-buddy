import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, CreditCard, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WalletConnect } from "./WalletConnect";
import { ethers } from "ethers";

export const MODEL_COSTS = {
  "self-hosted": 1,
  "google/gemini-2.5-flash": 1,
  "google/gemini-2.5-flash-lite": 1,
  "google/gemini-2.5-pro": 3,
  "openai/gpt-5-nano": 2,
  "openai/gpt-5-mini": 5,
  "openai/gpt-5": 10,
};

const CREDIT_PACKAGES = [
  { credits: 100, price: 9.99, usdcPrice: 10, modPrice: 100, label: "Starter" },
  { credits: 500, price: 39.99, usdcPrice: 40, modPrice: 450, label: "Pro" },
  { credits: 1000, price: 69.99, usdcPrice: 70, modPrice: 850, label: "Premium" },
];

const MONTHLY_PLANS = [
  { credits: 500, price: 29.99, usdcPrice: 30, modPrice: 400, label: "Monthly Basic" },
  { credits: 2000, price: 99.99, usdcPrice: 100, modPrice: 1500, label: "Monthly Pro" },
];

export const CreditsPanel = () => {
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletType, setWalletType] = useState<'metamask' | 'subwallet' | null>(null);

  useEffect(() => {
    fetchCredits();
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

  const purchaseCredits = async (amount: number, packageLabel: string) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to purchase credits");
        return;
      }

      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add credits
      const newCredits = credits + amount;
      const { error: updateError } = await supabase
        .from("user_credits")
        .update({ credits: newCredits })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase
        .from("credit_transactions")
        .insert({
          user_id: user.id,
          amount,
          transaction_type: "purchase",
          description: `Purchased ${packageLabel} package`,
        });

      setCredits(newCredits);
      toast.success(`Successfully added ${amount} MOD tokens!`);
    } catch (error) {
      console.error("Error purchasing credits:", error);
      toast.error("Failed to purchase MOD tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseWithCrypto = async (amount: number, paymentAmount: number, currency: 'USDC' | 'MOD', packageLabel: string) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to purchase");
        return;
      }

      // Mock crypto payment processing
      toast.info(`Initiating ${currency} payment...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add credits
      const newCredits = credits + amount;
      const { error: updateError } = await supabase
        .from("user_credits")
        .update({ credits: newCredits })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase
        .from("credit_transactions")
        .insert({
          user_id: user.id,
          amount,
          transaction_type: "crypto_purchase",
          description: `Purchased ${packageLabel} with ${paymentAmount} ${currency}`,
        });

      setCredits(newCredits);
      toast.success(`Successfully purchased ${amount} MOD tokens with ${currency}!`);
    } catch (error) {
      console.error("Error purchasing with crypto:", error);
      toast.error("Failed to complete crypto payment");
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseWithStripe = async (amount: number, packageLabel: string) => {
    toast.info("Stripe payment integration coming soon!");
  };

  return (
    <div className="space-y-4">
      <WalletConnect 
        onWalletConnected={(address, type) => {
          setWalletAddress(address);
          setWalletType(type);
        }} 
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/30 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="h-5 w-5 text-primary" />
              Your MOD Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{credits} MOD</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-sm mb-2">Model Costs per Use:</p>
              <div className="grid grid-cols-2 gap-1">
                <div>Self Hosted: 1 MOD</div>
                <div>Gemini Flash: 1 MOD</div>
                <div>Flash Lite: 1 MOD</div>
                <div>Gemini Pro: 3 MOD</div>
                <div>GPT-5 Nano: 2 MOD</div>
                <div>GPT-5 Mini: 5 MOD</div>
                <div>GPT-5: 10 MOD</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-accent" />
              Quick Purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {CREDIT_PACKAGES.map((pkg) => (
              <div key={pkg.label} className="bg-secondary/10 rounded-lg p-3 space-y-2 border border-border/30">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-sm">{pkg.label}</span>
                  <span className="text-lg font-bold text-primary">{pkg.credits} MOD</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  ${pkg.price} • {pkg.usdcPrice} USDC • {pkg.modPrice} MOD
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-8"
                    onClick={() => purchaseCredits(pkg.credits, pkg.label)}
                    disabled={isLoading}
                    size="sm"
                  >
                    Buy ${pkg.price}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 px-2"
                    onClick={() => purchaseWithStripe(pkg.credits, pkg.label)}
                    disabled={isLoading}
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4" />
                  </Button>
                </div>
                {walletAddress && walletType === 'metamask' && (
                  <Button
                    className="w-full h-8"
                    variant="outline"
                    onClick={() => purchaseWithCrypto(pkg.credits, pkg.usdcPrice, 'USDC', pkg.label)}
                    disabled={isLoading}
                    size="sm"
                  >
                    {pkg.usdcPrice} USDC
                  </Button>
                )}
                {walletAddress && walletType === 'subwallet' && (
                  <Button
                    className="w-full h-8"
                    variant="outline"
                    onClick={() => purchaseWithCrypto(pkg.credits, pkg.modPrice, 'MOD', pkg.label)}
                    disabled={isLoading}
                    size="sm"
                  >
                    {pkg.modPrice} MOD
                  </Button>
                )}
              </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-accent" />
            Monthly Subscriptions
          </CardTitle>
          <CardDescription className="text-xs">
            Get recurring MOD tokens every month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {MONTHLY_PLANS.map((plan) => (
              <div key={plan.label} className="bg-secondary/10 rounded-lg p-4 space-y-2 border border-border/30">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold">{plan.label}</span>
                  <span className="text-xl font-bold text-primary">{plan.credits} MOD/mo</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  ${plan.price}/mo • {plan.usdcPrice} USDC/mo • {plan.modPrice} MOD/mo
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-9"
                    variant="outline"
                    onClick={() => purchaseCredits(plan.credits, plan.label)}
                    disabled={isLoading}
                    size="sm"
                  >
                    Subscribe ${plan.price}/mo
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 px-2"
                    onClick={() => purchaseWithStripe(plan.credits, plan.label)}
                    disabled={isLoading}
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4" />
                  </Button>
                </div>
                {walletAddress && walletType === 'metamask' && (
                  <Button
                    className="w-full h-9"
                    variant="outline"
                    onClick={() => purchaseWithCrypto(plan.credits, plan.usdcPrice, 'USDC', plan.label)}
                    disabled={isLoading}
                    size="sm"
                  >
                    {plan.usdcPrice} USDC/mo
                  </Button>
                )}
                {walletAddress && walletType === 'subwallet' && (
                  <Button
                    className="w-full h-9"
                    variant="outline"
                    onClick={() => purchaseWithCrypto(plan.credits, plan.modPrice, 'MOD', plan.label)}
                    disabled={isLoading}
                    size="sm"
                  >
                    {plan.modPrice} MOD/mo
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
