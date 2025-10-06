import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  total_executions: number;
  successful_executions: number;
  total_earnings: number;
  profit_share_percentage: number;
}

interface ComputeExecution {
  id: string;
  mcp_server_name: string;
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
    setNewHost({ name: "", endpoint: "", location: "", profit_share: 70 });
    loadHosts();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-red-500";
    }
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "running":
        return "bg-blue-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Distributed Compute Network
          </h2>
          <p className="text-muted-foreground">
            Manage compute hosts and execute MCP functions with profit sharing
          </p>
        </div>
        <Button onClick={() => setShowAddHost(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Host
        </Button>
      </div>

      {showAddHost && (
        <Card className="p-6 border-primary/30">
          <h3 className="text-lg font-semibold mb-4">Add Compute Host</h3>
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
            <Card className="p-8 text-center">
              <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No compute hosts added yet</p>
            </Card>
          ) : (
            hosts.map((host) => (
              <Card key={host.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{host.name}</h3>
                      <Badge className={getStatusColor(host.status)}>{host.status}</Badge>
                      {host.location && (
                        <Badge variant="outline">{host.location}</Badge>
                      )}
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
            <Card className="p-8 text-center">
              <Cpu className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No executions yet</p>
            </Card>
          ) : (
            executions.map((exec) => (
              <Card key={exec.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getExecutionStatusColor(exec.status)}>{exec.status}</Badge>
                      <span className="font-medium">
                        {exec.mcp_server_name}.{exec.function_name}()
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
