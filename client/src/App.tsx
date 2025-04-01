import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import EmployeesPage from "@/pages/employees-page";
import DefinitionsPage from "@/pages/definitions-page";
import AppreciationPage from "@/pages/appreciation-page";
import ReportsPage from "@/pages/reports-page";
import NotificationsPage from "@/pages/notifications-page";
import UsersPage from "@/pages/users-page";
import AllowanceOrderPage from "@/pages/allowance-order-page";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/employees" component={EmployeesPage} />
      <ProtectedRoute path="/definitions" component={DefinitionsPage} />
      <ProtectedRoute path="/appreciation" component={AppreciationPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/allowance-order/:id" component={AllowanceOrderPage} />
      <Route component={NotFound} />
    </Switch>
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