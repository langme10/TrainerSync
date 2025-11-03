import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_recurring: boolean;
  specific_date: string | null;
  is_active: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TrainerAvailability() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isRecurring, setIsRecurring] = useState(true);
  const [specificDate, setSpecificDate] = useState("");

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    setLoading(true);
    
    const { data: trainerData } = await supabase
      .from("trainer_profiles")
      .select("id")
      .eq("user_id", profile?.id)
      .single();

    if (trainerData) {
      const { data } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("trainer_id", trainerData.id)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (data) {
        setSlots(data);
      }
    }
    
    setLoading(false);
  };

  const handleAddSlot = async () => {
    const { data: trainerData } = await supabase
      .from("trainer_profiles")
      .select("id")
      .eq("user_id", profile?.id)
      .single();

    if (!trainerData) return;

    const { error } = await supabase
      .from("availability_slots")
      .insert({
        trainer_id: trainerData.id,
        day_of_week: isRecurring ? dayOfWeek : 0,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        is_recurring: isRecurring,
        specific_date: isRecurring ? null : specificDate,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Availability slot added",
      });
      setIsDialogOpen(false);
      fetchAvailability();
      
      // Reset form
      setStartTime("09:00");
      setEndTime("10:00");
      setDurationMinutes(60);
      setIsRecurring(true);
      setSpecificDate("");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    const { error } = await supabase
      .from("availability_slots")
      .update({ is_active: false })
      .eq("id", slotId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Availability slot removed",
      });
      fetchAvailability();
    }
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    const key = slot.is_recurring ? `day-${slot.day_of_week}` : `date-${slot.specific_date}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Availability</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Time Slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Availability Slot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                  id="recurring"
                />
                <Label htmlFor="recurring">Recurring weekly</Label>
              </div>

              {isRecurring ? (
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Specific Date</Label>
                  <Input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Session Duration (minutes)</Label>
                <Select value={durationMinutes.toString()} onValueChange={(v) => setDurationMinutes(parseInt(v))}>
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

              <Button onClick={handleAddSlot} className="w-full">
                Add Slot
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : slots.length === 0 ? (
          <p className="text-muted-foreground">No availability slots set. Add your first slot to let clients book sessions.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSlots).map(([key, groupSlots]) => (
              <div key={key}>
                <h3 className="font-semibold mb-2">
                  {key.startsWith('day-') 
                    ? DAYS[parseInt(key.split('-')[1])]
                    : new Date(key.split('-').slice(1).join('-')).toLocaleDateString()}
                </h3>
                <div className="space-y-2">
                  {groupSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium">
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {slot.duration_minutes} minutes
                          </div>
                        </div>
                        {slot.is_recurring && (
                          <Badge variant="secondary">Recurring</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSlot(slot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}