import { useAuth } from "@/hooks/useAuth";
import { TrainerDashboard } from "@/components/dashboard/TrainerDashboard";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";

const Index = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return null;
  }

  // Show appropriate dashboard based on user role
  if (profile?.role === "trainer") {
    return <TrainerDashboard />;
  }

  return <ClientDashboard />;
};

export default Index;