import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, LogIn, Check } from "lucide-react";
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

interface SavedAccount {
  name: string;
  password: string;
  email: string;
}

export const AccountManager = () => {
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountPassword, setNewAccountPassword] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteAccount, setDeleteAccount] = useState<SavedAccount | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedAccounts();
    loadCurrentUser();
  }, []);

  const loadSavedAccounts = () => {
    const saved = localStorage.getItem("savedAccounts");
    if (saved) {
      setSavedAccounts(JSON.parse(saved));
    }
  };

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setCurrentEmail(user.email);
    }
  };

  const saveAccounts = (accounts: SavedAccount[]) => {
    localStorage.setItem("savedAccounts", JSON.stringify(accounts));
    setSavedAccounts(accounts);
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim() || !newAccountPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter both name and password",
        variant: "destructive",
      });
      return;
    }

    const email = `user_${newAccountPassword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)}@modchain.local`;

    // Check if account already exists
    if (savedAccounts.some(acc => acc.email === email)) {
      toast({
        title: "Error",
        description: "This account is already saved",
        variant: "destructive",
      });
      return;
    }

    // Try to create/verify account
    try {
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: newAccountPassword,
      });

      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: newAccountPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (signUpError) throw signUpError;
      }

      const newAccount: SavedAccount = {
        name: newAccountName,
        password: newAccountPassword,
        email,
      };

      saveAccounts([...savedAccounts, newAccount]);
      setCurrentEmail(email);
      setNewAccountName("");
      setNewAccountPassword("");
      setIsAdding(false);

      toast({
        title: "Success",
        description: `Account "${newAccountName}" added and logged in`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSwitchAccount = async (account: SavedAccount) => {
    try {
      await supabase.auth.signOut();
      
      const { error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (error) throw error;

      setCurrentEmail(account.email);
      toast({
        title: "Switched",
        description: `Now using account "${account.name}"`,
      });

      // Reload the page to refresh all data
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = () => {
    if (!deleteAccount) return;

    const updated = savedAccounts.filter(acc => acc.email !== deleteAccount.email);
    saveAccounts(updated);
    
    toast({
      title: "Removed",
      description: `Account "${deleteAccount.name}" removed from saved accounts`,
    });

    setDeleteAccount(null);
  };

  const getAccountInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card/30 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Saved Accounts</CardTitle>
          <CardDescription className="text-xs">
            Manage and switch between multiple accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {savedAccounts.map((account) => (
            <div
              key={account.email}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/50"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                {getAccountInitials(account.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{account.name}</p>
                  {currentEmail === account.email && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {account.email}
                </p>
              </div>
              <div className="flex gap-2">
                {currentEmail !== account.email && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSwitchAccount(account)}
                  >
                    <LogIn className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteAccount(account)}
                  className="hover:bg-destructive/20 hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {savedAccounts.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No saved accounts yet
            </div>
          )}
        </CardContent>
      </Card>

      {isAdding ? (
        <Card className="bg-card/30 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Add New Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Account name (e.g., Work, Personal)"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={newAccountPassword}
              onChange={(e) => setNewAccountPassword(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddAccount} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Add Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewAccountName("");
                  setNewAccountPassword("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full border-primary/30"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Account
        </Button>
      )}

      <AlertDialog open={!!deleteAccount} onOpenChange={() => setDeleteAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Account</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{deleteAccount?.name}" from saved accounts? This will not delete the account, only remove it from this list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
