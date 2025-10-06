import { useState } from "react";
import { Server, X } from "lucide-react";
import { UnifiedServersPanel } from "@/components/UnifiedServersPanel";
import { UserMenu } from "@/components/UserMenu";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { LogoCube } from "@/components/LogoCube";

const Index = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<{ name: string; chainId: number; type: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [addresses, setAddresses] = useState<{ evm: string; solana: string }>({ evm: "", solana: "" });

  return (
    <div className="min-h-screen w-full flex relative" style={{ background: "var(--gradient-hero)" }}>
      {/* Collapsible Chat Interface */}
      <div
        className={`fixed left-0 top-0 h-full transition-all duration-500 ease-in-out z-40 ${
          isChatOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "420px" }}
      >
        <div className="h-full border-r border-border/50 backdrop-blur-xl bg-card/95 shadow-2xl">
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
                className="hover:bg-destructive/20 hover:text-destructive"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <ChatInterface />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-xl px-6 shadow-lg relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10 flex-1">
            <div onClick={() => setIsChatOpen(!isChatOpen)} className="cursor-pointer">
              <LogoCube />
            </div>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Servers
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <UserMenu onNetworkChange={setSelectedNetwork} onAddressesChange={(evm, sol) => setAddresses({ evm, solana: sol })} />
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <UnifiedServersPanel />
        </main>
      </div>
    </div>
  );
};

export default Index;
