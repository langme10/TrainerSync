import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_recurring: boolean;
  is_active: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityManager({ trainerId }: { trainerId: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00',
    duration_minutes: 60,
  });

  useEffect(() => {
    fetchSlots();
  }, [trainerId]);

  const fetchSlots = async () => {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
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
    const { error } = await supabase
      .from('availability_slots')
      .insert({
        trainer_id: trainerId,
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
      setNewSlot({
        day_of_week: 1,
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
                <Label>Day of Week</Label>
                <Select
                  value={newSlot.day_of_week.toString()}
                  onValueChange={(value) => setNewSlot({ ...newSlot, day_of_week: parseInt(value) })}
                >
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
          slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-all"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-semibold">{DAYS[slot.day_of_week]}</div>
                  <div className="text-sm text-muted-foreground">
                    {slot.start_time} - {slot.end_time} ({slot.duration_minutes} min)
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
          ))
        )}
      </CardContent>
    </Card>
  );
}