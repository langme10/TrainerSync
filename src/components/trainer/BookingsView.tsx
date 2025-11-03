import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay } from "date-fns";

interface BookingsViewProps {
  trainerId: string;
}

type ViewMode = "day" | "week";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  client_id: string;
  client_profiles: {
    profiles: {
      full_name: string;
    };
  };
}

export function BookingsView({ trainerId }: BookingsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchBookings();
  }, [trainerId, viewMode, selectedDate]);

  const fetchBookings = async () => {
    let startDate: string;
    let endDate: string;

    if (viewMode === "day") {
      startDate = format(selectedDate, "yyyy-MM-dd");
      endDate = startDate;
    } else {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      startDate = format(weekStart, "yyyy-MM-dd");
      endDate = format(weekEnd, "yyyy-MM-dd");
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        status,
        client_id,
        client_profiles(profiles(full_name))
      `)
      .eq("trainer_id", trainerId)
      .gte("booking_date", startDate)
      .lte("booking_date", endDate)
      .in("status", ["pending", "confirmed"])
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching bookings:", error);
      return;
    }

    console.log("Bookings data structure:", JSON.stringify(data, null, 2));
    setBookings(data || []);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const goToPrevious = () => {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, -1));
    } else {
      setSelectedDate(addDays(selectedDate, -7));
    }
  };

  const goToNext = () => {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 7));
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getDateRangeText = () => {
    if (viewMode === "day") {
      return format(selectedDate, "EEEE, MMMM d, yyyy");
    } else {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    }
  };

  const groupedBookings = viewMode === "week" 
    ? bookings.reduce((acc, booking) => {
        const date = booking.booking_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(booking);
        return acc;
      }, {} as Record<string, Booking[]>)
    : { [format(selectedDate, "yyyy-MM-dd")]: bookings };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Session Calendar
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                size="sm"
                variant={viewMode === "day" ? "default" : "ghost"}
                onClick={() => setViewMode("day")}
              >
                Day
              </Button>
              <Button
                size="sm"
                variant={viewMode === "week" ? "default" : "ghost"}
                onClick={() => setViewMode("week")}
              >
                Week
              </Button>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={goToPrevious}>
                Previous
              </Button>
              <Button size="sm" variant="outline" onClick={goToToday}>
                Today
              </Button>
              <Button size="sm" variant="outline" onClick={goToNext}>
                Next
              </Button>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{getDateRangeText()}</p>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedBookings).length === 0 || bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No sessions scheduled for this {viewMode}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedBookings).map(([date, dateBookings]) => (
              dateBookings.length > 0 && (
                <div key={date}>
                  {viewMode === "week" && (
                    <h3 className="font-semibold mb-3 text-sm">
                      {format(new Date(date), "EEEE, MMMM d")}
                    </h3>
                  )}
                  <div className="space-y-2">
                    {dateBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {booking.client_profiles?.profiles?.full_name || "Unknown Client"}
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
