import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ConversationsList } from "@/components/messaging/ConversationsList";
import { MessagingInterface } from "@/components/messaging/MessagingInterface";

export default function Messages() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  // Auto-select conversation if coming from navigation with state
  useEffect(() => {
    if (location.state?.selectedUserId) {
      setSelectedUserId(location.state.selectedUserId);
      setSelectedUserName(location.state.selectedUserName || "User");
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
          <Button onClick={signOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
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
