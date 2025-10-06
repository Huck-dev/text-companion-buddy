import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Server, User, Cpu, Bot } from "lucide-react";
import { ServersPanel } from "@/components/ServersPanel";
import { CreditsPanel } from "@/components/CreditsPanel";
import { ComputePanel } from "@/components/ComputePanel";
import { UserMenu } from "@/components/UserMenu";
import { ChatInterface } from "@/components/ChatInterface";
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar";

const Index = () => {
  const [activeTab, setActiveTab] = useState("compute");
  const [selectedNetwork, setSelectedNetwork] = useState<{ name: string; chainId: number; type: string } | null>(null);

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex" style={{ background: "var(--gradient-hero)" }}>
        <Sidebar className="border-r border-border/50 backdrop-blur-xl bg-card/40">
          <SidebarContent className="p-4">
            <ChatInterface />
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-xl px-6 shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <SidebarTrigger className="hover:bg-primary/10 transition-all duration-300 hover:scale-110">
                <Bot className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
              </SidebarTrigger>
              
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
    </SidebarProvider>
  );
};

export default Index;
