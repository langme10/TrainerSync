import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Apple, Calendar } from "lucide-react";

interface ClientMealPlan {
  id: string;
  title: string;
  start_date: string;
  status: string;
  notes: string;
  template_id: string;
  meal_plan_templates?: {
    description: string;
    target_calories: number;
    target_protein: number;
    target_carbs: number;
    target_fats: number;
  };
}

export function MealPlanViewer({ clientId }: { clientId: string }) {
  const [mealPlans, setMealPlans] = useState<ClientMealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMealPlan, setSelectedMealPlan] = useState<ClientMealPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMealPlans();
  }, [clientId]);

  const fetchMealPlans = async () => {
    const { data, error } = await supabase
      .from('client_meal_plans')
      .select(`
        *,
        meal_plan_templates!template_id (
          description,
          target_calories,
          target_protein,
          target_carbs,
          target_fats
        )
      `)
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });

    if (error) {
      toast({
        title: "Error loading meal plans",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMealPlans(data || []);
    }
    setLoading(false);
  };

  const handleMealPlanClick = (mealPlan: ClientMealPlan) => {
    setSelectedMealPlan(mealPlan);
    setIsDialogOpen(true);
  };

  if (loading) return <div>Loading meal plans...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Meal Plans</CardTitle>
        <CardDescription>Your assigned nutrition plans</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {mealPlans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No meal plans assigned yet. Your trainer will assign a plan soon.
          </div>
        ) : (
          mealPlans.map((plan) => (
            <Button
              key={plan.id}
              variant="ghost"
              className="w-full h-auto p-0 hover:bg-muted/80"
              onClick={() => handleMealPlanClick(plan)}
            >
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted w-full">
                <div className="flex items-center gap-3 text-left">
                  <Apple className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">{plan.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Started: {new Date(plan.start_date).toLocaleDateString()}
                    </div>
                    {plan.notes && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {plan.notes}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                  {plan.status}
                </Badge>
              </div>
            </Button>
          ))
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMealPlan?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-semibold mb-2">Meal Plan Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Started: {selectedMealPlan && new Date(selectedMealPlan.start_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <Badge variant={selectedMealPlan?.status === 'active' ? 'default' : 'secondary'}>
                    {selectedMealPlan?.status}
                  </Badge>
                </div>
              </div>
            </div>

            {selectedMealPlan?.meal_plan_templates && (
              <div>
                <h4 className="font-semibold mb-2">Nutrition Targets</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-muted-foreground">Calories</div>
                    <div className="text-lg font-semibold">{selectedMealPlan.meal_plan_templates.target_calories}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-muted-foreground">Protein</div>
                    <div className="text-lg font-semibold">{selectedMealPlan.meal_plan_templates.target_protein}g</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-muted-foreground">Carbs</div>
                    <div className="text-lg font-semibold">{selectedMealPlan.meal_plan_templates.target_carbs}g</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-muted-foreground">Fats</div>
                    <div className="text-lg font-semibold">{selectedMealPlan.meal_plan_templates.target_fats}g</div>
                  </div>
                </div>
              </div>
            )}

            {selectedMealPlan?.meal_plan_templates?.description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedMealPlan.meal_plan_templates.description}
                </p>
              </div>
            )}

            {selectedMealPlan?.notes && (
              <div>
                <h4 className="font-semibold mb-2">Trainer Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedMealPlan.notes}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}