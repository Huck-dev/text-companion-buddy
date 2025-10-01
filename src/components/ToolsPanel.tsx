import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

interface ToolsPanelProps {
  tools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
}

export const ToolsPanel = ({ tools, onToolsChange }: ToolsPanelProps) => {
  const [showAddTool, setShowAddTool] = useState(false);
  const [newTool, setNewTool] = useState({
    name: "",
    description: "",
    parameters: "{}",
  });

  const handleAddTool = () => {
    try {
      const parameters = JSON.parse(newTool.parameters);
      const tool: Tool = {
        type: "function",
        function: {
          name: newTool.name,
          description: newTool.description,
          parameters,
        },
      };
      onToolsChange([...tools, tool]);
      setNewTool({ name: "", description: "", parameters: "{}" });
      setShowAddTool(false);
    } catch (error) {
      alert("Invalid JSON in parameters");
    }
  };

  const handleRemoveTool = (index: number) => {
    onToolsChange(tools.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">MCP Tools</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddTool(!showAddTool)}
          className="border-primary/50 hover:bg-primary/10"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Tool
        </Button>
      </div>

      <div className="space-y-3">
        {tools.length === 0 && !showAddTool && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center py-2">
              Example tools below. Click Add Tool to create custom ones.
            </p>
            <div className="space-y-2 opacity-60">
              <Card className="p-3 bg-secondary/50 border-border/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">function</Badge>
                      <span className="text-sm font-medium text-foreground">get_weather</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Get current weather for a location</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3 bg-secondary/50 border-border/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">function</Badge>
                      <span className="text-sm font-medium text-foreground">search_web</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Search the web for information</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3 bg-secondary/50 border-border/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">function</Badge>
                      <span className="text-sm font-medium text-foreground">calculate</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Perform mathematical calculations</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tools.map((tool, index) => (
          <Card key={index} className="p-3 bg-secondary/50 border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {tool.type}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">
                    {tool.function.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tool.function.description}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveTool(index)}
                className="h-6 w-6 text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}

        {showAddTool && (
          <Card className="p-4 bg-secondary/30 border-primary/30">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-foreground">Function Name</Label>
                <Input
                  value={newTool.name}
                  onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                  placeholder="get_weather"
                  className="bg-background border-border"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-foreground">Description</Label>
                <Input
                  value={newTool.description}
                  onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                  placeholder="Get current weather for a location"
                  className="bg-background border-border"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-foreground">Parameters (JSON)</Label>
                <Textarea
                  value={newTool.parameters}
                  onChange={(e) => setNewTool({ ...newTool, parameters: e.target.value })}
                  placeholder='{"type": "object", "properties": {...}}'
                  className="font-mono text-xs bg-background border-border h-24"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddTool}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddTool(false)}
                  className="flex-1 border-border"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
};
