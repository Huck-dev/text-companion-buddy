import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Server, Plus, Monitor, Code, Lock, Unlock, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ServerDef {
  id: string;
  user_id: string;
  name: string;
  server_type: "mcp" | "a2a" | "misc";
  endpoint: string;
  is_public: boolean;
  code: string | null;
  app_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ComputeHost {
  id: string;
  name: string;
  server_type: string;
  status: string;
  location: string | null;
  compatible_server_types: string[];
}

export const ServersPanel = () => {
  const [servers, setServers] = useState<ServerDef[]>([]);
  const [hosts, setHosts] = useState<ComputeHost[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerDef | null>(null);
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServer, setNewServer] = useState({
    name: "",
    endpoint: "",
    description: "",
    is_public: false,
    code: "",
    app_url: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadServers();
    loadHosts();
  }, []);

  const loadServers = async () => {
    const { data, error } = await supabase
      .from("servers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading servers:", error);
      return;
    }
    setServers(data || []);
  };

  const loadHosts = async () => {
    const { data, error } = await supabase
      .from("compute_hosts")
      .select("*")
      .eq("status", "online");

    if (error) {
      console.error("Error loading hosts:", error);
      return;
    }
    setHosts(data || []);
  };

  const detectServerType = async (endpoint: string): Promise<"mcp" | "a2a" | "misc"> => {
    try {
      const infoUrl = endpoint.endsWith('/') ? `${endpoint}info` : `${endpoint}/info`;
      const response = await fetch(infoUrl);
      if (!response.ok) return "misc";
      
      const data = await response.json();
      
      if (data.protocol === "mcp" || data.mcpVersion || data.protocolVersion) {
        return "mcp";
      }
      
      if (data.agentCapabilities || data.agentType || data.a2aVersion) {
        return "a2a";
      }
      
      return "misc";
    } catch (error) {
      console.error("Error detecting server type:", error);
      return "misc";
    }
  };

  const addServer = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add a server.",
        variant: "destructive",
      });
      return;
    }

    const detectedType = await detectServerType(newServer.endpoint);
    
    const { error } = await supabase.from("servers").insert({
      user_id: userData.user.id,
      name: newServer.name,
      endpoint: newServer.endpoint,
      description: newServer.description || null,
      server_type: detectedType,
      is_public: newServer.is_public,
      code: newServer.code || null,
      app_url: newServer.app_url || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Server Added",
      description: `Detected as ${detectedType.toUpperCase()} server`,
    });

    await loadServers();
    setShowAddServer(false);
    setNewServer({ 
      name: "", 
      endpoint: "", 
      description: "", 
      is_public: false,
      code: "",
      app_url: "",
    });
  };

  const getCompatibleHosts = (serverType: string) => {
    return hosts.filter(host => 
      host.compatible_server_types?.includes(serverType) || 
      host.server_type === serverType
    );
  };

  const executeServer = async (serverId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("execute-server", {
        body: { server_id: serverId },
      });

      if (error) throw error;

      toast({
        title: "Execution Started",
        description: "Server execution has been initiated.",
      });
    } catch (error: any) {
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Servers
          </h2>
          <p className="text-muted-foreground">
            Manage your MCP, A2A, and custom servers
          </p>
        </div>
        <Button onClick={() => setShowAddServer(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Server
        </Button>
      </div>

      {showAddServer && (
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
              <Label>Endpoint URL</Label>
              <Input
                value={newServer.endpoint}
                onChange={(e) => setNewServer({ ...newServer, endpoint: e.target.value })}
                placeholder="http://localhost:8000"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Input
                value={newServer.description}
                onChange={(e) => setNewServer({ ...newServer, description: e.target.value })}
                placeholder="Server description"
              />
            </div>
            <div>
              <Label>Code (Optional)</Label>
              <Textarea
                value={newServer.code}
                onChange={(e) => setNewServer({ ...newServer, code: e.target.value })}
                placeholder="Paste your server code here..."
                className="font-mono text-sm h-32"
              />
            </div>
            <div>
              <Label>App URL (Optional)</Label>
              <Input
                value={newServer.app_url}
                onChange={(e) => setNewServer({ ...newServer, app_url: e.target.value })}
                placeholder="https://app.example.com"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newServer.is_public}
                onCheckedChange={(checked) => setNewServer({ ...newServer, is_public: checked })}
              />
              <Label>Make server public</Label>
              {newServer.is_public ? <Unlock className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
            </div>
            <div className="flex gap-2">
              <Button onClick={addServer}>Add Server</Button>
              <Button variant="outline" onClick={() => setShowAddServer(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {servers.length === 0 ? (
          <Card className="p-8 text-center">
            <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No servers added yet</p>
          </Card>
        ) : (
          servers.map((server) => (
            <Card key={server.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{server.name}</h3>
                    <Badge variant="secondary">{server.server_type.toUpperCase()}</Badge>
                    {server.is_public ? (
                      <Badge variant="outline" className="gap-1">
                        <Unlock className="w-3 h-3" /> Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="w-3 h-3" /> Private
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{server.endpoint}</p>
                  {server.description && (
                    <p className="text-sm text-muted-foreground">{server.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => executeServer(server.id)}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Execute
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedServer(selectedServer?.id === server.id ? null : server)}
                  >
                    <Code className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {selectedServer?.id === server.id && (
                <Tabs defaultValue="api" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="api" className="gap-2">
                      <Server className="w-4 h-4" />
                      API
                    </TabsTrigger>
                    <TabsTrigger value="app" className="gap-2" disabled={!server.app_url}>
                      <Monitor className="w-4 h-4" />
                      APP
                    </TabsTrigger>
                    <TabsTrigger value="content" className="gap-2" disabled={!server.code}>
                      <Code className="w-4 h-4" />
                      CONTENT
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="api" className="space-y-4">
                    <div className="rounded-lg bg-muted p-4">
                      <h4 className="font-semibold mb-2">Compatible Compute Hosts</h4>
                      <div className="space-y-2">
                        {getCompatibleHosts(server.server_type).map((host) => (
                          <div key={host.id} className="flex items-center justify-between p-2 rounded bg-background">
                            <div>
                              <p className="font-medium">{host.name}</p>
                              <p className="text-sm text-muted-foreground">{host.location || "Unknown location"}</p>
                            </div>
                            <Badge variant={host.status === "online" ? "default" : "secondary"}>
                              {host.status}
                            </Badge>
                          </div>
                        ))}
                        {getCompatibleHosts(server.server_type).length === 0 && (
                          <p className="text-sm text-muted-foreground">No compatible hosts available</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="app">
                    {server.app_url && (
                      <div className="rounded-lg border overflow-hidden">
                        <iframe 
                          src={server.app_url} 
                          className="w-full h-96"
                          title={`${server.name} App`}
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="content">
                    {server.code && (
                      <div className="rounded-lg bg-muted p-4">
                        <div className="mb-2 text-sm text-muted-foreground flex items-center gap-4">
                          <span>{server.code.split('\n').length} lines</span>
                          <span>{server.code.length} B</span>
                        </div>
                        <pre className="font-mono text-sm overflow-x-auto p-4 bg-background rounded">
                          <code>{server.code}</code>
                        </pre>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
