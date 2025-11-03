import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Apple, Trash2, UserPlus } from "lucide-react";
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

interface Client {
  id: string;
  profiles: {
    full_name: string;
  };
}

export function MealPlanManager({ trainerId }: { trainerId: string }) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
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
    fetchClients();
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

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('id, profiles(full_name)')
      .eq('trainer_id', trainerId);

    if (error) {
      console.error("Error loading clients:", error);
    } else {
      setClients(data || []);
    }
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

  const handleAssignMealPlan = async () => {
    if (!selectedClientId || !selectedMealPlan) {
      toast({
        title: "Missing information",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('client_meal_plans')
      .insert({
        client_id: selectedClientId,
        template_id: selectedMealPlan.id,
        title: selectedMealPlan.title,
        start_date: today,
        notes: assignmentNotes,
        status: 'active',
      });

    if (error) {
      toast({
        title: "Error assigning meal plan",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Meal plan assigned to client",
      });
      setIsAssignDialogOpen(false);
      setSelectedMealPlan(null);
      setSelectedClientId('');
      setAssignmentNotes('');
    }
  };

  const openAssignDialog = (mealPlan: MealPlan) => {
    setSelectedMealPlan(mealPlan);
    setIsAssignDialogOpen(true);
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
                  variant="outline"
                  size="sm"
                  onClick={() => openAssignDialog(plan)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assign
                </Button>
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

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Meal Plan to Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Meal Plan</Label>
              <Input value={selectedMealPlan?.title || ''} disabled />
            </div>

            <div className="space-y-2">
              <Label>Select Client *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.profiles.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any notes or instructions for the client..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handleAssignMealPlan}>
              Assign Meal Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}