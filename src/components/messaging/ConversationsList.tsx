import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users } from "lucide-react";
import { format } from "date-fns";

interface Conversation {
  user_id: string;
  user_name: string;
  user_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export function ConversationsList({ 
  onSelectConversation 
}: { 
  onSelectConversation: (userId: string, userName: string) => void;
}) {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchConversations();
      setupRealtimeSubscription();
    }
  }, [profile?.id]);

  const fetchConversations = async () => {
    if (!profile?.id) return;

    try {
      // Get all messages involving the current user
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Get unique user IDs
      const otherUserIds = new Set<string>();
      messagesData?.forEach(msg => {
        const otherId = msg.sender_id === profile.id ? msg.recipient_id : msg.sender_id;
        otherUserIds.add(otherId);
      });

      // Fetch user profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', Array.from(otherUserIds));

      if (profilesError) throw profilesError;

      // Build conversations list
      const conversationsList: Conversation[] = [];
      
      profilesData?.forEach(otherProfile => {
        const userMessages = messagesData?.filter(
          msg => msg.sender_id === otherProfile.id || msg.recipient_id === otherProfile.id
        ) || [];

        const lastMessage = userMessages[0];
        const unreadCount = userMessages.filter(
          msg => msg.recipient_id === profile.id && !msg.read
        ).length;

        if (lastMessage) {
          conversationsList.push({
            user_id: otherProfile.id,
            user_name: otherProfile.full_name,
            user_role: otherProfile.role,
            last_message: lastMessage.content,
            last_message_time: lastMessage.created_at,
            unread_count: unreadCount,
          });
        }
      });

      setConversations(conversationsList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('conversations-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return <div>Loading conversations...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start chatting with your {profile?.role === 'trainer' ? 'clients' : 'trainer'}!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.user_id}
                onClick={() => onSelectConversation(conv.user_id, conv.user_name)}
                className="p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="font-semibold">{conv.user_name}</div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {conv.user_role}
                    </Badge>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge className="bg-primary">{conv.unread_count}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-2">
                  {conv.last_message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(conv.last_message_time), 'MMM dd, h:mm a')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
