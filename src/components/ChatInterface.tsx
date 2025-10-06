import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onClose: () => void;
}

export const ChatInterface = ({ onClose }: ChatInterfaceProps) => {
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
    <Card className="fixed top-4 right-4 w-96 h-[600px] shadow-xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
        <CardTitle className="text-lg">AI Assistant</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};