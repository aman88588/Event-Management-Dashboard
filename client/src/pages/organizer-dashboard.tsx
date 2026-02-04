import { useEvents } from "@/hooks/use-events";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { EventCard } from "@/components/EventCard";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, TrendingUp, Users, Calendar } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function OrganizerDashboard() {
  useWebSocket(); // Enable real-time updates
  const { user } = useAuth();
  const { data: events, isLoading } = useEvents();

  // Filter events created by this organizer
  const myEvents = events?.filter(e => e.organizerId === user?.id) || [];

  // Calculate stats
  const stats = useMemo(() => {
    const totalEvents = myEvents.length;
    const totalRegistrations = myEvents.reduce((acc, curr) => acc + curr.registrationCount, 0);
    const capacityUtilization = totalEvents > 0 
      ? Math.round((totalRegistrations / myEvents.reduce((acc, curr) => acc + curr.maxParticipants, 0)) * 100) 
      : 0;

    return { totalEvents, totalRegistrations, capacityUtilization };
  }, [myEvents]);

  // Chart data
  const chartData = useMemo(() => {
    return myEvents.map(event => ({
      name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
      registrations: event.registrationCount,
      capacity: event.maxParticipants
    })).slice(0, 5); // Show top 5 recent
  }, [myEvents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Organizer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your events and registrations in real-time.</p>
        </div>
        <CreateEventDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">Across all active events</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-accent shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Currently published</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.capacityUtilization}%</div>
            <p className="text-xs text-muted-foreground">Average fill rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Events List */}
        <div className="lg:col-span-2 space-y-6">
           <h2 className="text-xl font-semibold">Your Events</h2>
           {myEvents.length === 0 ? (
             <div className="text-center py-12 border-2 border-dashed rounded-xl bg-secondary/20">
               <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
               <h3 className="text-lg font-medium">No events yet</h3>
               <p className="text-muted-foreground mb-4">Create your first event to get started.</p>
               <CreateEventDialog />
             </div>
           ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {myEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
           )}
        </div>

        {/* Analytics Chart */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Registration Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {myEvents.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="registrations" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.registrations >= entry.capacity ? '#ef4444' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Not enough data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
