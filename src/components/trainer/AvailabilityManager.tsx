import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Clock, Calendar, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_recurring: boolean;
  is_active: boolean;
  specific_date: string | null;
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export function AvailabilityManager({ trainerId }: { trainerId: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { toast } = useToast();

  const [newSlot, setNewSlot] = useState({
    start_time: '09:00',
    end_time: '10:00',
    duration_minutes: 60,
  });

  useEffect(() => {
    fetchSlots();
  }, [trainerId]);

  const fetchSlots = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('is_active', true)
      .gte('specific_date', today)
      .not('specific_date', 'is', null)
      .order('specific_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      toast({
        title: "Error loading availability",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  };

  const handleAddSlot = async () => {
    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select a date for the time slot",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('availability_slots')
      .insert({
        trainer_id: trainerId,
        specific_date: format(selectedDate, 'yyyy-MM-dd'),
        day_of_week: selectedDate.getDay(),
        is_recurring: false,
        ...newSlot,
      });

    if (error) {
      toast({
        title: "Error adding slot",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Availability slot added",
      });
      setIsDialogOpen(false);
      fetchSlots();
      setSelectedDate(undefined);
      setNewSlot({
        start_time: '09:00',
        end_time: '10:00',
        duration_minutes: 60,
      });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    const { error } = await supabase
      .from('availability_slots')
      .update({ is_active: false })
      .eq('id', slotId);

    if (error) {
      toast({
        title: "Error deleting slot",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Availability slot removed",
      });
      fetchSlots();
    }
  };

  if (loading) return <div>Loading availability...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Available Time Slots</CardTitle>
          <CardDescription>Manage when clients can book sessions with you</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Available Time Slot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Session Duration (minutes)</Label>
                <Select
                  value={newSlot.duration_minutes.toString()}
                  onValueChange={(value) => setNewSlot({ ...newSlot, duration_minutes: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleAddSlot}>
                Save Time Slot
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {slots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No availability slots set. Add your first slot to let clients book sessions.
          </div>
        ) : (
          slots.map((slot) => {
            return (
              <div
                key={slot.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">
                      {slot.specific_date ? format(new Date(slot.specific_date), "EEEE, MMMM d, yyyy") : "Recurring"}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)} ({slot.duration_minutes} min)
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSlot(slot.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}