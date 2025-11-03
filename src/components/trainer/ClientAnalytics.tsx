import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Activity, Calendar, Target } from "lucide-react";

interface ClientAnalyticsProps {
  trainerId: string;
}

export function ClientAnalytics({ trainerId }: ClientAnalyticsProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [workoutData, setWorkoutData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    completionRate: 0,
    avgDuration: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    fetchClients();
  }, [trainerId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientAnalytics(selectedClientId);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("client_profiles")
      .select(`
        id,
        user_id,
        profiles!client_profiles_user_id_fkey (
          full_name
        )
      `)
      .eq("trainer_id", trainerId);

    if (error) {
      console.error("Error fetching clients:", error);
      return;
    }

    if (data) {
      console.log("Fetched clients:", data);
      setClients(data);
      if (data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    }
  };

  const fetchClientAnalytics = async (clientId: string) => {
    // Fetch workout logs for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs } = await supabase
      .from("workout_logs")
      .select("*, workouts(title)")
      .eq("client_id", clientId)
      .gte("completed_at", thirtyDaysAgo.toISOString())
      .order("completed_at", { ascending: true });

    if (logs) {
      // Calculate stats
      const totalWorkouts = logs.length;
      const avgDuration = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / totalWorkouts || 0;

      // Calculate completion rate (workouts completed vs scheduled)
      const { count: scheduledCount } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .eq("client_id", clientId)
        .gte("booking_date", thirtyDaysAgo.toISOString().split('T')[0])
        .eq("status", "confirmed");

      const completionRate = scheduledCount ? (totalWorkouts / scheduledCount) * 100 : 0;

      // Group by date for chart
      const workoutsByDate = logs.reduce((acc: any, log) => {
        const date = new Date(log.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(workoutsByDate).map(([date, count]) => ({
        date,
        workouts: count,
      }));

      setWorkoutData(chartData);
      setStats({
        totalWorkouts,
        completionRate: Math.round(completionRate),
        avgDuration: Math.round(avgDuration),
        currentStreak: calculateStreak(logs),
      });

      // Fetch progress data (weight trends)
      await fetchProgressData(clientId);
    }
  };

  const fetchProgressData = async (clientId: string) => {
    const { data: setLogs } = await supabase
      .from("set_logs")
      .select(`
        created_at,
        actual_weight,
        workout_log_id,
        workout_logs!inner(client_id),
        workout_set_id,
        workout_sets!inner(exercise_id, exercises(name))
      `)
      .eq("workout_logs.client_id", clientId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (setLogs) {
      // Group by exercise and calculate average weight over time
      const exerciseProgress: any = {};
      
      setLogs.forEach((log: any) => {
        const exerciseName = log.workout_sets?.exercises?.name || "Unknown";
        if (!exerciseProgress[exerciseName]) {
          exerciseProgress[exerciseName] = [];
        }
        exerciseProgress[exerciseName].push({
          date: new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: log.actual_weight || 0,
        });
      });

      // Take the top 3 exercises by number of logs
      const topExercises = Object.entries(exerciseProgress)
        .sort((a: any, b: any) => b[1].length - a[1].length)
        .slice(0, 3);

      const progressChartData: any[] = [];
      if (topExercises.length > 0) {
        const maxLength = Math.max(...topExercises.map((e: any) => e[1].length));
        for (let i = 0; i < Math.min(maxLength, 10); i++) {
          const dataPoint: any = { index: i + 1 };
          topExercises.forEach(([name, data]: any) => {
            if (data[i]) {
              dataPoint[name] = data[i].weight;
            }
          });
          progressChartData.push(dataPoint);
        }
      }

      setProgressData(progressChartData);
    }
  };

  const calculateStreak = (logs: any[]) => {
    if (logs.length === 0) return 0;
    
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );

    let streak = 1;
    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const current = new Date(sortedLogs[i].completed_at);
      const next = new Date(sortedLogs[i + 1].completed_at);
      const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getClientName = (client: any) => {
    return client?.profiles?.full_name || "Unknown Client";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {getClientName(client)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClientId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completionRate}%</div>
                <p className="text-xs text-muted-foreground">Of scheduled sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgDuration} min</div>
                <p className="text-xs text-muted-foreground">Per workout</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.currentStreak}</div>
                <p className="text-xs text-muted-foreground">Consecutive workouts</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workout Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workoutData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="workouts" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {progressData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Strength Progress (Top 3 Exercises)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" label={{ value: 'Workout Session', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {Object.keys(progressData[0] || {})
                      .filter(key => key !== 'index')
                      .map((exercise, index) => (
                        <Line 
                          key={exercise}
                          type="monotone" 
                          dataKey={exercise} 
                          stroke={`hsl(var(--chart-${(index % 5) + 1}))`}
                          strokeWidth={2}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
