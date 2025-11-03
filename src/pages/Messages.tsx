import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ConversationsList } from "@/components/messaging/ConversationsList";
import { MessagingInterface } from "@/components/messaging/MessagingInterface";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Messages() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [trainerInfo, setTrainerInfo] = useState<{ user_id: string; full_name: string } | null>(null);

  // Auto-select conversation if coming from navigation with state
  useEffect(() => {
    if (location.state?.selectedUserId) {
      setSelectedUserId(location.state.selectedUserId);
      setSelectedUserName(location.state.selectedUserName || "User");
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch clients for trainers or trainer info for clients
  useEffect(() => {
    if (profile?.role === 'trainer') {
      fetchClients();
    } else if (profile?.role === 'client') {
      fetchTrainerInfo();
    }
  }, [profile]);

  const fetchClients = async () => {
    if (!profile?.id) return;

    // Get trainer profile id
    const { data: trainerProfile } = await supabase
      .from('trainer_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (trainerProfile) {
      const { data } = await supabase
        .from('client_profiles')
        .select('id, user_id, profiles!inner(id, full_name, email)')
        .eq('trainer_id', trainerProfile.id);

      if (data) {
        setClients(data);
      }
    }
  };

  const fetchTrainerInfo = async () => {
    if (!profile?.id) return;

    const { data: clientProfile } = await supabase
      .from('client_profiles')
      .select('trainer_id')
      .eq('user_id', profile.id)
      .single();

    if (clientProfile?.trainer_id) {
      const { data: trainerData } = await supabase
        .from('trainer_profiles')
        .select('user_id, profiles!inner(full_name)')
        .eq('id', clientProfile.trainer_id)
        .single();

      if (trainerData && trainerData.profiles) {
        setTrainerInfo({
          user_id: trainerData.user_id,
          full_name: (trainerData.profiles as any).full_name || 'Your Trainer'
        });
      }
    }
  };

  const handleSelectClient = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setIsNewChatOpen(false);
  };

  const handleMessageTrainer = () => {
    if (trainerInfo) {
      setSelectedUserId(trainerInfo.user_id);
      setSelectedUserName(trainerInfo.full_name);
    }
  };

  const handleSelectConversation = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
  };

  const handleBack = () => {
    if (selectedUserId) {
      setSelectedUserId(null);
      setSelectedUserName("");
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button onClick={handleBack} variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Messages</h1>
              <p className="text-muted-foreground">
                {profile?.role === 'trainer' ? 'Chat with your clients' : 'Chat with your trainer'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {profile?.role === 'trainer' ? (
              <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <Plus className="mr-2 h-4 w-4" />
                    New Chat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select a Client</DialogTitle>
                    <DialogDescription>
                      Choose a client to start messaging
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-2">
                      {clients.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No clients found
                        </p>
                      ) : (
                        clients.map((client) => (
                          <Button
                            key={client.user_id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => handleSelectClient(
                              client.user_id,
                              client.profiles.full_name
                            )}
                          >
                            <div className="text-left">
                              <div className="font-semibold">{client.profiles.full_name}</div>
                              <div className="text-sm text-muted-foreground">{client.profiles.email}</div>
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            ) : (
              <Button 
                variant="default"
                onClick={handleMessageTrainer}
                disabled={!trainerInfo}
              >
                <Plus className="mr-2 h-4 w-4" />
                Message Trainer
              </Button>
            )}
            <Button onClick={signOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className={selectedUserId ? "hidden md:block" : "md:col-span-1"}>
            <ConversationsList onSelectConversation={handleSelectConversation} />
          </div>
          
          {selectedUserId && (
            <div className="md:col-span-2">
              <MessagingInterface 
                otherUserId={selectedUserId}
                otherUserName={selectedUserName}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
