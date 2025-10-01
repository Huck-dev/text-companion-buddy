import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { ethers } from "ethers";

interface WalletConnectProps {
  onWalletConnected?: (address: string, walletType: 'metamask' | 'subwallet') => void;
  onStripePayment?: () => void;
}

export const WalletConnect = ({ onWalletConnected, onStripePayment }: WalletConnectProps) => {
  const [connectedAddress, setConnectedAddress] = useState<string>("");
  const [walletType, setWalletType] = useState<'metamask' | 'subwallet' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const address = accounts[0].address;
          setConnectedAddress(address);
          // Check which wallet is connected
          if (window.ethereum.isMetaMask) {
            setWalletType('metamask');
          } else {
            setWalletType('subwallet');
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not found. Please install MetaMask extension.");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setConnectedAddress(address);
      setWalletType('metamask');
      onWalletConnected?.(address, 'metamask');
      toast.success("MetaMask connected successfully!");
    } catch (error: any) {
      console.error("MetaMask connection error:", error);
      toast.error(error.message || "Failed to connect MetaMask");
    } finally {
      setIsConnecting(false);
    }
  };

  const connectSubwallet = async () => {
    if (!window.ethereum) {
      toast.error("Subwallet not found. Please install Subwallet extension.");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setConnectedAddress(address);
      setWalletType('subwallet');
      onWalletConnected?.(address, 'subwallet');
      toast.success("Subwallet connected successfully!");
    } catch (error: any) {
      console.error("Subwallet connection error:", error);
      toast.error(error.message || "Failed to connect Subwallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setConnectedAddress("");
    setWalletType(null);
    toast.success("Wallet disconnected");
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet
        </CardTitle>
        <CardDescription>
          Connect wallet or use card payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectedAddress ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <div className="font-medium">
                  {walletType === 'metamask' ? 'MetaMask' : 'Subwallet'} Connected
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatAddress(connectedAddress)}
                </div>
              </div>
            </div>
            <Button onClick={disconnect} variant="outline" className="w-full">
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={connectSubwallet}
              disabled={isConnecting}
              className="w-full justify-start"
              variant="default"
            >
              <Wallet className="h-5 w-5 mr-2" />
              Connect Subwallet (MOD)
            </Button>
            <Button
              onClick={connectMetaMask}
              disabled={isConnecting}
              className="w-full justify-start"
              variant="outline"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                alt="MetaMask"
                className="h-5 w-5 mr-2"
              />
              Connect MetaMask (USDC)
            </Button>
          </div>
        )}
        
        <div className="pt-4 border-t">
          <Button
            onClick={onStripePayment}
            variant="outline"
            className="w-full justify-start"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Pay with Card (Stripe)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

declare global {
  interface Window {
    ethereum?: any;
  }
}
