import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageThread } from "./MessageThread";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  user_id: string;
  full_name: string;
  unread_count: number;
}

interface TrainerMessagingProps {
  trainerId: string;
  currentUserId: string;
}

export function TrainerMessaging({ trainerId, currentUserId }: TrainerMessagingProps) {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('trainer-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`
        },
        () => {
          fetchClients(); // Refresh to update unread counts
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trainerId, currentUserId]);

  const fetchClients = async () => {
    try {
      // Get all clients for this trainer
      const { data: clientProfiles } = await supabase
        .from('client_profiles')
        .select(`
          id,
          user_id,
          profiles:user_id (
            full_name
          )
        `)
        .eq('trainer_id', trainerId);

      if (!clientProfiles) {
        setLoading(false);
        return;
      }

      // Get unread message counts for each client
      const clientsWithUnread = await Promise.all(
        clientProfiles.map(async (client: any) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', client.user_id)
            .eq('recipient_id', currentUserId)
            .eq('read', false);

          return {
            id: client.id,
            user_id: client.user_id,
            full_name: client.profiles?.full_name || 'Unknown',
            unread_count: count || 0
          };
        })
      );

      setClients(clientsWithUnread);
      if (clientsWithUnread.length > 0 && !selectedClient) {
        setSelectedClient(clientsWithUnread[0]);
      }
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error loading clients",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No clients yet</p>
            <p className="text-sm">Messages will appear here once you have clients</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Clients</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-1">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between ${
                  selectedClient?.id === client.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{client.full_name}</span>
                </div>
                {client.unread_count > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {client.unread_count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedClient && (
        <MessageThread
          currentUserId={currentUserId}
          recipientId={selectedClient.user_id}
          recipientName={selectedClient.full_name}
        />
      )}
    </div>
  );
}
