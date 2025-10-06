import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, Sparkles, MessageSquare, Image, Volume2, Wrench, Server, Coins } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ImageGeneration } from "@/components/ImageGeneration";
import { SpeechTools } from "@/components/SpeechTools";
import { MCPServerPanel } from "@/components/MCPServerPanel";
import { CreditsPanel } from "@/components/CreditsPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: any[];
}

interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500);
  const [tools, setTools] = useState<Tool[]>([]);
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
            tools: tools.length > 0 ? tools : undefined,
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

      if (data.choices[0].message.tool_calls) {
        toast({
          title: "Tools Used",
          description: `The AI used ${data.choices[0].message.tool_calls.length} tool(s) to generate this response.`,
        });
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
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-background via-background to-background/95">
        <AppSidebar
          model={model}
          temperature={temperature}
          maxTokens={maxTokens}
          onModelChange={setModel}
          onTemperatureChange={setTemperature}
          onMaxTokensChange={setMaxTokens}
          tools={tools}
          onToolsChange={setTools}
        />
        
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border/50 bg-card/30 backdrop-blur-sm px-4">
            <SidebarTrigger />
          </header>

          <main className="flex-1 container mx-auto px-4 py-6">
            <Tabs defaultValue="chat" className="w-full h-full">
              <TabsList className="grid w-full grid-cols-6 mb-6">
                <TabsTrigger value="chat">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="image">
                  <Image className="w-4 h-4 mr-2" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="speech">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Speech
                </TabsTrigger>
                <TabsTrigger value="video">
                  <Wrench className="w-4 h-4 mr-2" />
                  Video
                </TabsTrigger>
                <TabsTrigger value="mcp">
                  <Server className="w-4 h-4 mr-2" />
                  MCP
                </TabsTrigger>
                <TabsTrigger value="credits">
                  <Coins className="w-4 h-4 mr-2" />
                  Credits
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="space-y-4">
                {/* Messages */}
                <div className="min-h-[500px] max-h-[600px] overflow-y-auto p-6 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                          <Sparkles className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            Start a Conversation
                          </h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Type a message to begin. The AI can use tools and functions you configure
                            to provide enhanced responses.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {messages.map((message, index) => (
                        <ChatMessage key={index} {...message} />
                      ))}
                      {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message here..."
                    className="pr-12 min-h-[100px] resize-none bg-card border-border focus-visible:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 bottom-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                <ImageGeneration />
              </TabsContent>

              <TabsContent value="speech" className="space-y-4">
                <SpeechTools />
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <div className="p-8 text-center bg-card/30 rounded-lg border border-border/50">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Video Generation</h3>
                  <p className="text-muted-foreground">
                    Video generation coming soon. This will integrate with video AI models for content creation.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="mcp" className="space-y-4">
                <MCPServerPanel servers={mcpServers} onServersChange={setMCPServers} />
              </TabsContent>

              <TabsContent value="credits" className="space-y-4">
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
