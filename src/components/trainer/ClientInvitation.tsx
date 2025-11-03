import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UserPlus, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClientInvitationProps {
  trainerId: string;
}

export function ClientInvitation({ trainerId }: ClientInvitationProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase
        .from("invitations")
        .insert({
          trainer_id: trainerId,
          email: email,
          invite_code: code,
          expires_at: expiresAt.toISOString(),
          status: "pending",
        });

      if (error) throw error;

      setInviteCode(code);
      
      // Call edge function to send email
      const { error: emailError } = await supabase.functions.invoke('send-client-invite', {
        body: { email, inviteCode: code }
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        toast({
          title: "Invitation Created",
          description: "Invitation created but email failed to send. Share the code manually.",
        });
      } else {
        toast({
          title: "Invitation Sent!",
          description: `Invitation email sent to ${email}`,
        });
      }

      setEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/auth?invite=${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invite New Client
        </CardTitle>
        <CardDescription>
          Send an invitation to a new client to join your training program
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Client Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </form>

        {inviteCode && (
          <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
            <p className="text-sm font-medium">Invitation Created!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-background rounded text-sm">
                {inviteCode}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copyInviteLink}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this code or link with your client. It expires in 7 days.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
