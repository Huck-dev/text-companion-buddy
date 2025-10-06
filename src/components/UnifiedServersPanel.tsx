import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Server, Cpu, DollarSign, Plus, TrendingUp, Monitor, Code, Lock, Unlock, Play, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ComputeHost {
  id: string;
  name: string;
  endpoint: string;
  status: string;
  location: string | null;
  server_type: string;
  total_executions: number;
  successful_executions: number;
  total_earnings: number;
  profit_share_percentage: number;
  type: "host";
}

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
  type: "server";
}

type UnifiedItem = ComputeHost | ServerDef;

interface ComputeExecution {
  id: string;
  server_name: string;
  server_type: string;
  function_name: string;
  status: string;
  cost_credits: number;
  host_earnings: number | null;
  execution_time_ms: number | null;
  created_at: string;
}

export const UnifiedServersPanel = () => {
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [executions, setExecutions] = useState<ComputeExecution[]>([]);
  const [filterType, setFilterType] = useState<"all" | "host" | "server">("all");
  const [filterServerType, setFilterServerType] = useState<"all" | "mcp" | "a2a" | "misc">("all");
  const [showAddItem, setShowAddItem] = useState(false);
  const [addItemType, setAddItemType] = useState<"host" | "server">("host");
  const [selectedServer, setSelectedServer] = useState<ServerDef | null>(null);
  
  const [newHost, setNewHost] = useState({
    name: "",
    endpoint: "",
    location: "",
    server_type: "misc" as "mcp" | "a2a" | "misc",
    profit_share: 70,
  });

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
    loadItems();
    loadExecutions();
  }, []);

  const loadItems = async () => {
    const [hostsResult, serversResult] = await Promise.all([
      supabase.from("compute_hosts").select("*").order("created_at", { ascending: false }),
      supabase.from("servers").select("*").order("created_at", { ascending: false }),
    ]);

    const hosts = (hostsResult.data || []).map(h => ({ ...h, type: "host" as const }));
    const servers = (serversResult.data || []).map(s => ({ ...s, type: "server" as const }));
    
    setItems([...hosts, ...servers]);
  };

  const loadExecutions = async () => {
    const { data, error } = await supabase
      .from("compute_executions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error loading executions:", error);
      return;
    }
    setExecutions(data || []);
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

  const addHost = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add a compute host.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("compute_hosts").insert({
      user_id: userData.user.id,
      name: newHost.name,
      endpoint: newHost.endpoint,
      location: newHost.location || null,
      server_type: newHost.server_type,
      profit_share_percentage: newHost.profit_share,
      status: "online",
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
      title: "Success",
      description: "Compute host added successfully!",
    });
    setShowAddItem(false);
    setNewHost({ name: "", endpoint: "", location: "", server_type: "misc", profit_share: 70 });
    loadItems();
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

    await loadItems();
    setShowAddItem(false);
    setNewServer({ 
      name: "", 
      endpoint: "", 
      description: "", 
      is_public: false,
      code: "",
      app_url: "",
    });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-status-success text-status-success-foreground";
      case "busy":
        return "bg-status-warning text-status-warning-foreground";
      case "offline":
        return "bg-status-neutral text-status-neutral-foreground";
      default:
        return "bg-status-error text-status-error-foreground";
    }
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-status-success text-status-success-foreground";
      case "running":
        return "bg-status-info text-status-info-foreground";
      case "failed":
        return "bg-status-error text-status-error-foreground";
      default:
        return "bg-status-warning text-status-warning-foreground";
    }
  };

  const filteredItems = items.filter(item => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (filterServerType !== "all" && item.server_type !== filterServerType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 animate-slide-up">
        <div className="flex gap-2 flex-wrap flex-1">
          <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="host">Host Servers</SelectItem>
              <SelectItem value="server">Servers</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterServerType} onValueChange={(v: any) => setFilterServerType(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Protocols</SelectItem>
              <SelectItem value="mcp">MCP</SelectItem>
              <SelectItem value="a2a">A2A</SelectItem>
              <SelectItem value="misc">Misc</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={() => setShowAddItem(true)} 
          className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Plus className="w-4 h-4" />
          Add Infrastructure
        </Button>
      </div>

      {showAddItem && (
        <Card className="p-6 border-primary/30 shadow-2xl animate-scale-in backdrop-blur-sm bg-card/95">
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={addItemType} onValueChange={(v: "host" | "server") => setAddItemType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="host">Host Server (Provide Compute)</SelectItem>
                  <SelectItem value="server">Server (API/Service)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {addItemType === "host" ? (
              <>
                <div>
                  <Label>Host Name</Label>
                  <Input
                    value={newHost.name}
                    onChange={(e) => setNewHost({ ...newHost, name: e.target.value })}
                    placeholder="My Compute Node"
                  />
                </div>
                <div>
                  <Label>Endpoint URL</Label>
                  <Input
                    value={newHost.endpoint}
                    onChange={(e) => setNewHost({ ...newHost, endpoint: e.target.value })}
                    placeholder="https://my-host.com/api"
                  />
                </div>
                <div>
                  <Label>Location (Optional)</Label>
                  <Input
                    value={newHost.location}
                    onChange={(e) => setNewHost({ ...newHost, location: e.target.value })}
                    placeholder="US-East"
                  />
                </div>
                <div>
                  <Label>Server Type</Label>
                  <Select
                    value={newHost.server_type}
                    onValueChange={(value: "mcp" | "a2a" | "misc") => setNewHost({ ...newHost, server_type: value })}
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
                <div>
                  <Label>Profit Share % (Host takes this percentage)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newHost.profit_share}
                    onChange={(e) =>
                      setNewHost({ ...newHost, profit_share: parseInt(e.target.value) || 70 })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addHost}>Add Host</Button>
                  <Button variant="outline" onClick={() => setShowAddItem(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
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
                  <Button variant="outline" onClick={() => setShowAddItem(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      <Tabs defaultValue="infrastructure" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="infrastructure">
            <Server className="w-4 h-4 mr-2" />
            Infrastructure
          </TabsTrigger>
          <TabsTrigger value="executions">
            <Cpu className="w-4 h-4 mr-2" />
            Executions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="infrastructure" className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card className="p-12 text-center backdrop-blur-sm bg-card/50 border-dashed border-2 border-border/50 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 blur-xl opacity-30" style={{ background: "var(--gradient-primary)" }} />
                <Server className="w-16 h-16 mx-auto mb-4 text-primary/40 relative animate-pulse" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">No infrastructure found</p>
              <p className="text-muted-foreground/60 text-sm mt-2">Add hosts or servers to get started</p>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="p-6 card-hover backdrop-blur-sm bg-card/80 border-border/50 animate-slide-up">
                {item.type === "host" ? (
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80">
                          HOST
                        </Badge>
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{item.name}</h3>
                        <Badge className={`${getStatusColor(item.status)} shadow-sm`}>{item.status}</Badge>
                        {item.location && (
                          <Badge variant="outline">{item.location}</Badge>
                        )}
                        <Badge variant="secondary">{item.server_type.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.endpoint}</p>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span>{item.total_executions} executions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-accent" />
                          <span>${item.total_earnings} earned</span>
                        </div>
                        <div>
                          Success Rate:{" "}
                          {item.total_executions > 0
                            ? ((item.successful_executions / item.total_executions) * 100).toFixed(1)
                            : 0}
                          %
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{item.profit_share_percentage}% profit share</Badge>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="default" className="bg-gradient-to-r from-accent to-accent/80">
                            SERVER
                          </Badge>
                          <h3 className="text-lg font-semibold">{item.name}</h3>
                          <Badge variant="secondary">{item.server_type.toUpperCase()}</Badge>
                          {item.is_public ? (
                            <Badge variant="outline" className="gap-1">
                              <Unlock className="w-3 h-3" /> Public
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Lock className="w-3 h-3" /> Private
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.endpoint}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => executeServer(item.id)}
                          className="gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Execute
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedServer(selectedServer?.id === item.id ? null : item)}
                        >
                          <Code className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {selectedServer?.id === item.id && (
                      <Tabs defaultValue="api" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="api" className="gap-2">
                            <Server className="w-4 h-4" />
                            API
                          </TabsTrigger>
                          <TabsTrigger value="app" className="gap-2" disabled={!item.app_url}>
                            <Monitor className="w-4 h-4" />
                            APP
                          </TabsTrigger>
                          <TabsTrigger value="content" className="gap-2" disabled={!item.code}>
                            <Code className="w-4 h-4" />
                            CONTENT
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="api" className="space-y-4">
                          <div className="rounded-lg bg-muted p-4">
                            <h4 className="font-semibold mb-2">Server Information</h4>
                            <p className="text-sm text-muted-foreground">
                              Protocol: {item.server_type.toUpperCase()}
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="app">
                          {item.app_url && (
                            <div className="rounded-lg border overflow-hidden">
                              <iframe 
                                src={item.app_url} 
                                className="w-full h-96"
                                title={`${item.name} App`}
                              />
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="content">
                          {item.code && (
                            <div className="rounded-lg bg-muted p-4">
                              <div className="mb-2 text-sm text-muted-foreground flex items-center gap-4">
                                <span>{item.code.split('\n').length} lines</span>
                                <span>{item.code.length} B</span>
                              </div>
                              <pre className="font-mono text-sm overflow-x-auto p-4 bg-background rounded">
                                <code>{item.code}</code>
                              </pre>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    )}
                  </>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          {executions.length === 0 ? (
            <Card className="p-12 text-center backdrop-blur-sm bg-card/50 border-dashed border-2 border-border/50 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 blur-xl opacity-30" style={{ background: "var(--gradient-nature)" }} />
                <Cpu className="w-16 h-16 mx-auto mb-4 text-accent/40 relative animate-pulse" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">No executions yet</p>
              <p className="text-muted-foreground/60 text-sm mt-2">Your compute tasks will appear here</p>
            </Card>
          ) : (
            executions.map((exec) => (
              <Card key={exec.id} className="p-4 card-hover backdrop-blur-sm bg-card/80 border-border/50 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getExecutionStatusColor(exec.status)} shadow-sm`}>{exec.status}</Badge>
                      <Badge variant="outline">{exec.server_type.toUpperCase()}</Badge>
                      <span className="font-medium">
                        {exec.server_name}.{exec.function_name}()
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {exec.execution_time_ms && `${exec.execution_time_ms}ms • `}
                      Cost: {exec.cost_credits} credits
                      {exec.host_earnings && ` • Host earned: $${exec.host_earnings}`}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(exec.created_at).toLocaleString()}
                  </span>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
