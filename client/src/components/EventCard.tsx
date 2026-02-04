import { type Event } from "@shared/schema";
import { format } from "date-fns";
import { MapPin, Calendar, Users, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteEvent, useRegisterEvent } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EventCardProps {
  event: Event & { registrationCount: number, isRegistered?: boolean };
}

export function EventCard({ event }: EventCardProps) {
  const { user } = useAuth();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();
  const { mutate: register, isPending: isRegistering } = useRegisterEvent();

  const isOrganizer = user?.role === "organizer";
  const isOwner = event.organizerId === user?.id;
  const isFull = event.registrationCount >= event.maxParticipants;
  
  // Visual state
  const registrationRatio = (event.registrationCount / event.maxParticipants) * 100;
  const progressColor = registrationRatio >= 100 ? "bg-red-500" : "bg-primary";

  return (
    <div className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full">
      {/* Top Banner (Status) */}
      <div className="h-2 w-full bg-secondary overflow-hidden">
        <div 
          className={`h-full ${progressColor} transition-all duration-500`} 
          style={{ width: `${Math.min(registrationRatio, 100)}%` }} 
        />
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {event.description}
            </p>
          </div>
          {isOrganizer && isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive -mr-2 -mt-2">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the event "{event.title}" and cancel all registrations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteEvent(event.id)} className="bg-destructive hover:bg-destructive/90">
                    Delete Event
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="space-y-3 mt-auto pt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2 text-primary" />
            {format(new Date(event.date), "PPP 'at' p")}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            {event.location}
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-2 text-primary" />
            <span>
              {event.registrationCount} / {event.maxParticipants} registered
            </span>
          </div>
        </div>

        <div className="mt-6">
          {!isOrganizer ? (
            event.isRegistered ? (
              <Button variant="outline" className="w-full bg-green-50/50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 pointer-events-none">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Registered
              </Button>
            ) : (
              <Button 
                className="w-full" 
                disabled={isFull || isRegistering}
                onClick={() => register(event.id)}
              >
                {isRegistering ? "Registering..." : isFull ? "Event Full" : "Register Now"}
              </Button>
            )
          ) : (
             <div className="h-10 flex items-center justify-center text-sm text-muted-foreground bg-secondary/50 rounded-md">
               Organizer View
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
