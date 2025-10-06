import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Trash2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Friend {
  id: string;
  friend_name: string;
  friend_user_id: string;
  wallet_address: string;
  solana_address: string;
}

export const FriendsPanel = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [friendName, setFriendName] = useState("");
  const [friendWalletAddress, setFriendWalletAddress] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Friend | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: friendsData, error } = await supabase
      .from("friends")
      .select("id, friend_name, friend_user_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching friends:", error);
      return;
    }

    // Fetch wallet addresses for each friend
    const friendsWithWallets = await Promise.all(
      (friendsData || []).map(async (friend) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_address, solana_address")
          .eq("id", friend.friend_user_id)
          .single();

        return {
          ...friend,
          wallet_address: profile?.wallet_address || "",
          solana_address: profile?.solana_address || "",
        };
      })
    );

    setFriends(friendsWithWallets);
  };

  const handleAddFriend = async () => {
    if (!friendName.trim() || !friendWalletAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter both name and wallet address",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find user by wallet address
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", friendWalletAddress)
      .maybeSingle();

    if (profileError || !profile) {
      toast({
        title: "Error",
        description: "User with this wallet address not found",
        variant: "destructive",
      });
      return;
    }

    // Check if already friends
    const { data: existing } = await supabase
      .from("friends")
      .select("id")
      .eq("user_id", user.id)
      .eq("friend_user_id", profile.id)
      .maybeSingle();

    if (existing) {
      toast({
        title: "Error",
        description: "This user is already in your friends list",
        variant: "destructive",
      });
      return;
    }

    const { error: insertError } = await supabase
      .from("friends")
      .insert({
        user_id: user.id,
        friend_user_id: profile.id,
        friend_name: friendName,
      });

    if (insertError) {
      toast({
        title: "Error",
        description: insertError.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `${friendName} added to friends`,
    });

    setFriendName("");
    setFriendWalletAddress("");
    setIsAdding(false);
    fetchFriends();
  };

  const handleDeleteFriend = async () => {
    if (!deleteConfirm) return;

    const { error } = await supabase
      .from("friends")
      .delete()
      .eq("id", deleteConfirm.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Removed",
      description: `${deleteConfirm.friend_name} removed from friends`,
    });

    setDeleteConfirm(null);
    fetchFriends();
  };

  const shortenAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Friends</h3>
          <Badge variant="secondary">{friends.length}</Badge>
        </div>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Friend
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="bg-card/30 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Add New Friend</CardTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setFriendName("");
                  setFriendWalletAddress("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Friend's name"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
            />
            <Input
              placeholder="Wallet address (0x...)"
              value={friendWalletAddress}
              onChange={(e) => setFriendWalletAddress(e.target.value)}
              className="font-mono text-sm"
            />
            <Button onClick={handleAddFriend} className="w-full">
              Add Friend
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {friends.map((friend) => (
          <Card key={friend.id} className="bg-card/30 border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-accent">
                  <AvatarFallback className="text-primary-foreground">
                    {getInitials(friend.friend_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{friend.friend_name}</p>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      EVM: {shortenAddress(friend.wallet_address)}
                    </p>
                    {friend.solana_address && (
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        SOL: {shortenAddress(friend.solana_address)}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteConfirm(friend)}
                  className="hover:bg-destructive/20 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {friends.length === 0 && !isAdding && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No friends added yet
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {deleteConfirm?.friend_name} from your friends list?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFriend}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
