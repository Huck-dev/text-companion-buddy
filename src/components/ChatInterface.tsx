import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! How can I help you today?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages([...messages, { role: "user", content: input }]);
    setInput("");

    // Simulate response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm a demo assistant. Connect me to your AI backend!" 
      }]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pb-4">
        <div className="space-y-4 pr-4">
          {messages.map((msg, idx) => (
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
                <span className="relative">{msg.content}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="pt-4 border-t border-border/50 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-secondary/50 border-border/50 focus:border-primary/50 transition-all duration-300"
        />
        <Button 
          type="submit" 
          size="sm"
          className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};