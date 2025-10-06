import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Server, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ServerInfo {
  name: string;
  url: string;
  type: "mcp" | "a2a" | "misc";
  status: "connected" | "disconnected";
  schema?: Record<string, any>;
}

interface ServersPanelProps {
  servers: ServerInfo[];
  onServersChange: (servers: ServerInfo[]) => void;
}

export const ServersPanel = ({ servers, onServersChange }: ServersPanelProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServer, setNewServer] = useState({ name: "", url: "", type: "misc" as "mcp" | "a2a" | "misc" });
  const [detecting, setDetecting] = useState(false);

  const detectServerType = async (url: string): Promise<{ type: "mcp" | "a2a" | "misc"; schema?: Record<string, any> }> => {
    try {
      const infoUrl = url.endsWith('/') ? `${url}info` : `${url}/info`;
      const response = await fetch(infoUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const info = await response.json();
      
      // Detect server type based on response structure
      if (info.protocol === 'mcp' || info.type === 'mcp' || info.mcpVersion) {
        return { type: 'mcp', schema: info };
      } else if (info.protocol === 'a2a' || info.type === 'a2a' || info.agentCapabilities) {
        return { type: 'a2a', schema: info };
      } else {
        return { type: 'misc', schema: info };
      }
    } catch (error) {
      console.error('Failed to detect server type:', error);
      return { type: 'misc' };
    }
  };

  const handleDetectType = async () => {
    if (!newServer.url) {
      toast.error("Please enter a URL first");
      return;
    }

    setDetecting(true);
    try {
      const { type, schema } = await detectServerType(newServer.url);
      setNewServer({ ...newServer, type });
      toast.success(`Detected server type: ${type.toUpperCase()}`);
      console.log('Server schema:', schema);
    } catch (error) {
      toast.error("Failed to detect server type");
    } finally {
      setDetecting(false);
    }
  };

  const handleAddServer = async () => {
    if (!newServer.name || !newServer.url) {
      toast.error("Please enter both name and URL");
      return;
    }

    // Detect server type if not already detected
    let serverType = newServer.type;
    let schema;
    
    if (newServer.type === 'misc') {
      const detected = await detectServerType(newServer.url);
      serverType = detected.type;
      schema = detected.schema;
    }

    const server: ServerInfo = {
      name: newServer.name,
      url: newServer.url,
      type: serverType,
      status: "connected",
      schema
    };

    onServersChange([...servers, server]);
    setNewServer({ name: "", url: "", type: "misc" });
    setShowAddForm(false);
    toast.success(`${serverType.toUpperCase()} server added successfully!`);
  };

  const handleRemoveServer = (index: number) => {
    const updatedServers = servers.filter((_, i) => i !== index);
    onServersChange(updatedServers);
    toast.success("Server removed");
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mcp':
        return 'bg-blue-500';
      case 'a2a':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    return status === "connected" ? "bg-green-500" : "bg-red-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Server Management
          </h2>
          <p className="text-muted-foreground">
            Manage MCP, A2A, and custom servers
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Server
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-6 border-primary/30">
          <h3 className="text-lg font-semibold mb-4">Add New Server</h3>
          <div className="space-y-4">
            <div>
              <Label>Server Name</Label>
              <Input
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                placeholder="My Server"
              />
            </div>
            <div>
              <Label>Server URL</Label>
              <div className="flex gap-2">
                <Input
                  value={newServer.url}
                  onChange={(e) => setNewServer({ ...newServer, url: e.target.value })}
                  placeholder="https://my-server.com"
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={handleDetectType}
                  disabled={detecting}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
                  Detect
                </Button>
              </div>
            </div>
            <div>
              <Label>Server Type</Label>
              <Select 
                value={newServer.type} 
                onValueChange={(value: "mcp" | "a2a" | "misc") => setNewServer({ ...newServer, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcp">MCP (Model Context Protocol)</SelectItem>
                  <SelectItem value="a2a">A2A (Agent-to-Agent)</SelectItem>
                  <SelectItem value="misc">Misc (Custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddServer}>Add Server</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {servers.length === 0 ? (
          <Card className="p-8 text-center">
            <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No servers configured yet</p>
          </Card>
        ) : (
          servers.map((server, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{server.name}</h3>
                    <Badge className={getTypeColor(server.type)}>
                      {server.type.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(server.status)}>
                      {server.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{server.url}</p>
                  {server.schema && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        View Schema
                      </summary>
                      <pre className="mt-2 p-2 bg-secondary/50 rounded overflow-x-auto">
                        {JSON.stringify(server.schema, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveServer(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
