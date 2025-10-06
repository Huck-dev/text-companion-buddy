import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Server, User, Cpu, MessageCircle } from "lucide-react";
import { ServersPanel } from "@/components/ServersPanel";
import { CreditsPanel } from "@/components/CreditsPanel";
import { ComputePanel } from "@/components/ComputePanel";
import { UserMenu } from "@/components/UserMenu";
import { ChatInterface } from "@/components/ChatInterface";

const Index = () => {
  const [activeTab, setActiveTab] = useState("compute");
  const [showChat, setShowChat] = useState(false);

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
        
        <div className="flex items-center gap-2">
          <UserMenu />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="border-primary/30"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {showChat && <ChatInterface onClose={() => setShowChat(false)} />}

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
