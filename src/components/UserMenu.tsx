import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wallet, Copy, Check, LogIn, ChevronDown, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NETWORKS = [
  { name: "Base", chainId: 8453, symbol: "⚡", color: "text-blue-500" },
  { name: "Ethereum", chainId: 1, symbol: "Ξ", color: "text-purple-500" },
  { name: "Arbitrum", chainId: 42161, symbol: "◆", color: "text-cyan-500" },
  { name: "Optimism", chainId: 10, symbol: "🔴", color: "text-red-500" },
  { name: "Polygon", chainId: 137, symbol: "⬡", color: "text-violet-500" },
];

export const UserMenu = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [credits, setCredits] = useState<number>(0);
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
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
            loadCredits(session.user.id);
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
        loadCredits(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCredits = async (userId: string) => {
    const { data } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setCredits(data.credits);
    }
  };

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
      setShowPasswordInput(false);
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
        <Badge variant="secondary" className="gap-1 px-3 py-1.5">
          <Coins className="w-3 h-3" />
          <span className="font-semibold">{credits}</span>
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 border-primary/30 bg-card/50"
            >
              <span className={`text-lg ${selectedNetwork.color}`}>
                {selectedNetwork.symbol}
              </span>
              <span className="font-medium">{selectedNetwork.name}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background z-50">
            {NETWORKS.map((network) => (
              <DropdownMenuItem
                key={network.chainId}
                onClick={() => setSelectedNetwork(network)}
                className="cursor-pointer"
              >
                <span className={`text-lg mr-2 ${network.color}`}>
                  {network.symbol}
                </span>
                <span>{network.name}</span>
                {network.chainId === selectedNetwork.chainId && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          className="gap-2 border-primary/30 bg-card/50"
          onClick={copyAddress}
        >
          <span className="font-mono text-sm">{shortenAddress(walletAddress)}</span>
          {copied ? <Check className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    );
  }

  if (showPasswordInput) {
    return (
      <form onSubmit={handleAuth} className="flex items-center gap-2">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-48"
          autoFocus
          disabled={isLoading}
          autoComplete="current-password"
        />
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? "..." : <LogIn className="w-4 h-4" />}
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={() => {
            setShowPasswordInput(false);
            setPassword("");
          }}
        >
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <Button
      className="bg-primary/20 border border-primary/30 hover:bg-primary/30"
      onClick={() => setShowPasswordInput(true)}
    >
      LOGIN
    </Button>
  );
};
