import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, CreditCard, Zap } from "lucide-react";
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

const CREDIT_PACKAGES = [
  { credits: 100, price: 9.99, label: "Starter" },
  { credits: 500, price: 39.99, label: "Pro" },
  { credits: 1000, price: 69.99, label: "Premium" },
];

const MONTHLY_PLANS = [
  { credits: 500, price: 29.99, label: "Monthly Basic" },
  { credits: 2000, price: 99.99, label: "Monthly Pro" },
];

export const CreditsPanel = () => {
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

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
      toast.success(`Successfully added ${amount} credits!`);
    } catch (error) {
      console.error("Error purchasing credits:", error);
      toast.error("Failed to purchase credits");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Your Credits
          </CardTitle>
          <CardDescription>
            Current balance and model costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-4">{credits} credits</div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold">Model Costs per Use:</p>
            <div className="grid grid-cols-2 gap-2">
              <div>Self Hosted: 1 credit</div>
              <div>Gemini Flash: 1 credit</div>
              <div>Gemini Flash Lite: 1 credit</div>
              <div>Gemini Pro: 3 credits</div>
              <div>GPT-5 Nano: 2 credits</div>
              <div>GPT-5 Mini: 5 credits</div>
              <div>GPT-5: 10 credits</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Pay Per Use
          </CardTitle>
          <CardDescription>
            Purchase credits as you need them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <div key={pkg.label} className="border rounded-lg p-4 space-y-3">
                <div className="font-semibold">{pkg.label}</div>
                <div className="text-2xl font-bold">{pkg.credits} credits</div>
                <div className="text-muted-foreground">${pkg.price}</div>
                <Button
                  className="w-full"
                  onClick={() => purchaseCredits(pkg.credits, pkg.label)}
                  disabled={isLoading}
                >
                  Purchase
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Monthly Subscriptions
          </CardTitle>
          <CardDescription>
            Get recurring credits every month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {MONTHLY_PLANS.map((plan) => (
              <div key={plan.label} className="border rounded-lg p-4 space-y-3">
                <div className="font-semibold">{plan.label}</div>
                <div className="text-2xl font-bold">{plan.credits} credits/mo</div>
                <div className="text-muted-foreground">${plan.price}/month</div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => purchaseCredits(plan.credits, plan.label)}
                  disabled={isLoading}
                >
                  Subscribe
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
