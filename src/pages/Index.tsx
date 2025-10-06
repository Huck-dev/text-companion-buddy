import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, User, Cpu } from "lucide-react";
import { MCPServerPanel } from "@/components/MCPServerPanel";
import { CreditsPanel } from "@/components/CreditsPanel";
import { ComputePanel } from "@/components/ComputePanel";
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
      const actualModel = model === "self-hosted" ? "google/gemini-2.5-flash" : model;
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: actualModel,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (resp.status === 429) {
        toast({
          title: "Rate Limit",
          description: "Too many requests. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      if (resp.status === 402) {
        toast({
          title: "Payment Required",
          description: "Please add credits to your workspace.",
          variant: "destructive",
        });
        return;
      }

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to start stream");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
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
  const [activeTab, setActiveTab] = useState("compute");

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
        <header className="h-16 flex items-center border-b border-border/50 bg-card/30 backdrop-blur-sm px-4 gap-4">
          <SpinningCube onClick={toggleSidebar} />
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="compute">
                <Cpu className="w-4 h-4 mr-2" />
                Compute
              </TabsTrigger>
              <TabsTrigger value="mcp">
                <Server className="w-4 h-4 mr-2" />
                MCP
              </TabsTrigger>
              <TabsTrigger value="account">
                <User className="w-4 h-4 mr-2" />
                Account
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

          <main className="flex-1 container mx-auto px-4 py-6">
            <Tabs value={activeTab} className="w-full h-full">
              <TabsContent value="compute" className="space-y-4">
                <ComputePanel />
              </TabsContent>

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
