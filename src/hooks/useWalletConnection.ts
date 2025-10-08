import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";

declare global {
  interface Window {
    ethereum?: any;
    SubWallet?: any;
    solana?: any;
  }
}

export type WalletType = "metamask" | "phantom" | "subwallet";
export type NetworkType = "evm" | "solana";

export const useWalletConnection = () => {
  const [evmAddress, setEvmAddress] = useState<string>("");
  const [solanaAddress, setSolanaAddress] = useState<string>("");
  const [connectedWallet, setConnectedWallet] = useState<WalletType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for existing connections on mount
  useEffect(() => {
    checkExistingConnections();
  }, []);

  const checkExistingConnections = async () => {
    // Check MetaMask
    if (window.ethereum?.isMetaMask) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setEvmAddress(accounts[0]);
          setConnectedWallet("metamask");
        }
      } catch (error) {
        console.error("Error checking MetaMask:", error);
      }
    }

    // Check Phantom
    if (window.solana?.isPhantom) {
      try {
        const response = await window.solana.connect({ onlyIfTrusted: true });
        setSolanaAddress(response.publicKey.toString());
        setConnectedWallet("phantom");
      } catch (error) {
        // User hasn't connected yet
      }
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum?.isMetaMask) {
      toast.error("MetaMask not installed");
      window.open("https://metamask.io/download/", "_blank");
      return null;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      
      setEvmAddress(address);
      setConnectedWallet("metamask");
      toast.success("MetaMask connected!");
      return address;
    } catch (error: any) {
      console.error("MetaMask connection error:", error);
      toast.error(error.message || "Failed to connect MetaMask");
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const connectPhantom = async () => {
    if (!window.solana?.isPhantom) {
      toast.error("Phantom wallet not installed");
      window.open("https://phantom.app/", "_blank");
      return null;
    }

    setIsConnecting(true);
    try {
      const response = await window.solana.connect();
      const address = response.publicKey.toString();
      
      setSolanaAddress(address);
      setConnectedWallet("phantom");
      toast.success("Phantom wallet connected!");
      return address;
    } catch (error: any) {
      console.error("Phantom connection error:", error);
      toast.error(error.message || "Failed to connect Phantom");
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const connectSubWallet = async (networkType: NetworkType) => {
    const subWallet = window.SubWallet || window.ethereum;
    
    if (!subWallet) {
      toast.error("SubWallet not installed");
      window.open("https://subwallet.app/download.html", "_blank");
      return null;
    }

    setIsConnecting(true);
    try {
      if (networkType === "evm") {
        const provider = new ethers.BrowserProvider(subWallet);
        const accounts = await provider.send("eth_requestAccounts", []);
        const address = accounts[0];
        
        setEvmAddress(address);
        setConnectedWallet("subwallet");
        toast.success("SubWallet connected!");
        return address;
      } else {
        // Solana support for SubWallet
        if (window.solana) {
          const response = await window.solana.connect();
          const address = response.publicKey.toString();
          
          setSolanaAddress(address);
          setConnectedWallet("subwallet");
          toast.success("SubWallet (Solana) connected!");
          return address;
        }
      }
    } catch (error: any) {
      console.error("SubWallet connection error:", error);
      toast.error(error.message || "Failed to connect SubWallet");
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setEvmAddress("");
    setSolanaAddress("");
    setConnectedWallet(null);
    toast.success("Wallet disconnected");
  };

  return {
    evmAddress,
    solanaAddress,
    connectedWallet,
    isConnecting,
    connectMetaMask,
    connectPhantom,
    connectSubWallet,
    disconnectWallet,
  };
};
