import { Settings, Send, Loader2, MessageSquare, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: any[];
}

interface AppSidebarProps {
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
}

export function AppSidebar({
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
}: AppSidebarProps) {
  const { state } = useSidebar();

  if (state === "collapsed") {
    return (
      <Sidebar className="w-0 opacity-0 pointer-events-none" collapsible="icon">
        <SidebarContent />
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-96 transition-all duration-300" collapsible="icon">
      <SidebarContent className="flex flex-col h-full p-4">
        {/* Chat Section */}
        <SidebarGroup className="flex-1 flex flex-col min-h-0 space-y-2">
          <SidebarGroupLabel className="text-sm font-semibold px-0">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full p-4">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Start a conversation
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pr-2">
                  {messages.map((message, index) => (
                    <ChatMessage key={index} {...message} />
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>AI is thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Form */}
            <form onSubmit={onSubmit} className="relative mt-3">
              <Textarea
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Type your message..."
                className="pr-10 min-h-[70px] resize-none bg-secondary/50 border-border focus-visible:ring-primary text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 bottom-2 h-7 w-7 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </Button>
            </form>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Section */}
        <SidebarGroup className="pt-4 border-t border-border/50">
          <SidebarGroupLabel className="text-sm font-semibold px-0 mb-3">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SettingsPanel
              model={model}
              temperature={temperature}
              maxTokens={maxTokens}
              onModelChange={onModelChange}
              onTemperatureChange={onTemperatureChange}
              onMaxTokensChange={onMaxTokensChange}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
