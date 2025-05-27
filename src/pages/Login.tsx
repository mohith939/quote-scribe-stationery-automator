
import { useState, useEffect } from "react";
import { LoginPage } from "@/components/auth/LoginPage";

export default function Login() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      window.location.href = '/';
    }
  }, []);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    console.log("Login attempt:", credentials);
    
    // Validate credentials (demo - accept any non-empty credentials)
    if (!credentials.email || !credentials.password) {
      throw new Error('Please enter both email and password');
    }
    
    // Store authentication data
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', credentials.email);
    localStorage.setItem('authMethod', 'email');
    
    setIsAuthenticated(true);
    
    // Redirect to main app
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    console.log("Google OAuth login initiated");
    
    // Simulate Google OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Store authentication data
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', 'user@gmail.com');
    localStorage.setItem('authMethod', 'google');
    
    setIsAuthenticated(true);
    
    // Redirect to main app
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return <LoginPage onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} />;
}
