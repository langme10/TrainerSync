import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, TrendingUp, Dumbbell, UserCheck, Clock } from "lucide-react";
import heroImage from "@/assets/fitness-hero.jpg";

const Index = () => {
  const [userType, setUserType] = useState<'trainer' | 'client' | null>(null);

  const handleRoleSelect = (role: 'trainer' | 'client') => {
    setUserType(role);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors">
            Professional Fitness Management
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              FitConnect
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            The complete platform connecting personal trainers and clients. Schedule sessions, 
            track progress, and achieve fitness goals together.
          </p>

          {!userType ? (
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => handleRoleSelect('trainer')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold shadow-fitness transition-all hover:scale-105"
              >
                <Users className="mr-2 h-5 w-5" />
                I'm a Trainer
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                onClick={() => handleRoleSelect('client')}
                className="border-2 border-white text-white hover:bg-white hover:text-foreground px-8 py-4 text-lg font-semibold transition-all hover:scale-105"
              >
                <UserCheck className="mr-2 h-5 w-5" />
                I'm a Client
              </Button>
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <Button 
                variant="ghost" 
                onClick={() => setUserType(null)}
                className="text-white/80 hover:text-white mb-6"
              >
                ← Back to role selection
              </Button>
              
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto shadow-card-hover">
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
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-primary text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Clients
            </CardTitle>
            <div className="text-3xl font-bold">24</div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Sessions
            </CardTitle>
            <div className="text-3xl font-bold text-primary">6</div>
          </CardHeader>
        </Card>
        
        <Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { client: "Sarah Johnson", time: "9:00 AM", type: "Strength Training" },
              { client: "Mike Chen", time: "11:00 AM", type: "HIIT Workout" },
              { client: "Emily Davis", time: "2:00 PM", type: "Personal Training" },
            ].map((session, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="font-semibold">{session.client}</div>
                  <div className="text-sm text-muted-foreground">{session.type}</div>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="h-4 w-4" />
                  {session.time}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Client Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { client: "Alex Rivera", improvement: "+15% Strength", status: "excellent" },
              { client: "Lisa Park", improvement: "+8 lbs Lost", status: "good" },
              { client: "John Smith", improvement: "+12% Endurance", status: "excellent" },
            ].map((progress, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
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

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-primary hover:bg-primary/90">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Session
            </Button>
            <Button variant="outline">
              <Dumbbell className="mr-2 h-4 w-4" />
              Create Routine
            </Button>
            <Button variant="outline">
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
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-primary text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Session
            </CardTitle>
            <div className="text-xl font-bold">Tomorrow 10:00 AM</div>
            <div className="text-sm opacity-90">with Coach Sarah</div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Workouts This Week
            </CardTitle>
            <div className="text-3xl font-bold text-success">4/5</div>
          </CardHeader>
        </Card>
        
        <Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Today's Workout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { exercise: "Squats", sets: "3 x 15", completed: true },
              { exercise: "Push-ups", sets: "3 x 12", completed: true },
              { exercise: "Planks", sets: "3 x 45s", completed: false },
              { exercise: "Lunges", sets: "3 x 10 each", completed: false },
            ].map((exercise, index) => (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                exercise.completed ? 'bg-success/10 border border-success/20' : 'bg-muted'
              }`}>
                <div>
                  <div className={`font-semibold ${exercise.completed ? 'text-success' : ''}`}>
                    {exercise.exercise}
                  </div>
                  <div className="text-sm text-muted-foreground">{exercise.sets}</div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  exercise.completed 
                    ? 'bg-success border-success' 
                    : 'border-muted-foreground'
                }`}>
                  {exercise.completed && (
                    <div className="w-full h-full rounded-full bg-success flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
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
                <div className="bg-gradient-primary h-2 rounded-full w-[60%]" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly Workout Goal</span>
                <span className="text-success font-semibold">80%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full w-[80%]" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">Recent Achievements</div>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2">5 Workouts This Week</Badge>
                <Badge variant="secondary" className="mr-2">2 lbs Lost</Badge>
                <Badge variant="secondary">Personal Best: 20 Push-ups</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-primary hover:bg-primary/90">
              <Dumbbell className="mr-2 h-4 w-4" />
              Start Workout
            </Button>
            <Button variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Log Progress
            </Button>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Book Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;