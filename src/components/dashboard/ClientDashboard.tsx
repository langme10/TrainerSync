import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Calendar, Dumbbell, Apple } from "lucide-react";
import { BookingCalendar } from "@/components/client/BookingCalendar";

export function ClientDashboard() {
  const { profile, signOut } = useAuth();
  const [clientProfileId, setClientProfileId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [nextSession, setNextSession] = useState<any>(null);

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
          
          if (data.id) {
            fetchNextSession(data.id);
          }
        }
      }
    };
    fetchClientProfile();
  }, [profile]);

  const fetchNextSession = async (clientId: string) => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("client_id", clientId)
      .gte("booking_date", new Date().toISOString().split('T')[0])
      .in("status", ["pending", "confirmed"])
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle();

    setNextSession(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profile?.full_name}</h1>
            <p className="text-muted-foreground">Client Dashboard</p>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Today's Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Next Session</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {nextSession ? (
                <>
                  <div className="text-2xl font-bold">
                    {new Date(nextSession.booking_date).toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    at {nextSession.start_time.slice(0, 5)}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">No sessions scheduled</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Workout</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Coming in Phase 3</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Meal Plan</CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Coming in Phase 3</p>
            </CardContent>
          </Card>
        </div>

        {/* Booking System */}
        {clientProfileId && trainerId ? (
          <BookingCalendar clientId={clientProfileId} trainerId={trainerId} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Trainer Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You need to be connected with a trainer to book sessions. Ask your trainer to send you an invitation link.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}