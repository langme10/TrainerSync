import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Exercise {
  id: string;
  name: string;
}

interface ProgressData {
  date: string;
  weight: number;
  reps: number;
  volume: number;
}

export function ProgressTracking({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90" | "all">("30");

  useEffect(() => {
    fetchExercises();
  }, [clientId]);

  useEffect(() => {
    if (selectedExercise) {
      fetchProgressData(selectedExercise);
    }
  }, [selectedExercise, timeRange]);

  const fetchExercises = async () => {
    // Get all exercises the client has logged
    const { data, error } = await supabase
      .from('set_logs')
      .select(`
        workout_set_id,
        workout_sets (
          exercise_id,
          exercises (
            id,
            name
          )
        )
      `)
      .eq('workout_sets.workout_id', clientId);

    if (error) {
      console.error('Error fetching exercises:', error);
      return;
    }

    // Get unique exercises
    const uniqueExercises = new Map<string, string>();
    data?.forEach((log: any) => {
      const exercise = log.workout_sets?.exercises;
      if (exercise) {
        uniqueExercises.set(exercise.id, exercise.name);
      }
    });

    const exerciseList = Array.from(uniqueExercises.entries()).map(([id, name]) => ({
      id,
      name
    }));

    setExercises(exerciseList);
    if (exerciseList.length > 0) {
      setSelectedExercise(exerciseList[0].id);
    }
  };

  const fetchProgressData = async (exerciseId: string) => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      if (timeRange !== "all") {
        startDate.setDate(now.getDate() - parseInt(timeRange));
      } else {
        startDate.setFullYear(now.getFullYear() - 5); // 5 years back for "all"
      }

      const { data, error } = await supabase
        .from('set_logs')
        .select(`
          actual_weight,
          actual_reps,
          created_at,
          workout_log:workout_logs!inner (
            completed_at,
            client_id
          ),
          workout_sets!inner (
            exercise_id
          )
        `)
        .eq('workout_log.client_id', clientId)
        .eq('workout_sets.exercise_id', exerciseId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process data for chart
      const processedData: ProgressData[] = data?.map((log: any) => ({
        date: format(new Date(log.created_at), 'MMM dd'),
        weight: log.actual_weight || 0,
        reps: log.actual_reps || 0,
        volume: (log.actual_weight || 0) * (log.actual_reps || 0)
      })) || [];

      setProgressData(processedData);
    } catch (error: any) {
      toast({
        title: "Error loading progress data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (progressData.length === 0) return null;

    const maxWeight = Math.max(...progressData.map(d => d.weight));
    const avgReps = progressData.reduce((sum, d) => sum + d.reps, 0) / progressData.length;
    const totalVolume = progressData.reduce((sum, d) => sum + d.volume, 0);
    const workoutCount = progressData.length;

    return { maxWeight, avgReps, totalVolume, workoutCount };
  };

  const stats = calculateStats();

  if (exercises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No workout data yet.</p>
            <p className="text-sm">Complete some workouts to track your progress!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Progress Tracking</CardTitle>
          <CardDescription>Track your strength gains over time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Exercise</label>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exercise" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((exercise) => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : progressData.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats && (
                  <>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground">Max Weight</p>
                      <p className="text-2xl font-bold">{stats.maxWeight} lbs</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground">Avg Reps</p>
                      <p className="text-2xl font-bold">{stats.avgReps.toFixed(1)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground">Total Volume</p>
                      <p className="text-2xl font-bold">{stats.totalVolume.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground">Workouts</p>
                      <p className="text-2xl font-bold">{stats.workoutCount}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Weight Progress</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Weight (lbs)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Volume (Weight × Reps)</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        name="Volume"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No data for selected period</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
