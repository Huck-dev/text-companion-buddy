import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Cpu, DollarSign, Plus, TrendingUp } from "lucide-react";
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
}

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

export const ComputePanel = () => {
  const [hosts, setHosts] = useState<ComputeHost[]>([]);
  const [executions, setExecutions] = useState<ComputeExecution[]>([]);
  const [showAddHost, setShowAddHost] = useState(false);
  const [newHost, setNewHost] = useState({
    name: "",
    endpoint: "",
    location: "",
    server_type: "misc" as "mcp" | "a2a" | "misc",
    profit_share: 70,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadHosts();
    loadExecutions();
  }, []);

  const loadHosts = async () => {
    const { data, error } = await supabase
      .from("compute_hosts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading hosts:", error);
      return;
    }
    setHosts(data || []);
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
    setShowAddHost(false);
    setNewHost({ name: "", endpoint: "", location: "", server_type: "misc", profit_share: 70 });
    loadHosts();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <Button 
          onClick={() => setShowAddHost(true)} 
          className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Plus className="w-4 h-4" />
          Add Host
        </Button>
      </div>

      {showAddHost && (
        <Card className="p-6 border-primary/30 shadow-2xl animate-scale-in backdrop-blur-sm bg-card/95">
          <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Add Compute Host
          </h3>
          <div className="space-y-4">
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
              <Button variant="outline" onClick={() => setShowAddHost(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="hosts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hosts">
            <Server className="w-4 h-4 mr-2" />
            Compute Hosts
          </TabsTrigger>
          <TabsTrigger value="executions">
            <Cpu className="w-4 h-4 mr-2" />
            Executions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hosts" className="space-y-4">
          {hosts.length === 0 ? (
            <Card className="p-12 text-center backdrop-blur-sm bg-card/50 border-dashed border-2 border-border/50 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 blur-xl opacity-30" style={{ background: "var(--gradient-primary)" }} />
                <Server className="w-16 h-16 mx-auto mb-4 text-primary/40 relative animate-pulse" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">No compute hosts added yet</p>
              <p className="text-muted-foreground/60 text-sm mt-2">Add your first host to get started</p>
            </Card>
          ) : (
            hosts.map((host) => (
              <Card key={host.id} className="p-6 card-hover backdrop-blur-sm bg-card/80 border-border/50 animate-slide-up">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{host.name}</h3>
                      <Badge className={`${getStatusColor(host.status)} shadow-sm`}>{host.status}</Badge>
                      {host.location && (
                        <Badge variant="outline">{host.location}</Badge>
                      )}
                      <Badge variant="secondary">{host.server_type.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{host.endpoint}</p>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span>{host.total_executions} executions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-accent" />
                        <span>${host.total_earnings} earned</span>
                      </div>
                      <div>
                        Success Rate:{" "}
                        {host.total_executions > 0
                          ? ((host.successful_executions / host.total_executions) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{host.profit_share_percentage}% profit share</Badge>
                </div>
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
