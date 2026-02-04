import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { Loader2 } from "lucide-react";

import AuthPage from "@/pages/auth-page";
import UserDashboard from "@/pages/user-dashboard";
import OrganizerDashboard from "@/pages/organizer-dashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ 
  component: Component, 
  requiredRole 
}: { 
  component: React.ComponentType, 
  requiredRole?: "user" | "organizer" 
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Redirect to={user.role === "organizer" ? "/organizer-dashboard" : "/"} />;
  }

  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        
        <Route path="/">
          <ProtectedRoute component={UserDashboard} requiredRole="user" />
        </Route>
        
        <Route path="/organizer-dashboard">
          <ProtectedRoute component={OrganizerDashboard} requiredRole="organizer" />
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
