import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";

export const UserMenu = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [showAuth, setShowAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            loadWalletAddress(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadWalletAddress(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadWalletAddress = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error loading wallet:", error);
      return;
    }

    if (data?.wallet_address) {
      setWalletAddress(data.wallet_address);
    } else {
      // Create profile if it doesn't exist
      const newAddress = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userId, wallet_address: newAddress });
      
      if (!insertError) {
        setWalletAddress(newAddress);
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate a unique email from password hash
      const email = `user_${password.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)}@modchain.local`;
      
      // Try to sign in first
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If sign in fails, create new account
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (signUpError) throw signUpError;
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      setShowAuth(false);
      setPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setWalletAddress("");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  };

  if (user && walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="gap-2 border-primary/30 bg-card/50"
          onClick={copyAddress}
        >
          <span className="font-mono">{shortenAddress(walletAddress)}</span>
          {copied ? <Check className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        className="bg-primary/20 border border-primary/30 hover:bg-primary/30"
        onClick={() => setShowAuth(true)}
      >
        LOGIN
      </Button>

      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : "LOGIN"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
