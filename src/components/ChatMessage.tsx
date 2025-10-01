import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, User } from "lucide-react";

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

export const ChatMessage = ({ role, content, toolCalls }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className={`flex gap-4 mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser ? "bg-primary" : "bg-accent"
        }`}>
          {isUser ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
          <Card className={`p-4 ${
            isUser 
              ? "bg-primary/10 border-primary/20" 
              : "bg-card border-border"
          }`}>
            <p className="text-foreground whitespace-pre-wrap">{content}</p>
          </Card>

          {toolCalls && toolCalls.length > 0 && (
            <div className="flex flex-col gap-2">
              {toolCalls.map((tool) => (
                <Card key={tool.id} className="p-3 bg-accent/5 border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Tool Call
                    </Badge>
                    <span className="text-sm font-medium text-accent">
                      {tool.function.name}
                    </span>
                  </div>
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                    {JSON.stringify(JSON.parse(tool.function.arguments), null, 2)}
                  </pre>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
