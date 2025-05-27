
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { LoginPage } from "@/components/auth/LoginPage";
import { SetupWizard } from "@/components/auth/SetupWizard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useState, useMemo } from "react";

function AppContent() {
  const { isAuthenticated, isSetupComplete, login, loginWithGoogle, completeSetup } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} onGoogleLogin={loginWithGoogle} />;
  }

  if (!isSetupComplete) {
    return <SetupWizard onComplete={completeSetup} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => {
  // Create QueryClient inside the component to ensure proper initialization
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
