import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, User, Cpu } from "lucide-react";
import { ServersPanel } from "@/components/ServersPanel";
import { CreditsPanel } from "@/components/CreditsPanel";
import { ComputePanel } from "@/components/ComputePanel";
import { UserMenu } from "@/components/UserMenu";

const Index = () => {
  const [activeTab, setActiveTab] = useState("compute");

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-background/95">
      <header className="h-16 flex items-center justify-between border-b border-border/50 bg-card/30 backdrop-blur-sm px-4">
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
  );
};

export default Index;
