import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useUnreadMessages() {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;

    fetchUnreadCount();
    const channel = setupRealtimeSubscription();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchUnreadCount = async () => {
    if (!profile?.id) return;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', profile.id)
      .eq('read', false);

    if (!error) {
      setUnreadCount(count || 0);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!profile?.id) return null as any;

    return supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${profile.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();
  };

  return { unreadCount, refetch: fetchUnreadCount };
}
