import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wallet, Copy, Check, LogIn, ChevronDown, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import baseLogo from "@/assets/base-logo.jpg";
import ethereumLogo from "@/assets/ethereum-logo.jpg";
import arbitrumLogo from "@/assets/arbitrum-logo.jpg";
import optimismLogo from "@/assets/optimism-logo.jpg";
import polygonLogo from "@/assets/polygon-logo.jpg";
import solanaLogo from "@/assets/solana-logo.jpg";

const NETWORKS = [
  { name: "Base", chainId: 8453, logo: baseLogo, type: "evm" },
  { name: "Ethereum", chainId: 1, logo: ethereumLogo, type: "evm" },
  { name: "Arbitrum", chainId: 42161, logo: arbitrumLogo, type: "evm" },
  { name: "Optimism", chainId: 10, logo: optimismLogo, type: "evm" },
  { name: "Polygon", chainId: 137, logo: polygonLogo, type: "evm" },
  { name: "Solana", chainId: 0, logo: solanaLogo, type: "solana" },
];

export const UserMenu = ({ onNetworkChange, onAddressesChange, onAccountClick }: { onNetworkChange: (network: typeof NETWORKS[0]) => void; onAddressesChange?: (evm: string, solana: string) => void; onAccountClick?: () => void }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  
  const {
    evmAddress,
    solanaAddress,
    connectedWallet,
    isConnecting,
    connectMetaMask,
    connectPhantom,
    connectSubWallet,
  } = useWalletConnection();

  const walletAddress = selectedNetwork.type === "solana" ? solanaAddress : evmAddress;

  useEffect(() => {
    onNetworkChange(selectedNetwork);
  }, [selectedNetwork, onNetworkChange]);

  useEffect(() => {
    if (evmAddress || solanaAddress) {
      onAddressesChange?.(evmAddress, solanaAddress);
      // Save connected addresses to profile
      if (user) {
        saveWalletAddresses(user.id, evmAddress, solanaAddress);
      }
    }
  }, [evmAddress, solanaAddress, user]);

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
      .select("wallet_address, solana_address")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error loading wallet:", error);
      return;
    }

    // Load saved addresses but don't auto-generate
    if (data?.wallet_address || data?.solana_address) {
      onAddressesChange?.(data.wallet_address || "", data.solana_address || "");
    }
  };

  const saveWalletAddresses = async (userId: string, evm: string, solana: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ 
        wallet_address: evm || null,
        solana_address: solana || null
      })
      .eq("id", userId);

    if (error) {
      console.error("Error saving wallet addresses:", error);
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

      toast("Logged in successfully");
      setShowPasswordInput(false);
      setPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast("Logged out successfully");
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Address copied to clipboard");
  };

  const handleConnectWallet = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    if (selectedNetwork.type === "solana") {
      await connectPhantom();
    } else {
      await connectMetaMask();
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  };

  if (user) {
    const address = walletAddress || "";
    const hasWallet = !!address;

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/30 bg-card/50 px-3 py-1.5 h-auto"
        >
          <Coins className="w-4 h-4" />
          <span className="font-semibold">${(credits / 10).toFixed(2)}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 border-primary/30 bg-card/50"
            >
              <img 
                src={selectedNetwork.logo} 
                alt={selectedNetwork.name}
                className="w-5 h-5 rounded-full object-cover"
              />
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
                <img 
                  src={network.logo} 
                  alt={network.name}
                  className="w-5 h-5 rounded-full object-cover mr-2"
                />
                <span>{network.name}</span>
                {network.chainId === selectedNetwork.chainId && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasWallet ? (
          <div className="relative">
            <Button
              variant="outline"
              className="gap-2 border-primary/30 bg-card/50 min-w-[180px]"
              onMouseEnter={() => setShowLogout(true)}
              onMouseLeave={() => setShowLogout(false)}
              onClick={() => {
                onAccountClick?.();
                copyAddress();
              }}
            >
              <div className="flex-1 flex flex-col items-start">
                <span className="font-mono text-xs">{shortenAddress(address)}</span>
                <span className="text-xs text-muted-foreground">
                  {connectedWallet ? `${connectedWallet} connected` : "USDC"}
                </span>
              </div>
              <Copy className="w-4 h-4 ml-2" />
            </Button>
            
            {showLogout && (
              <div 
                className="absolute top-full right-0 mt-1 z-50"
                onMouseEnter={() => setShowLogout(true)}
                onMouseLeave={() => setShowLogout(false)}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="border-border/50 bg-background shadow-lg"
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            className="gap-2 border-primary/30 bg-card/50"
            onClick={handleConnectWallet}
            disabled={isConnecting}
          >
            <Wallet className="w-4 h-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
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
