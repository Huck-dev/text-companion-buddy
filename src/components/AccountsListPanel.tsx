import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Server, Cpu, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface UserAccount {
  id: string;
  wallet_address: string;
  solana_address: string;
  server_count: number;
  host_count: number;
  servers?: ServerInfo[];
  hosts?: HostInfo[];
  expanded?: boolean;
}

interface ServerInfo {
  id: string;
  name: string;
  endpoint: string;
  server_type: string;
  is_public: boolean;
}

interface HostInfo {
  id: string;
  name: string;
  status: string;
  server_type: string;
}

export const AccountsListPanel = () => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, wallet_address, solana_address");

      if (profilesError) throw profilesError;

      const accountsWithData = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: servers } = await supabase
            .from("servers")
            .select("id, name, endpoint, server_type, is_public")
            .eq("user_id", profile.id);

          const { data: hosts } = await supabase
            .from("compute_hosts")
            .select("id, name, status, server_type")
            .eq("user_id", profile.id);

          return {
            ...profile,
            server_count: servers?.length || 0,
            host_count: hosts?.length || 0,
            servers: servers || [],
            hosts: hosts || [],
            expanded: false,
          };
        })
      );

      setAccounts(accountsWithData);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccount = (accountId: string) => {
    setAccounts(accounts.map(acc => 
      acc.id === accountId ? { ...acc, expanded: !acc.expanded } : acc
    ));
  };

  const shortenAddress = (address: string | null) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getInitials = (address: string | null) => {
    if (!address) return "?";
    return address.slice(2, 4).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">All Users</h3>
        <Badge variant="secondary" className="ml-auto">
          {accounts.length} users
        </Badge>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <Collapsible
            key={account.id}
            open={account.expanded}
            onOpenChange={() => toggleAccount(account.id)}
          >
            <Card className="bg-card/30 border-border/50">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-accent">
                      <AvatarFallback className="text-primary-foreground">
                        {getInitials(account.wallet_address)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-mono truncate">
                        {shortenAddress(account.wallet_address)}
                      </CardTitle>
                      {account.solana_address && (
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {shortenAddress(account.solana_address)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="gap-1">
                        <Server className="w-3 h-3" />
                        {account.server_count}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Cpu className="w-3 h-3" />
                        {account.host_count}
                      </Badge>
                      {account.expanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  {account.servers && account.servers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Servers</p>
                      <div className="space-y-2">
                        {account.servers.map((server) => (
                          <div
                            key={server.id}
                            className="flex items-center justify-between p-2 rounded bg-secondary/20 border border-border/30"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{server.name}</p>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {server.endpoint}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {server.server_type}
                              </Badge>
                              {server.is_public && (
                                <Badge className="text-xs bg-green-500/20 text-green-500">
                                  Public
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {account.hosts && account.hosts.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Hosts</p>
                      <div className="space-y-2">
                        {account.hosts.map((host) => (
                          <div
                            key={host.id}
                            className="flex items-center justify-between p-2 rounded bg-secondary/20 border border-border/30"
                          >
                            <p className="text-sm font-medium">{host.name}</p>
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {host.server_type}
                              </Badge>
                              <Badge
                                className={`text-xs ${
                                  host.status === 'online'
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'bg-gray-500/20 text-gray-500'
                                }`}
                              >
                                {host.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No accounts found
        </div>
      )}
    </div>
  );
};
