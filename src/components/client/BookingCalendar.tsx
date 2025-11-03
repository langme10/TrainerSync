import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function BookingCalendar({ clientId, trainerId }: { clientId: string; trainerId: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allTrainerBookings, setAllTrainerBookings] = useState<Booking[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();

    // Set up real-time subscription for bookings
    const channel = supabase
      .channel('booking-calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `client_id=eq.${clientId}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trainerId, clientId]);

  const fetchData = async () => {
    // Fetch trainer availability
    const { data: slotsData, error: slotsError } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('is_active', true);

    if (slotsError) {
      toast({
        title: "Error loading availability",
        description: slotsError.message,
        variant: "destructive",
      });
    } else {
      setSlots(slotsData || []);
    }

    // Fetch client's own bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('client_id', clientId)
      .in('status', ['pending', 'confirmed']);

    if (bookingsError) {
      toast({
        title: "Error loading bookings",
        description: bookingsError.message,
        variant: "destructive",
      });
    } else {
      setBookings(bookingsData || []);
    }

    // Fetch ALL bookings for this trainer to check availability
    const { data: allBookingsData, error: allBookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('trainer_id', trainerId)
      .in('status', ['pending', 'confirmed']);

    if (allBookingsError) {
      toast({
        title: "Error loading availability",
        description: allBookingsError.message,
        variant: "destructive",
      });
    } else {
      setAllTrainerBookings(allBookingsData || []);
    }

    setLoading(false);
  };

  const handleBookSlot = async (slot: AvailabilitySlot) => {
    // Calculate the next occurrence of this day
    const today = new Date();
    const targetDay = slot.day_of_week;
    const currentDay = today.getDay();
    
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    const bookingDate = addDays(today, daysToAdd);
    const formattedDate = format(bookingDate, 'yyyy-MM-dd');

    // Check if this slot is already booked by ANY client
    const isSlotTaken = allTrainerBookings.some(
      (b) => b.booking_date === formattedDate && 
             b.start_time === slot.start_time
    );

    if (isSlotTaken) {
      toast({
        title: "Slot unavailable",
        description: "This time slot is already booked",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .insert({
        trainer_id: trainerId,
        client_id: clientId,
        availability_slot_id: slot.id,
        booking_date: formattedDate,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_minutes: slot.duration_minutes,
        status: 'confirmed',
      });

    if (error) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: `Session booked for ${DAYS[slot.day_of_week]} at ${slot.start_time}`,
      });
      fetchData();
    }
  };

  const isSlotBooked = (slot: AvailabilitySlot) => {
    const today = new Date();
    const targetDay = slot.day_of_week;
    const currentDay = today.getDay();
    
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    const bookingDate = addDays(today, daysToAdd);
    const formattedDate = format(bookingDate, 'yyyy-MM-dd');

    // Check if this slot is booked by ANY client (not just current client)
    return allTrainerBookings.some(
      (b) => b.booking_date === formattedDate && 
             b.start_time === slot.start_time
    );
  };

  const getNextOccurrenceDate = (dayOfWeek: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    
    let daysToAdd = dayOfWeek - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    return addDays(today, daysToAdd);
  };

  const handleCancelBooking = async (bookingId: string) => {
    // Get the current user's profile ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to cancel bookings",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
      })
      .eq('id', bookingId);

    if (error) {
      toast({
        title: "Error cancelling booking",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Booking cancelled",
        description: "Your session has been cancelled.",
      });
      // fetchData(); // No need to call this, real-time will handle it
    }
  };

  if (loading) return <div>Loading availability...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Book a Session</CardTitle>
          <CardDescription>
            Select an available time slot to schedule your session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {slots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Your trainer hasn't set up availability yet. Check back soon!
            </div>
          ) : (
            slots.map((slot) => {
              const booked = isSlotBooked(slot);
              const nextDate = getNextOccurrenceDate(slot.day_of_week);
              return (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    booked
                      ? 'bg-success/10 border-success/30'
                      : 'border-primary/30 hover:border-primary hover:bg-primary/5 cursor-pointer'
                  }`}
                  onClick={() => !booked && handleBookSlot(slot)}
                >
                  <div className="flex items-center gap-3">
                    {booked ? (
                      <Check className="h-5 w-5 text-success" />
                    ) : (
                      <Calendar className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <div className="font-semibold">{format(nextDate, 'EEEE, MMMM d')}</div>
                      <div className="text-sm text-muted-foreground">
                        {slot.duration_minutes} minute session
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4" />
                      {slot.start_time}
                    </div>
                    {booked ? (
                      <Badge className="bg-success">
                        {bookings.some(b => 
                          b.booking_date === format(getNextOccurrenceDate(slot.day_of_week), 'yyyy-MM-dd') && 
                          b.start_time === slot.start_time
                        ) ? 'Your Booking' : 'Booked'}
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleBookSlot(slot);
                      }}>
                        Book
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted"
              >
                <div>
                  <div className="font-semibold">
                    {format(parseISO(booking.booking_date), 'EEEE, MMMM d')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {booking.start_time} - {booking.end_time}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{booking.status}</Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Session</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this session? This will free up the time slot.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Session</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCancelBooking(booking.id)}>
                          Cancel Session
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}