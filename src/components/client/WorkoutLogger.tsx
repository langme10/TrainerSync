import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Play, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WorkoutSet {
  id: string;
  exercise_id: string;
  set_order: number;
  target_reps: string | null;
  target_weight: number | null;
  target_rpe: number | null;
  rest_seconds: number | null;
  exercises: {
    name: string;
    instructions: string | null;
  };
}

interface SetLog {
  workout_set_id: string;
  actual_weight: string;
  actual_reps: string;
  actual_rpe: string;
  notes: string;
  completed: boolean;
}

interface WorkoutLoggerProps {
  workoutId: string;
  workoutTitle: string;
  clientId: string;
  sets: WorkoutSet[];
  onComplete: () => void;
  onCancel: () => void;
}

export function WorkoutLogger({ 
  workoutId, 
  workoutTitle, 
  clientId, 
  sets, 
  onComplete,
  onCancel 
}: WorkoutLoggerProps) {
  const { toast } = useToast();
  const [isLogging, setIsLogging] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [setLogs, setSetLogs] = useState<Record<string, SetLog>>(
    sets.reduce((acc, set) => ({
      ...acc,
      [set.id]: {
        workout_set_id: set.id,
        actual_weight: set.target_weight?.toString() || "",
        actual_reps: set.target_reps || "",
        actual_rpe: set.target_rpe?.toString() || "",
        notes: "",
        completed: false
      }
    }), {})
  );

  const startWorkout = () => {
    setIsLogging(true);
    toast({
      title: "Workout Started",
      description: "Let's get it! Track each set as you go.",
    });
  };

  const updateSetLog = (setId: string, field: keyof SetLog, value: string | boolean) => {
    setSetLogs(prev => ({
      ...prev,
      [setId]: {
        ...prev[setId],
        [field]: value
      }
    }));
  };

  const markSetComplete = (setId: string) => {
    updateSetLog(setId, 'completed', true);
    if (currentSetIndex < sets.length - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
    }
    toast({
      title: "Set Completed!",
      description: "Great work! Moving to next set.",
    });
  };

  const saveWorkout = async () => {
    try {
      // Create workout log
      const { data: workoutLog, error: workoutError } = await supabase
        .from('workout_logs')
        .insert({
          workout_id: workoutId,
          client_id: clientId,
          notes: workoutNotes,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Create set logs
      const setLogsToInsert = Object.values(setLogs)
        .filter(log => log.completed)
        .map(log => ({
          workout_log_id: workoutLog.id,
          workout_set_id: log.workout_set_id,
          actual_weight: log.actual_weight ? parseFloat(log.actual_weight) : null,
          actual_reps: log.actual_reps ? parseInt(log.actual_reps) : null,
          actual_rpe: log.actual_rpe ? parseInt(log.actual_rpe) : null,
          notes: log.notes || null
        }));

      const { error: setsError } = await supabase
        .from('set_logs')
        .insert(setLogsToInsert);

      if (setsError) throw setsError;

      toast({
        title: "Workout Saved!",
        description: "Your progress has been logged successfully.",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error saving workout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const completedSets = Object.values(setLogs).filter(log => log.completed).length;

  if (!isLogging) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{workoutTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Play className="h-16 w-16 mx-auto mb-4 text-primary" />
            <p className="text-lg font-semibold mb-2">Ready to train?</p>
            <p className="text-sm text-muted-foreground mb-6">
              {sets.length} exercises • Track your sets and reps
            </p>
            <Button onClick={startWorkout} size="lg" className="gap-2">
              <Play className="h-4 w-4" />
              Start Workout
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{workoutTitle}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {completedSets} of {sets.length} sets completed
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sets.map((set, index) => {
              const log = setLogs[set.id];
              const isActive = index === currentSetIndex;
              
              return (
                <div 
                  key={set.id} 
                  className={`p-4 rounded-lg border-2 transition-all ${
                    log.completed 
                      ? 'bg-primary/5 border-primary/30' 
                      : isActive 
                      ? 'bg-accent border-primary' 
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-lg">{set.exercises.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Set {set.set_order}
                      </div>
                    </div>
                    {log.completed && (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    )}
                  </div>

                  <div className="flex gap-2 mb-3 flex-wrap">
                    {set.target_reps && (
                      <Badge variant="outline">Target: {set.target_reps} reps</Badge>
                    )}
                    {set.target_weight && (
                      <Badge variant="outline">Target: {set.target_weight} lbs</Badge>
                    )}
                    {set.target_rpe && (
                      <Badge variant="outline">Target RPE: {set.target_rpe}</Badge>
                    )}
                  </div>

                  {!log.completed && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`weight-${set.id}`} className="text-xs">
                            Weight (lbs)
                          </Label>
                          <Input
                            id={`weight-${set.id}`}
                            type="number"
                            value={log.actual_weight}
                            onChange={(e) => updateSetLog(set.id, 'actual_weight', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`reps-${set.id}`} className="text-xs">
                            Reps
                          </Label>
                          <Input
                            id={`reps-${set.id}`}
                            type="number"
                            value={log.actual_reps}
                            onChange={(e) => updateSetLog(set.id, 'actual_reps', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`rpe-${set.id}`} className="text-xs">
                            RPE (1-10)
                          </Label>
                          <Input
                            id={`rpe-${set.id}`}
                            type="number"
                            min="1"
                            max="10"
                            value={log.actual_rpe}
                            onChange={(e) => updateSetLog(set.id, 'actual_rpe', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`notes-${set.id}`} className="text-xs">
                          Notes (optional)
                        </Label>
                        <Input
                          id={`notes-${set.id}`}
                          value={log.notes}
                          onChange={(e) => updateSetLog(set.id, 'notes', e.target.value)}
                          placeholder="How did it feel?"
                        />
                      </div>
                      <Button 
                        onClick={() => markSetComplete(set.id)}
                        className="w-full"
                        size="sm"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete Set
                      </Button>
                    </div>
                  )}

                  {log.completed && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Completed: {log.actual_weight} lbs × {log.actual_reps} reps @ RPE {log.actual_rpe}</p>
                      {log.notes && <p className="italic">"{log.notes}"</p>}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="space-y-3 pt-4 border-t">
              <div>
                <Label htmlFor="workout-notes">Workout Notes</Label>
                <Textarea
                  id="workout-notes"
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  placeholder="How was your workout overall?"
                  rows={3}
                />
              </div>
              <Button 
                onClick={saveWorkout} 
                className="w-full" 
                size="lg"
                disabled={completedSets === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Workout ({completedSets}/{sets.length} sets)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
