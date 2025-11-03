import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_recurring: boolean;
  specific_date: string | null;
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ClientBooking() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [clientProfileId, setClientProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainerAvailability();
    fetchMyBookings();
  }, []);

  const fetchTrainerAvailability = async () => {
    setLoading(true);

    const { data: clientData } = await supabase
      .from("client_profiles")
      .select("id, trainer_id")
      .eq("user_id", profile?.id)
      .single();

    if (clientData?.trainer_id) {
      setTrainerId(clientData.trainer_id);
      setClientProfileId(clientData.id);

      const { data } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("trainer_id", clientData.trainer_id)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (data) {
        setSlots(data);
      }
    }

    setLoading(false);
  };

  const fetchMyBookings = async () => {
    const { data: clientData } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", profile?.id)
      .single();

    if (clientData) {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("client_id", clientData.id)
        .gte("booking_date", new Date().toISOString().split('T')[0])
        .order("booking_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (data) {
        setBookings(data);
      }
    }
  };

  const getNextAvailableDates = (slot: AvailabilitySlot, count: number = 4) => {
    const dates: Date[] = [];
    const today = new Date();
    
    if (!slot.is_recurring && slot.specific_date) {
      const specificDate = new Date(slot.specific_date);
      if (specificDate >= today) {
        dates.push(specificDate);
      }
      return dates;
    }

    let currentDate = new Date(today);
    currentDate.setHours(0, 0, 0, 0);

    while (dates.length < count) {
      if (currentDate.getDay() === slot.day_of_week && currentDate >= today) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const handleBookSession = async (slot: AvailabilitySlot, date: Date) => {
    if (!trainerId || !clientProfileId) return;

    // Check for conflicts
    const dateStr = date.toISOString().split('T')[0];
    const { data: hasConflict } = await supabase
      .rpc('check_booking_conflict', {
        p_trainer_id: trainerId,
        p_booking_date: dateStr,
        p_start_time: slot.start_time,
        p_end_time: slot.end_time,
      });

    if (hasConflict) {
      toast({
        title: "Slot unavailable",
        description: "This time slot has already been booked.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("bookings")
      .insert({
        trainer_id: trainerId,
        client_id: clientProfileId,
        availability_slot_id: slot.id,
        booking_date: dateStr,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_minutes: slot.duration_minutes,
        status: 'confirmed',
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Your session has been booked",
      });
      fetchMyBookings();
      fetchTrainerAvailability();
    }
  };

  if (!trainerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Book a Session</CardTitle>
          <CardDescription>You need to be connected to a trainer to book sessions</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const groupedSlots = slots.reduce((acc, slot) => {
    const key = slot.is_recurring ? DAYS[slot.day_of_week] : 'One-time';
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book a Session</CardTitle>
        <CardDescription>Select an available time slot to schedule with your trainer</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="available">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available Slots</TabsTrigger>
            <TabsTrigger value="booked">My Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : slots.length === 0 ? (
              <p className="text-muted-foreground">Your trainer hasn't set up availability yet.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedSlots).map(([day, daySlots]) => (
                  <div key={day}>
                    <h3 className="font-semibold mb-3">{day}</h3>
                    <div className="space-y-3">
                      {daySlots.map((slot) => {
                        const availableDates = getNextAvailableDates(slot);
                        return (
                          <div key={slot.id} className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Clock className="h-4 w-4 text-primary" />
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                              <Badge variant="secondary">{slot.duration_minutes} min</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {availableDates.map((date) => (
                                <Button
                                  key={date.toISOString()}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBookSession(slot, date)}
                                  className="hover:bg-primary hover:text-primary-foreground"
                                >
                                  <Calendar className="mr-2 h-3 w-3" />
                                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="booked" className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-muted-foreground">No upcoming bookings</p>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div>
                      <div className="font-medium">
                        {new Date(booking.booking_date).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}