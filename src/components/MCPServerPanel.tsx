import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Server } from "lucide-react";
import { toast } from "sonner";

interface MCPServer {
  name: string;
  url: string;
  status: "connected" | "disconnected";
}

interface MCPServerPanelProps {
  servers: MCPServer[];
  onServersChange: (servers: MCPServer[]) => void;
}

export const MCPServerPanel = ({ servers, onServersChange }: MCPServerPanelProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServer, setNewServer] = useState({ name: "", url: "" });

  const handleAddServer = () => {
    if (!newServer.name || !newServer.url) {
      toast.error("Please enter both name and URL");
      return;
    }

    const server: MCPServer = {
      ...newServer,
      status: "connected"
    };

    onServersChange([...servers, server]);
    setNewServer({ name: "", url: "" });
    setShowAddForm(false);
    toast.success("MCP server added");
  };

  const handleRemoveServer = (index: number) => {
    const updated = servers.filter((_, i) => i !== index);
    onServersChange(updated);
    toast.success("MCP server removed");
  };

  const exampleServers = [
    { name: "Weather API", url: "mcp://weather.example.com", status: "connected" as const },
    { name: "Database Tools", url: "mcp://db.example.com", status: "connected" as const },
  ];

  const displayServers = servers.length > 0 ? servers : exampleServers;

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          MCP Servers
        </CardTitle>
        <CardDescription>
          Manage Model Context Protocol server connections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {displayServers.map((server, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-background/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    server.status === "connected" ? "bg-green-500" : "bg-red-500"
                  }`} />
                  <h4 className="font-medium">{server.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{server.url}</p>
              </div>
              {servers.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveServer(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {servers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Example servers shown above. Add your own to get started.
            </p>
          )}
        </div>

        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="w-full border-primary/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add MCP Server
          </Button>
        ) : (
          <div className="space-y-3 p-4 rounded-lg border border-primary/20 bg-background/30">
            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name</Label>
              <Input
                id="server-name"
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                placeholder="e.g., Weather API"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-url">Server URL</Label>
              <Input
                id="server-url"
                value={newServer.url}
                onChange={(e) => setNewServer({ ...newServer, url: e.target.value })}
                placeholder="e.g., mcp://weather.example.com"
                className="bg-background/50"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddServer} className="flex-1">
                Add Server
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewServer({ name: "", url: "" });
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
