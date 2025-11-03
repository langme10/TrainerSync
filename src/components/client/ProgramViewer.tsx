import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Calendar } from "lucide-react";

interface ClientProgram {
  id: string;
  title: string;
  start_date: string;
  status: string;
  notes: string;
}

export function ProgramViewer({ clientId }: { clientId: string }) {
  const [programs, setPrograms] = useState<ClientProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrograms();
  }, [clientId]);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from('client_programs')
      .select('*')
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });

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

  if (loading) return <div>Loading programs...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Workout Programs</CardTitle>
        <CardDescription>Your assigned workout programs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {programs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No programs assigned yet. Your trainer will assign a program soon.
          </div>
        ) : (
          programs.map((program) => (
            <div
              key={program.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted"
            >
              <div className="flex items-center gap-3">
                <Dumbbell className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">{program.title}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Started: {new Date(program.start_date).toLocaleDateString()}
                  </div>
                  {program.notes && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {program.notes}
                    </div>
                  )}
                </div>
              </div>
              <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                {program.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}