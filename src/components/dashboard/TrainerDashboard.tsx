import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, UserPlus, Calendar, Users } from "lucide-react";
import { AvailabilityManager } from "@/components/trainer/AvailabilityManager";
import { ProgramManager } from "@/components/trainer/ProgramManager";
import { MealPlanManager } from "@/components/trainer/MealPlanManager";

export function TrainerDashboard() {
  const { profile, signOut } = useAuth();
  const [trainerProfileId, setTrainerProfileId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    todaySessions: 0,
    pendingInvites: 0,
  });

  useEffect(() => {
    const fetchTrainerProfile = async () => {
      if (profile?.id) {
        const { data } = await supabase
          .from('trainer_profiles')
          .select('id')
          .eq('user_id', profile.id)
          .single();
        
        if (data) {
          setTrainerProfileId(data.id);
          fetchStats(data.id);
        }
      }
    };
    fetchTrainerProfile();
  }, [profile]);

  const fetchStats = async (trainerId: string) => {
    const { count: clientCount } = await supabase
      .from("client_profiles")
      .select("*", { count: 'exact', head: true })
      .eq("trainer_id", trainerId);

    const today = new Date().toISOString().split('T')[0];
    const { count: sessionCount } = await supabase
      .from("bookings")
      .select("*", { count: 'exact', head: true })
      .eq("trainer_id", trainerId)
      .eq("booking_date", today)
      .in("status", ["pending", "confirmed"]);

    const { count: inviteCount } = await supabase
      .from("invitations")
      .select("*", { count: 'exact', head: true })
      .eq("trainer_id", trainerId)
      .eq("status", "pending");

    setStats({
      totalClients: clientCount || 0,
      todaySessions: sessionCount || 0,
      pendingInvites: inviteCount || 0,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name}</h1>
            <p className="text-muted-foreground">Trainer Dashboard</p>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalClients === 0 ? "No clients yet" : "Active clients"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaySessions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.todaySessions === 0 ? "No sessions scheduled" : "Scheduled today"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvites}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingInvites === 0 ? "No pending invites" : "Awaiting response"}
              </p>
            </CardContent>
          </Card>
        </div>

        {trainerProfileId && (
          <div className="space-y-6">
            <AvailabilityManager trainerId={trainerProfileId} />
            <ProgramManager trainerId={trainerProfileId} />
            <MealPlanManager trainerId={trainerProfileId} />
          </div>
        )}
      </div>
    </div>
  );
}