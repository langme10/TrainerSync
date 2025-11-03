import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Calendar, TrendingUp, Dumbbell, UserCheck, Clock, Plus, Settings } from "lucide-react";

const Index = () => {
  const [userType, setUserType] = useState<'trainer' | 'client' | null>(null);

  const handleRoleSelect = (role: 'trainer' | 'client') => {
    setUserType(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors animate-fade-in">
            Professional Fitness Management
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-scale-in">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              TrainerSync
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Streamline your fitness business with smart scheduling, progress tracking, and seamless trainer-client communication.
          </p>

          {!userType ? (
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in">
              <Button 
                size="lg" 
                onClick={() => handleRoleSelect('trainer')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold shadow-fitness transition-all hover:scale-105 hover-scale"
              >
                <Users className="mr-2 h-5 w-5" />
                I'm a Trainer
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                onClick={() => handleRoleSelect('client')}
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg font-semibold transition-all hover:scale-105 hover-scale"
              >
                <UserCheck className="mr-2 h-5 w-5" />
                I'm a Client
              </Button>
            </div>
          ) : (
            <div className="animate-slide-in-right">
              <Button 
                variant="ghost" 
                onClick={() => setUserType(null)}
                className="text-muted-foreground hover:text-foreground mb-6 hover-scale"
              >
                ← Back to role selection
              </Button>
              
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-8 max-w-5xl mx-auto shadow-card-hover border animate-scale-in">
                <h2 className="text-3xl font-bold mb-6 text-center">
                  {userType === 'trainer' ? 'Trainer Dashboard' : 'Client Dashboard'}
                </h2>
                
                {userType === 'trainer' ? <TrainerDashboard /> : <ClientDashboard />}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Preview */}
      {!userType && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">
              Everything you need in one platform
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gradient-card border-0 shadow-card-hover hover:shadow-fitness transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <Calendar className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Smart Scheduling</CardTitle>
                  <CardDescription>
                    Effortlessly manage appointments and availability with automated reminders
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="bg-gradient-card border-0 shadow-card-hover hover:shadow-fitness transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <TrendingUp className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Progress Tracking</CardTitle>
                  <CardDescription>
                    Visualize client progress with detailed analytics and performance metrics
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="bg-gradient-card border-0 shadow-card-hover hover:shadow-fitness transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <Dumbbell className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Custom Routines</CardTitle>
                  <CardDescription>
                    Create and share personalized workout plans tailored to each client
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const TrainerDashboard = () => {
  const [availableSlots, setAvailableSlots] = useState([
    { id: 1, day: 'Monday', time: '9:00 AM', duration: 60, booked: false },
    { id: 2, day: 'Monday', time: '10:30 AM', duration: 60, booked: true },
    { id: 3, day: 'Tuesday', time: '2:00 PM', duration: 90, booked: false },
    { id: 4, day: 'Wednesday', time: '11:00 AM', duration: 60, booked: false },
    { id: 5, day: 'Thursday', time: '4:00 PM', duration: 60, booked: true },
    { id: 6, day: 'Friday', time: '9:30 AM', duration: 60, booked: false },
  ]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-primary text-white border-0 hover-scale transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Clients
            </CardTitle>
            <div className="text-3xl font-bold">24</div>
          </CardHeader>
        </Card>
        
        <Card className="hover-scale transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Sessions
            </CardTitle>
            <div className="text-3xl font-bold text-primary">6</div>
          </CardHeader>
        </Card>
        
        <Card className="hover-scale transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              This Week
            </CardTitle>
            <div className="text-3xl font-bold text-success">32</div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover-scale transition-all">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Available Time Slots</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="hover-scale">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Slot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Available Time Slot</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="text-sm text-muted-foreground">
                    Set your available times for clients to book sessions.
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Day</label>
                      <select className="w-full p-2 border rounded-lg mt-1">
                        <option>Monday</option>
                        <option>Tuesday</option>
                        <option>Wednesday</option>
                        <option>Thursday</option>
                        <option>Friday</option>
                        <option>Saturday</option>
                        <option>Sunday</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Time</label>
                      <input type="time" className="w-full p-2 border rounded-lg mt-1" />
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Save Time Slot
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableSlots.map((slot) => (
              <div key={slot.id} className={`flex items-center justify-between p-3 rounded-lg transition-all hover-scale ${
                slot.booked ? 'bg-success/10 border border-success/20' : 'bg-muted hover:bg-muted/80'
              }`}>
                <div>
                  <div className="font-semibold">{slot.day}</div>
                  <div className="text-sm text-muted-foreground">{slot.duration} minutes</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 ${slot.booked ? 'text-success' : 'text-primary'}`}>
                    <Clock className="h-4 w-4" />
                    {slot.time}
                  </div>
                  <Badge variant={slot.booked ? 'default' : 'secondary'}>
                    {slot.booked ? 'Booked' : 'Available'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="hover-scale transition-all">
          <CardHeader>
            <CardTitle>Recent Client Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { client: "Alex Rivera", improvement: "+15% Strength", status: "excellent" },
              { client: "Lisa Park", improvement: "+8 lbs Lost", status: "good" },
              { client: "John Smith", improvement: "+12% Endurance", status: "excellent" },
            ].map((progress, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg hover-scale transition-all">
                <div>
                  <div className="font-semibold">{progress.client}</div>
                  <div className="text-sm text-success">{progress.improvement}</div>
                </div>
                <Badge variant={progress.status === 'excellent' ? 'default' : 'secondary'}>
                  {progress.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="hover-scale transition-all">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-primary hover:bg-primary/90 hover-scale">
              <Settings className="mr-2 h-4 w-4" />
              Manage Schedule
            </Button>
            <Button variant="outline" className="hover-scale">
              <Dumbbell className="mr-2 h-4 w-4" />
              Create Routine
            </Button>
            <Button variant="outline" className="hover-scale">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ClientDashboard = () => {
  const [trainerSlots] = useState([
    { id: 1, day: 'Monday', time: '9:00 AM', duration: 60, available: true },
    { id: 2, day: 'Tuesday', time: '2:00 PM', duration: 90, available: true },
    { id: 3, day: 'Wednesday', time: '11:00 AM', duration: 60, available: true },
    { id: 4, day: 'Friday', time: '9:30 AM', duration: 60, available: true },
  ]);

  const handleBookSession = (slotId: number) => {
    // In a real app, this would make an API call to book the session
    console.log(`Booking session with ID: ${slotId}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-primary text-white border-0 hover-scale transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Session
            </CardTitle>
            <div className="text-xl font-bold">Tomorrow 10:00 AM</div>
            <div className="text-sm opacity-90">with Coach Sarah</div>
          </CardHeader>
        </Card>
        
        <Card className="hover-scale transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Workouts This Week
            </CardTitle>
            <div className="text-3xl font-bold text-success">4/5</div>
          </CardHeader>
        </Card>
        
        <Card className="hover-scale transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Current Goal
            </CardTitle>
            <div className="text-lg font-bold text-primary">Lose 10 lbs</div>
            <div className="text-sm text-muted-foreground">6 lbs to go!</div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover-scale transition-all">
          <CardHeader>
            <CardTitle>Book a Session with Coach Sarah</CardTitle>
            <CardDescription>Click on an available time slot to schedule your session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trainerSlots.map((slot) => (
              <div 
                key={slot.id} 
                onClick={() => handleBookSession(slot.id)}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer hover-scale ${
                  slot.available 
                    ? 'border-primary/30 hover:border-primary hover:bg-primary/5 hover:shadow-fitness' 
                    : 'border-muted bg-muted/50 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="font-semibold text-primary">{slot.day}</div>
                  <div className="text-sm text-muted-foreground">{slot.duration} minute session</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Clock className="h-4 w-4" />
                    {slot.time}
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 hover-scale"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookSession(slot.id);
                    }}
                  >
                    Book
                  </Button>
                </div>
              </div>
            ))}
            <div className="text-center text-sm text-muted-foreground pt-2">
              Sessions will be confirmed by your trainer
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-all">
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weight Goal Progress</span>
                <span className="text-primary font-semibold">60%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-primary h-2 rounded-full w-[60%] transition-all animate-fade-in" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly Workout Goal</span>
                <span className="text-success font-semibold">80%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full w-[80%] transition-all animate-fade-in" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">Recent Achievements</div>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2 hover-scale">5 Workouts This Week</Badge>
                <Badge variant="secondary" className="mr-2 hover-scale">2 lbs Lost</Badge>
                <Badge variant="secondary" className="hover-scale">Personal Best: 20 Push-ups</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover-scale transition-all">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-primary hover:bg-primary/90 hover-scale">
              <Dumbbell className="mr-2 h-4 w-4" />
              Start Workout
            </Button>
            <Button variant="outline" className="hover-scale">
              <TrendingUp className="mr-2 h-4 w-4" />
              Log Progress
            </Button>
            <Button variant="outline" className="hover-scale">
              <Calendar className="mr-2 h-4 w-4" />
              View Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;