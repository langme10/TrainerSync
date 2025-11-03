import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, CheckCircle2, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WorkoutLogger } from "./WorkoutLogger";

interface ClientProgram {
  id: string;
  title: string;
  start_date: string;
  status: string;
}

interface Workout {
  id: string;
  title: string;
  day_index: number;
  notes: string | null;
}

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

export function WorkoutView({ clientId }: { clientId: string }) {
  const [programs, setPrograms] = useState<ClientProgram[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrograms();
  }, [clientId]);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from('client_programs')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .order('start_date', { ascending: false });

    if (error) {
      toast({
        title: "Error loading programs",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPrograms(data || []);
      if (data && data.length > 0) {
        fetchWorkouts(data[0].id);
      }
    }
  };

  const fetchWorkouts = async (programId: string) => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('client_program_id', programId)
      .order('day_index');

    if (error) {
      toast({
        title: "Error loading workouts",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setWorkouts(data || []);
    }
  };

  const fetchWorkoutSets = async (workoutId: string) => {
    const { data, error } = await supabase
      .from('workout_sets')
      .select(`
        *,
        exercises (
          name,
          instructions
        )
      `)
      .eq('workout_id', workoutId)
      .order('set_order');

    if (error) {
      toast({
        title: "Error loading exercises",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSets(data || []);
    }
  };

  const handleViewWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setIsLoggingWorkout(false);
    fetchWorkoutSets(workout.id);
  };

  const handleStartWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setIsLoggingWorkout(true);
    fetchWorkoutSets(workout.id);
  };

  const handleWorkoutComplete = () => {
    setIsLoggingWorkout(false);
    setSelectedWorkout(null);
    toast({
      title: "Workout Logged!",
      description: "Great job! Your progress has been saved.",
    });
  };

  if (programs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No workout program assigned yet.</p>
            <p className="text-sm">Your trainer will assign a program when ready.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Current Program</CardTitle>
          <CardDescription>{programs[0].title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/30 hover:border-primary transition-all"
            >
              <div className="flex-1">
                <div className="font-semibold">Day {workout.day_index + 1}: {workout.title}</div>
                {workout.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{workout.notes}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleViewWorkout(workout)}
                >
                  View
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleStartWorkout(workout)}
                  className="gap-2"
                >
                  <Play className="h-3 w-3" />
                  Log Workout
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedWorkout && sets.length > 0 && (
        <>
          {isLoggingWorkout ? (
            <WorkoutLogger
              workoutId={selectedWorkout.id}
              workoutTitle={selectedWorkout.title}
              clientId={clientId}
              sets={sets}
              onComplete={handleWorkoutComplete}
              onCancel={() => setIsLoggingWorkout(false)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{selectedWorkout.title}</CardTitle>
                <CardDescription>Day {selectedWorkout.day_index + 1}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sets.map((set) => (
                  <div key={set.id} className="p-4 rounded-lg bg-muted">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-lg">{set.exercises.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Set {set.set_order}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-3 flex-wrap">
                      {set.target_reps && (
                        <Badge variant="outline">
                          {set.target_reps} reps
                        </Badge>
                      )}
                      {set.target_weight && (
                        <Badge variant="outline">
                          {set.target_weight} lbs
                        </Badge>
                      )}
                      {set.target_rpe && (
                        <Badge variant="outline">
                          RPE {set.target_rpe}
                        </Badge>
                      )}
                      {set.rest_seconds && (
                        <Badge variant="outline">
                          {set.rest_seconds}s rest
                        </Badge>
                      )}
                    </div>

                    {set.exercises.instructions && (
                      <p className="text-sm text-muted-foreground mt-3 p-2 bg-background rounded">
                        {set.exercises.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}