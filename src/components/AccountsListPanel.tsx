import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Server, Cpu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserAccount {
  id: string;
  wallet_address: string;
  solana_address: string;
  server_count: number;
  host_count: number;
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

      const accountsWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count: serverCount } = await supabase
            .from("servers")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id);

          const { count: hostCount } = await supabase
            .from("compute_hosts")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id);

          return {
            ...profile,
            server_count: serverCount || 0,
            host_count: hostCount || 0,
          };
        })
      );

      setAccounts(accountsWithCounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
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
        <h3 className="text-lg font-semibold">User Accounts</h3>
        <Badge variant="secondary" className="ml-auto">
          {accounts.length} users
        </Badge>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <Card key={account.id} className="bg-card/30 border-border/50">
            <CardHeader className="pb-3">
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Server className="w-4 h-4 text-accent" />
                  <span className="text-muted-foreground">Servers:</span>
                  <span className="font-semibold">{account.server_count}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Hosts:</span>
                  <span className="font-semibold">{account.host_count}</span>
                </div>
              </div>
            </CardContent>
          </Card>
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
