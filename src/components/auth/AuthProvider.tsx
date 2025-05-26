
import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "Admin" | "User";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isSetupComplete: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  completeSetup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    // Check for existing auth state
    const savedUser = localStorage.getItem("quoteScribeUser");
    const savedSetup = localStorage.getItem("quoteScribeSetup");
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedSetup) {
      setIsSetupComplete(JSON.parse(savedSetup));
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: "1",
      email: credentials.email,
      name: "John Doe",
      role: "Admin",
      avatar: "/placeholder.svg"
    };
    
    setUser(mockUser);
    localStorage.setItem("quoteScribeUser", JSON.stringify(mockUser));
  };

  const loginWithGoogle = async () => {
    // Simulate Google OAuth
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockUser: User = {
      id: "1",
      email: "john@company.com",
      name: "John Doe",
      role: "Admin",
      avatar: "/placeholder.svg"
    };
    
    setUser(mockUser);
    localStorage.setItem("quoteScribeUser", JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    setIsSetupComplete(false);
    localStorage.removeItem("quoteScribeUser");
    localStorage.removeItem("quoteScribeSetup");
  };

  const completeSetup = () => {
    setIsSetupComplete(true);
    localStorage.setItem("quoteScribeSetup", "true");
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isSetupComplete,
      login,
      loginWithGoogle,
      logout,
      completeSetup,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
