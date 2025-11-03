import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Dumbbell, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Program {
  id: string;
  title: string;
  description: string;
  duration_weeks: number;
}

export function ProgramManager({ trainerId }: { trainerId: string }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newProgram, setNewProgram] = useState({
    title: '',
    description: '',
    duration_weeks: 4,
  });

  useEffect(() => {
    fetchPrograms();
  }, [trainerId]);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from('program_templates')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error loading programs",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPrograms(data || []);
    }
    setLoading(false);
  };

  const handleCreateProgram = async () => {
    if (!newProgram.title.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a program title",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('program_templates')
      .insert({
        trainer_id: trainerId,
        ...newProgram,
      });

    if (error) {
      toast({
        title: "Error creating program",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Program template created",
      });
      setIsDialogOpen(false);
      fetchPrograms();
      setNewProgram({ title: '', description: '', duration_weeks: 4 });
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    const { error } = await supabase
      .from('program_templates')
      .delete()
      .eq('id', programId);

    if (error) {
      toast({
        title: "Error deleting program",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Program template deleted",
      });
      fetchPrograms();
    }
  };

  if (loading) return <div>Loading programs...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Workout Programs</CardTitle>
          <CardDescription>Create and manage workout program templates</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Program Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Program Title *</Label>
                <Input
                  placeholder="e.g., Upper/Lower Split"
                  value={newProgram.title}
                  onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the program goals and structure..."
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Duration (weeks)</Label>
                <Input
                  type="number"
                  min="1"
                  value={newProgram.duration_weeks}
                  onChange={(e) => setNewProgram({ ...newProgram, duration_weeks: parseInt(e.target.value) })}
                />
              </div>

              <Button className="w-full" onClick={handleCreateProgram}>
                Create Program
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {programs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No programs yet. Create your first workout program template.
          </div>
        ) : (
          programs.map((program) => (
            <div
              key={program.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-all"
            >
              <div className="flex items-center gap-3">
                <Dumbbell className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">{program.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {program.description || "No description"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {program.duration_weeks} weeks
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteProgram(program.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}