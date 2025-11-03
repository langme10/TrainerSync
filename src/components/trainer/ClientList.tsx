import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, Calendar, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClientListProps {
  trainerId: string;
}

export function ClientList({ trainerId }: ClientListProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, [trainerId]);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("client_profiles")
      .select("id, user_id, goals, experience_level, created_at, profiles(full_name, email, phone)")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch additional stats for each client
      const clientsWithStats = await Promise.all(
        data.map(async (client) => {
          const { count: workoutCount } = await supabase
            .from("workout_logs")
            .select("*", { count: 'exact', head: true })
            .eq("client_id", client.id);

          const { data: nextSession } = await supabase
            .from("bookings")
            .select("booking_date, start_time")
            .eq("client_id", client.id)
            .gte("booking_date", new Date().toISOString().split('T')[0])
            .eq("status", "confirmed")
            .order("booking_date", { ascending: true })
            .order("start_time", { ascending: true })
            .limit(1)
            .maybeSingle();

          return {
            ...client,
            workoutCount: workoutCount || 0,
            nextSession,
          };
        })
      );

      setClients(clientsWithStats);
    }
    setLoading(false);
  };

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      client.profiles?.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Management</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Loading clients...</p>
        ) : filteredClients.length === 0 ? (
          <p className="text-center text-muted-foreground">
            {searchTerm ? "No clients found matching your search." : "No clients yet."}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {client.profiles?.full_name || "Unknown Client"}
                        </h3>
                        {client.experience_level && (
                          <Badge variant="secondary">{client.experience_level}</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {client.profiles?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{client.profiles.email}</span>
                          </div>
                        )}
                        {client.profiles?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{client.profiles.phone}</span>
                          </div>
                        )}
                        {client.nextSession && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Next session: {new Date(client.nextSession.booking_date).toLocaleDateString()} at{" "}
                              {client.nextSession.start_time.slice(0, 5)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3" />
                          <span>{client.workoutCount} workouts completed</span>
                        </div>
                      </div>

                      {client.goals && (
                        <p className="mt-2 text-sm">
                          <span className="font-medium">Goals:</span> {client.goals}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/messages`)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
