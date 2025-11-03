import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Apple, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MealPlan {
  id: string;
  title: string;
  description: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fats: number;
}

export function MealPlanManager({ trainerId }: { trainerId: string }) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newMealPlan, setNewMealPlan] = useState({
    title: '',
    description: '',
    target_calories: 2000,
    target_protein: 150,
    target_carbs: 200,
    target_fats: 60,
  });

  useEffect(() => {
    fetchMealPlans();
  }, [trainerId]);

  const fetchMealPlans = async () => {
    const { data, error } = await supabase
      .from('meal_plan_templates')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false });

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

  const handleCreateMealPlan = async () => {
    if (!newMealPlan.title.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a meal plan title",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('meal_plan_templates')
      .insert({
        trainer_id: trainerId,
        ...newMealPlan,
      });

    if (error) {
      toast({
        title: "Error creating meal plan",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Meal plan template created",
      });
      setIsDialogOpen(false);
      fetchMealPlans();
      setNewMealPlan({
        title: '',
        description: '',
        target_calories: 2000,
        target_protein: 150,
        target_carbs: 200,
        target_fats: 60,
      });
    }
  };

  const handleDeleteMealPlan = async (mealPlanId: string) => {
    const { error } = await supabase
      .from('meal_plan_templates')
      .delete()
      .eq('id', mealPlanId);

    if (error) {
      toast({
        title: "Error deleting meal plan",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Meal plan template deleted",
      });
      fetchMealPlans();
    }
  };

  if (loading) return <div>Loading meal plans...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Meal Plans</CardTitle>
          <CardDescription>Create and manage meal plan templates</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Meal Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Meal Plan Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plan Title *</Label>
                <Input
                  placeholder="e.g., Weight Loss 1800 Cal"
                  value={newMealPlan.title}
                  onChange={(e) => setNewMealPlan({ ...newMealPlan, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the meal plan goals..."
                  value={newMealPlan.description}
                  onChange={(e) => setNewMealPlan({ ...newMealPlan, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Calories</Label>
                  <Input
                    type="number"
                    value={newMealPlan.target_calories}
                    onChange={(e) => setNewMealPlan({ ...newMealPlan, target_calories: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    value={newMealPlan.target_protein}
                    onChange={(e) => setNewMealPlan({ ...newMealPlan, target_protein: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Carbs (g)</Label>
                  <Input
                    type="number"
                    value={newMealPlan.target_carbs}
                    onChange={(e) => setNewMealPlan({ ...newMealPlan, target_carbs: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fats (g)</Label>
                  <Input
                    type="number"
                    value={newMealPlan.target_fats}
                    onChange={(e) => setNewMealPlan({ ...newMealPlan, target_fats: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <Button className="w-full" onClick={handleCreateMealPlan}>
                Create Meal Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {mealPlans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No meal plans yet. Create your first meal plan template.
          </div>
        ) : (
          mealPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-all"
            >
              <div className="flex items-center gap-3">
                <Apple className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">{plan.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {plan.description || "No description"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-sm">
                  <div className="font-semibold">{plan.target_calories} cal</div>
                  <div className="text-muted-foreground">
                    P: {plan.target_protein}g C: {plan.target_carbs}g F: {plan.target_fats}g
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMealPlan(plan.id)}
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