import { Settings, Wrench } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ToolsPanel } from "@/components/ToolsPanel";

interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

interface AppSidebarProps {
  model: string;
  temperature: number;
  maxTokens: number;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temp: number) => void;
  onMaxTokensChange: (tokens: number) => void;
  tools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
}

export function AppSidebar({
  model,
  temperature,
  maxTokens,
  onModelChange,
  onTemperatureChange,
  onMaxTokensChange,
  tools,
  onToolsChange,
}: AppSidebarProps) {
  const { state } = useSidebar();

  return (
    <Sidebar
      className={state === "collapsed" ? "w-14" : "w-80"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Settings className="w-4 h-4 mr-2" />
            {state !== "collapsed" && "Configuration"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="w-full">
                  {state !== "collapsed" && (
                    <>
                      <SettingsPanel
                        model={model}
                        temperature={temperature}
                        maxTokens={maxTokens}
                        onModelChange={onModelChange}
                        onTemperatureChange={onTemperatureChange}
                        onMaxTokensChange={onMaxTokensChange}
                      />
                      <div className="mt-4">
                        <ToolsPanel tools={tools} onToolsChange={onToolsChange} />
                      </div>
                    </>
                  )}
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
