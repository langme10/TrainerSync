import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageThread } from "./MessageThread";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";

interface ClientMessagingProps {
  clientId: string;
  currentUserId: string;
}

export function ClientMessaging({ clientId, currentUserId }: ClientMessagingProps) {
  const { toast } = useToast();
  const [trainerInfo, setTrainerInfo] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchTrainerInfo();
  }, [clientId]);

  const fetchTrainerInfo = async () => {
    try {
      const { data: clientProfile } = await supabase
        .from('client_profiles')
        .select('trainer_id')
        .eq('id', clientId)
        .single();

      if (!clientProfile?.trainer_id) {
        return;
      }

      const { data: trainerProfile } = await supabase
        .from('trainer_profiles')
        .select('user_id')
        .eq('id', clientProfile.trainer_id)
        .single();

      if (!trainerProfile) {
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', trainerProfile.user_id)
        .single();

      if (profile) {
        setTrainerInfo({
          id: trainerProfile.user_id,
          name: profile.full_name
        });
      }
    } catch (error: any) {
      console.error('Error fetching trainer info:', error);
    }
  };

  if (!trainerInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No trainer assigned yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <MessageThread
      currentUserId={currentUserId}
      recipientId={trainerInfo.id}
      recipientName={trainerInfo.name}
    />
  );
}
