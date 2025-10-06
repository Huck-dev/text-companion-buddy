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

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-background via-background to-background/95">
        <Sidebar className="border-r border-border/50">
          <SidebarContent className="p-4">
            <ChatInterface />
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b border-border/50 bg-card/30 backdrop-blur-sm px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-primary/10">
                <Bot className="w-5 h-5 text-primary" />
              </SidebarTrigger>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="grid w-full max-w-2xl grid-cols-3">
                  <TabsTrigger value="compute">
                    <Cpu className="w-4 h-4 mr-2" />
                    Compute
                  </TabsTrigger>
                  <TabsTrigger value="servers">
                    <Server className="w-4 h-4 mr-2" />
                    Servers
                  </TabsTrigger>
                  <TabsTrigger value="account">
                    <User className="w-4 h-4 mr-2" />
                    Account
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <UserMenu />
          </header>

          <main className="container mx-auto px-4 py-6">
            <Tabs value={activeTab} className="w-full">
              <TabsContent value="compute" className="space-y-4">
                <ComputePanel />
              </TabsContent>

              <TabsContent value="servers" className="space-y-4">
                <ServersPanel />
              </TabsContent>

              <TabsContent value="account" className="space-y-4">
                <CreditsPanel />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
