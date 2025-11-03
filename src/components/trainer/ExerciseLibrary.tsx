import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Exercise {
  id: string;
  name: string;
  category: string | null;
  equipment: string | null;
  instructions: string | null;
}

export function ExerciseLibrary({ trainerId }: { trainerId: string }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newExercise, setNewExercise] = useState({
    name: '',
    category: '',
    equipment: '',
    instructions: '',
  });

  useEffect(() => {
    fetchExercises();
  }, [trainerId]);

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('name');

    if (error) {
      toast({
        title: "Error loading exercises",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setExercises(data || []);
    }
  };

  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) {
      toast({
        title: "Error",
        description: "Exercise name is required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('exercises')
      .insert({
        trainer_id: trainerId,
        ...newExercise,
      });

    if (error) {
      toast({
        title: "Error adding exercise",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Exercise added to library",
      });
      setIsDialogOpen(false);
      fetchExercises();
      setNewExercise({
        name: '',
        category: '',
        equipment: '',
        instructions: '',
      });
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      toast({
        title: "Error deleting exercise",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Exercise removed from library",
      });
      fetchExercises();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Exercise Library</CardTitle>
          <CardDescription>Create and manage your exercise database</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Exercise Name *</Label>
                <Input
                  placeholder="e.g., Barbell Squat"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    placeholder="e.g., Legs, Push, Pull"
                    value={newExercise.category}
                    onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Equipment</Label>
                  <Input
                    placeholder="e.g., Barbell, Dumbbell"
                    value={newExercise.equipment}
                    onChange={(e) => setNewExercise({ ...newExercise, equipment: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea
                  placeholder="Exercise instructions and form cues..."
                  value={newExercise.instructions}
                  onChange={(e) => setNewExercise({ ...newExercise, instructions: e.target.value })}
                  rows={4}
                />
              </div>

              <Button className="w-full" onClick={handleAddExercise}>
                Add to Library
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {exercises.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No exercises in your library yet.</p>
            <p className="text-sm">Add exercises to start building programs.</p>
          </div>
        ) : (
          exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-start justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-all"
            >
              <div className="flex-1">
                <div className="font-semibold">{exercise.name}</div>
                <div className="flex gap-2 mt-1">
                  {exercise.category && (
                    <Badge variant="secondary" className="text-xs">
                      {exercise.category}
                    </Badge>
                  )}
                  {exercise.equipment && (
                    <Badge variant="outline" className="text-xs">
                      {exercise.equipment}
                    </Badge>
                  )}
                </div>
                {exercise.instructions && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {exercise.instructions}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteExercise(exercise.id)}
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