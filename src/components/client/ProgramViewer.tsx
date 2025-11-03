import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Calendar } from "lucide-react";

interface ClientProgram {
  id: string;
  title: string;
  start_date: string;
  status: string;
  notes: string;
  template_id: string;
  program_templates?: {
    description: string;
    duration_weeks: number;
  };
}

export function ProgramViewer({ clientId }: { clientId: string }) {
  const [programs, setPrograms] = useState<ClientProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<ClientProgram | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrograms();
  }, [clientId]);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from('client_programs')
      .select(`
        *,
        program_templates!template_id (
          description,
          duration_weeks
        )
      `)
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

  const handleProgramClick = (program: ClientProgram) => {
    setSelectedProgram(program);
    setIsDialogOpen(true);
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
            <Button
              key={program.id}
              variant="ghost"
              className="w-full h-auto p-0 hover:bg-muted/80"
              onClick={() => handleProgramClick(program)}
            >
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted w-full">
                <div className="flex items-center gap-3 text-left">
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
            </Button>
          ))
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProgram?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-semibold mb-2">Program Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Started: {selectedProgram && new Date(selectedProgram.start_date).toLocaleDateString()}</span>
                </div>
                {selectedProgram?.program_templates?.duration_weeks && (
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    <span>Duration: {selectedProgram.program_templates.duration_weeks} weeks</span>
                  </div>
                )}
                <div>
                  <Badge variant={selectedProgram?.status === 'active' ? 'default' : 'secondary'}>
                    {selectedProgram?.status}
                  </Badge>
                </div>
              </div>
            </div>

            {selectedProgram?.program_templates?.description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedProgram.program_templates.description}
                </p>
              </div>
            )}

            {selectedProgram?.notes && (
              <div>
                <h4 className="font-semibold mb-2">Trainer Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedProgram.notes}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}