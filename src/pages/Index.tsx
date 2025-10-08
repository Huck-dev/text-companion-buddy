import { useState } from "react";
import { Server } from "lucide-react";
import { UnifiedServersPanel } from "@/components/UnifiedServersPanel";
import { UserMenu } from "@/components/UserMenu";
import { CreditsPanel } from "@/components/CreditsPanel";
import { FriendsPanel } from "@/components/FriendsPanel";
import { ExecutionsPanel } from "@/components/ExecutionsPanel";
import { LogoCube } from "@/components/LogoCube";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<{ name: string; chainId: number; type: string } | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [addresses, setAddresses] = useState<{ evm: string; solana: string }>({ evm: "", solana: "" });

  return (
    <div className="min-h-screen w-full flex relative" style={{ background: "var(--gradient-hero)" }}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-xl px-6 shadow-lg relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10 flex-1">
            <LogoCube />
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Servers
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <UserMenu onNetworkChange={setSelectedNetwork} onAddressesChange={(evm, sol) => setAddresses({ evm, solana: sol })} onAccountClick={() => setIsAccountOpen(true)} />
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <UnifiedServersPanel />
        </main>
      </div>

      {/* Right-side Account Sheet */}
      <Sheet open={isAccountOpen} onOpenChange={setIsAccountOpen}>
        <SheetContent side="right" className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <Tabs defaultValue="account" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="executions">Executions</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account" className="mt-4">
              <CreditsPanel selectedNetwork={selectedNetwork} addresses={addresses} />
            </TabsContent>
            
            <TabsContent value="executions" className="mt-4">
              <ExecutionsPanel />
            </TabsContent>
            
            <TabsContent value="friends" className="mt-4">
              <FriendsPanel />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
