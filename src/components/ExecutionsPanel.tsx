import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock, DollarSign, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Execution = {
  id: string;
  server_name: string;
  function_name: string;
  status: string;
  execution_time_ms: number | null;
  cost_credits: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  result: any;
};

export const ExecutionsPanel = () => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExecutions();
  }, []);

  const fetchExecutions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("compute_executions")
        .select("*")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setExecutions(data || []);
    } catch (error) {
      console.error("Error fetching executions:", error);
      toast.error("Failed to load executions");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <Card className="bg-card/30 border-border/50">
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No executions yet</p>
            <p className="text-xs mt-1">Your server calls will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Recent Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {executions.map((execution) => (
                <Card key={execution.id} className="bg-secondary/20 border-border/30">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(execution.status)}
                            <span className="font-semibold text-sm">{execution.server_name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{execution.function_name}</p>
                        </div>
                        <Badge variant={getStatusVariant(execution.status)} className="text-xs">
                          {execution.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-medium">${(execution.cost_credits / 10).toFixed(2)}</span>
                        </div>
                        {execution.execution_time_ms && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Time:</span>
                            <span className="font-medium">{execution.execution_time_ms}ms</span>
                          </div>
                        )}
                      </div>

                      {execution.error_message && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded p-2">
                          <p className="text-xs text-destructive">{execution.error_message}</p>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground pt-1 border-t border-border/30">
                        {new Date(execution.created_at).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
