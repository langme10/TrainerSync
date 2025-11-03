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
  const [trainerProfile, setTrainerProfile] = useState<{ user_id: string; full_name: string } | null>(null);

  useEffect(() => {
    const fetchClientProfile = async () => {
      if (profile?.id) {
        const { data, error } = await supabase
          .from('client_profiles')
          .select('id, trainer_id')
          .eq('user_id', profile.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching client profile:', error);
          return;
        }

        if (data) {
          setClientProfileId(data.id);
          setTrainerId(data.trainer_id);

          // Fetch trainer's profile info
          if (data.trainer_id) {
            const { data: trainerData, error: trainerError } = await supabase
              .from('trainer_profiles')
              .select('user_id')
              .eq('id', data.trainer_id)
              .maybeSingle();
            
            if (trainerError) {
              console.error('Error fetching trainer profile:', trainerError);
              return;
            }

            if (trainerData) {
              // Fetch the trainer's user profile
              const { data: userProfile, error: userError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', trainerData.user_id)
                .maybeSingle();

              if (!userError && userProfile) {
                setTrainerProfile({
                  user_id: trainerData.user_id,
                  full_name: userProfile.full_name || 'Your Trainer'
                });
              }
            }
          }
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
            <Button 
              onClick={() => navigate('/messages', {
                state: {
                  selectedUserId: trainerProfile?.user_id,
                  selectedUserName: trainerProfile?.full_name
                }
              })} 
              variant="outline" 
              className="relative"
              disabled={!trainerProfile}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Message Trainer
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