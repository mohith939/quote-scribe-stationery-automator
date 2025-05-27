
import { useState } from "react";
import { LoginPage } from "@/components/auth/LoginPage";

export default function Login() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    // For demo purposes, accept any credentials
    console.log("Login attempt:", credentials);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', credentials.email);
    setIsAuthenticated(true);
    window.location.href = '/';
  };

  const handleGoogleLogin = () => {
    // This would integrate with actual Google OAuth
    console.log("Google OAuth login initiated");
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', 'user@gmail.com');
    localStorage.setItem('authMethod', 'google');
    setIsAuthenticated(true);
    window.location.href = '/';
  };

  if (isAuthenticated || localStorage.getItem('isAuthenticated')) {
    window.location.href = '/';
    return null;
  }

  return <LoginPage onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} />;
}
