import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { BookingCalendar } from "@/components/client/BookingCalendar";
import { ClientBookings } from "@/components/client/ClientBookings";
import { ProgramViewer } from "@/components/client/ProgramViewer";
import { MealPlanViewer } from "@/components/client/MealPlanViewer";
import { ProgressTracking } from "@/components/client/ProgressTracking";

export function ClientDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessages();
  const [clientProfileId, setClientProfileId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientProfile = async () => {
      if (profile?.id) {
        const { data } = await supabase
          .from('client_profiles')
          .select('id, trainer_id')
          .eq('user_id', profile.id)
          .single();
        
        if (data) {
          setClientProfileId(data.id);
          setTrainerId(data.trainer_id);
        }
      }
    };
    fetchClientProfile();
  }, [profile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profile?.full_name}</h1>
            <p className="text-muted-foreground">Client Dashboard</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/messages')} variant="outline" className="relative">
              <MessageCircle className="mr-2 h-4 w-4" />
              Messages
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button onClick={signOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {clientProfileId && trainerId ? (
          <div className="space-y-6">
            <ClientBookings clientId={clientProfileId} />
            <BookingCalendar clientId={clientProfileId} trainerId={trainerId} />
            <ProgressTracking clientId={clientProfileId} />
            <div className="grid md:grid-cols-2 gap-6">
              <ProgramViewer clientId={clientProfileId} />
              <MealPlanViewer clientId={clientProfileId} />
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Trainer Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You need to be connected with a trainer. Ask your trainer to send you an invitation link.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}