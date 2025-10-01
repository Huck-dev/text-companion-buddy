import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, Sparkles, MessageSquare, Image, Volume2, Wrench } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ToolsPanel } from "@/components/ToolsPanel";
import { ImageGeneration } from "@/components/ImageGeneration";
import { SpeechTools } from "@/components/SpeechTools";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      const { data, error } = await supabase.functions.invoke("text-completion", {
        body: {
          prompt: input,
          settings: {
            model,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-6 py-3 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full border border-primary/30">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Mod Chain
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Multi-modal AI platform with text, image, video, and speech generation plus MCP tools
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Settings Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <SettingsPanel
              model={model}
              temperature={temperature}
              maxTokens={maxTokens}
              onModelChange={setModel}
              onTemperatureChange={setTemperature}
              onMaxTokensChange={setMaxTokens}
            />
            <ToolsPanel tools={tools} onToolsChange={setTools} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
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
              </TabsList>

              <TabsContent value="chat" className="flex flex-col h-[calc(100vh-340px)]">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto mb-4 p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
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

              <TabsContent value="image">
                <ImageGeneration />
              </TabsContent>

              <TabsContent value="speech">
                <SpeechTools />
              </TabsContent>

              <TabsContent value="video">
                <div className="p-8 text-center bg-card/50 rounded-lg border border-border">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Video Generation</h3>
                  <p className="text-muted-foreground">
                    Video generation coming soon. This will integrate with video AI models for content creation.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
