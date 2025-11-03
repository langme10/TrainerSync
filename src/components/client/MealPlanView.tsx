import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Apple, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClientMealPlan {
  id: string;
  title: string;
  start_date: string;
  status: string;
}

interface Meal {
  id: string;
  meal_type: string;
  name: string;
  description: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export function MealPlanView({ clientId }: { clientId: string }) {
  const [mealPlans, setMealPlans] = useState<ClientMealPlan[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchMealPlans();
  }, [clientId]);

  const fetchMealPlans = async () => {
    const { data, error } = await supabase
      .from('client_meal_plans')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .order('start_date', { ascending: false });

    if (error) {
      toast({
        title: "Error loading meal plans",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMealPlans(data || []);
      if (data && data.length > 0) {
        fetchMeals(data[0].id);
      }
    }
  };

  const fetchMeals = async (mealPlanId: string) => {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('client_meal_plan_id', mealPlanId);

    if (error) {
      toast({
        title: "Error loading meals",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMeals(data || []);
    }
  };

  const getMealsByType = (type: string) => {
    return meals.filter(meal => meal.meal_type === type);
  };

  const getTotalMacros = () => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fats: acc.fats + (meal.fats || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  if (mealPlans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Meal Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Apple className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No meal plan assigned yet.</p>
            <p className="text-sm">Your trainer will assign a nutrition plan when ready.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totals = getTotalMacros();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{mealPlans[0].title}</CardTitle>
          <CardDescription>Daily Nutrition Overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary">{totals.calories}</div>
              <div className="text-sm text-muted-foreground">Calories</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary">{totals.protein}g</div>
              <div className="text-sm text-muted-foreground">Protein</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary">{totals.carbs}g</div>
              <div className="text-sm text-muted-foreground">Carbs</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary">{totals.fats}g</div>
              <div className="text-sm text-muted-foreground">Fats</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {MEAL_TYPES.map((mealType) => {
        const typeMeals = getMealsByType(mealType);
        if (typeMeals.length === 0) return null;

        return (
          <Card key={mealType}>
            <CardHeader>
              <CardTitle className="capitalize flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                {mealType}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {typeMeals.map((meal) => (
                <div key={meal.id} className="p-4 rounded-lg bg-muted">
                  <div className="font-semibold text-lg">{meal.name}</div>
                  {meal.description && (
                    <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {meal.calories !== null && (
                      <Badge variant="outline">{meal.calories} cal</Badge>
                    )}
                    {meal.protein !== null && (
                      <Badge variant="outline">{meal.protein}g P</Badge>
                    )}
                    {meal.carbs !== null && (
                      <Badge variant="outline">{meal.carbs}g C</Badge>
                    )}
                    {meal.fats !== null && (
                      <Badge variant="outline">{meal.fats}g F</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}