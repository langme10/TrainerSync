import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Apple, Calendar } from "lucide-react";

interface ClientMealPlan {
  id: string;
  title: string;
  start_date: string;
  status: string;
  notes: string;
}

export function MealPlanViewer({ clientId }: { clientId: string }) {
  const [mealPlans, setMealPlans] = useState<ClientMealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMealPlans();
  }, [clientId]);

  const fetchMealPlans = async () => {
    const { data, error } = await supabase
      .from('client_meal_plans')
      .select('*')
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
            <div
              key={plan.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted"
            >
              <div className="flex items-center gap-3">
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
          ))
        )}
      </CardContent>
    </Card>
  );
}