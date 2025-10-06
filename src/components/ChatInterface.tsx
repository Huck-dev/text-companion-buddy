import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MODELS = [
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (Default)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "openai/gpt-5", label: "GPT-5" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { value: "openai/gpt-5-nano", label: "GPT-5 Nano" },
];

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const { toast } = useToast();

  const streamChat = async (userMessage: Message) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
    
    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate Limit",
            description: "Too many requests. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Credits Required",
            description: "Please add credits to your workspace.",
            variant: "destructive",
          });
          return;
        }
        throw new Error("Failed to start stream");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      while (true) {
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
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => 
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    await streamChat(userMessage);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="pb-4 mb-4 border-b border-border/50">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-full bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1 pb-4">
        <div className="space-y-4 pr-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Select a model and start chatting</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3.5 shadow-lg transition-all duration-300 hover:shadow-xl ${
                    msg.role === "user"
                      ? "text-primary-foreground relative overflow-hidden"
                      : "bg-card/80 backdrop-blur-sm border border-border/50"
                  }`}
                  style={msg.role === "user" ? { background: "var(--gradient-primary)" } : {}}
                >
                  {msg.role === "user" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                  )}
                  <span className="relative whitespace-pre-wrap">{msg.content}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="pt-4 border-t border-border/50 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-secondary/50 border-border/50 focus:border-primary/50 transition-all duration-300"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          size="sm"
          disabled={isLoading || !input.trim()}
          className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};