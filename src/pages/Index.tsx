import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, User } from "lucide-react";
import { MCPServerPanel } from "@/components/MCPServerPanel";
import { CreditsPanel } from "@/components/CreditsPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SpinningCube } from "@/components/SpinningCube";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: any[];
}


const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500);
  const [mcpServers, setMCPServers] = useState<Array<{ name: string; url: string; status: "connected" | "disconnected" }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Map "self-hosted" to actual Gemini model
      const actualModel = model === "self-hosted" ? "google/gemini-2.5-flash" : model;
      
      const { data, error } = await supabase.functions.invoke("text-completion", {
        body: {
          prompt: input,
          settings: {
            model: actualModel,
            temperature,
            max_tokens: maxTokens,
          },
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content || "No response generated",
        toolCalls: data.choices[0].message.tool_calls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <MainLayout
        model={model}
        temperature={temperature}
        maxTokens={maxTokens}
        onModelChange={setModel}
        onTemperatureChange={setTemperature}
        onMaxTokensChange={setMaxTokens}
        messages={messages}
        input={input}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        mcpServers={mcpServers}
        onServersChange={setMCPServers}
      />
    </SidebarProvider>
  );
};

function MainLayout({
  model,
  temperature,
  maxTokens,
  onModelChange,
  onTemperatureChange,
  onMaxTokensChange,
  messages,
  input,
  isLoading,
  messagesEndRef,
  onInputChange,
  onSubmit,
  mcpServers,
  onServersChange,
}: {
  model: string;
  temperature: number;
  maxTokens: number;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temp: number) => void;
  onMaxTokensChange: (tokens: number) => void;
  messages: Message[];
  input: string;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onInputChange: (input: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  mcpServers: Array<{ name: string; url: string; status: "connected" | "disconnected" }>;
  onServersChange: (servers: Array<{ name: string; url: string; status: "connected" | "disconnected" }>) => void;
}) {
  const { toggleSidebar, open, setOpen } = useSidebar();
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && mainContentRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-background via-background to-background/95">
      <AppSidebar
        model={model}
        temperature={temperature}
        maxTokens={maxTokens}
        onModelChange={onModelChange}
        onTemperatureChange={onTemperatureChange}
        onMaxTokensChange={onMaxTokensChange}
        messages={messages}
        input={input}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />
      
      <div ref={mainContentRef} className="flex-1 flex flex-col">
        <header className="h-16 flex items-center border-b border-border/50 bg-card/30 backdrop-blur-sm px-4">
          <SpinningCube onClick={toggleSidebar} />
        </header>

          <main className="flex-1 container mx-auto px-4 py-6">
            <Tabs defaultValue="mcp" className="w-full h-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="mcp">
                  <Server className="w-4 h-4 mr-2" />
                  MCP
                </TabsTrigger>
                <TabsTrigger value="account">
                  <User className="w-4 h-4 mr-2" />
                  Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mcp" className="space-y-4">
                <MCPServerPanel servers={mcpServers} onServersChange={onServersChange} />
              </TabsContent>

              <TabsContent value="account" className="space-y-4">
                <CreditsPanel />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
  );
}

export default Index;
