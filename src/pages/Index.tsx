import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, User, Cpu, X } from "lucide-react";
import { ServersPanel } from "@/components/ServersPanel";
import { CreditsPanel } from "@/components/CreditsPanel";
import { ComputePanel } from "@/components/ComputePanel";
import { UserMenu } from "@/components/UserMenu";
import { ChatInterface } from "@/components/ChatInterface";
import { SpinningCube } from "@/components/SpinningCube";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [activeTab, setActiveTab] = useState("compute");
  const [selectedNetwork, setSelectedNetwork] = useState<{ name: string; chainId: number; type: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex relative" style={{ background: "var(--gradient-hero)" }}>
      {/* Spinning Cube - Always visible in far left corner */}
      <div className="fixed top-6 left-6 z-50">
        <SpinningCube onClick={() => setIsChatOpen(!isChatOpen)} />
      </div>

      {/* Collapsible Chat Interface */}
      <div
        className={`fixed left-0 top-0 h-full transition-all duration-500 ease-in-out z-40 ${
          isChatOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "400px" }}
      >
        <div className="h-full border-r border-border/50 backdrop-blur-xl bg-card/95 shadow-2xl">
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Assistant
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(false)}
                className="hover:bg-destructive/20 hover:text-destructive"
              >
                <X className="w-4 h-4" />
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
        <header className="h-16 flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-xl px-6 shadow-lg relative ml-20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10 flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-secondary/50 backdrop-blur-sm">
                <TabsTrigger value="compute" className="data-[state=active]:bg-primary/20">
                  <Cpu className="w-4 h-4 mr-2" />
                  Compute
                </TabsTrigger>
                <TabsTrigger value="servers" className="data-[state=active]:bg-primary/20">
                  <Server className="w-4 h-4 mr-2" />
                  Servers
                </TabsTrigger>
                <TabsTrigger value="account" className="data-[state=active]:bg-primary/20">
                  <User className="w-4 h-4 mr-2" />
                  Account
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <UserMenu onNetworkChange={setSelectedNetwork} />
        </header>

        <main className="container mx-auto px-6 py-8">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="compute" className="space-y-4 animate-fade-in">
              <ComputePanel />
            </TabsContent>

            <TabsContent value="servers" className="space-y-4 animate-fade-in">
              <ServersPanel />
            </TabsContent>

            <TabsContent value="account" className="space-y-4 animate-fade-in">
              <CreditsPanel selectedNetwork={selectedNetwork} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Index;
