
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  Mail, 
  Settings, 
  FileText, 
  History, 
  Package, 
  User, 
  LogOut,
  Moon,
  Sun,
  RefreshCw,
  Plus
} from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function MainLayout({ children, activeTab, onTabChange }: MainLayoutProps) {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleRefreshEmails = () => {
    toast({
      title: "Checking for new emails",
      description: "Syncing with your email provider...",
    });
  };

  const handleNewQuote = () => {
    toast({
      title: "Creating new quote",
      description: "Redirecting to quote creation...",
    });
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    toast({
      title: `${isDarkMode ? 'Light' : 'Dark'} mode enabled`,
      description: "Theme preferences saved",
    });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Top Navigation Bar */}
      <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  QuoteScribe
                </h1>
                <p className="text-xs text-slate-500 -mt-1">Quoting just got smarter.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons & User Menu */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshEmails}
              className="hover:bg-blue-50 border-slate-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Emails
            </Button>
            
            <Button 
              size="sm"
              onClick={handleNewQuote}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9 ring-2 ring-slate-200">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                <div className="flex flex-col space-y-2 p-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
                        {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                      <Badge variant="secondary" className="w-fit text-xs mt-1">
                        {user?.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleDarkMode}>
                  {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          {/* Premium Tab Navigation */}
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/60 backdrop-blur-sm border border-slate-200/60 h-14 p-1 rounded-xl shadow-sm">
            <TabsTrigger 
              value="email-inbox" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 text-sm font-medium rounded-lg"
            >
              <Mail className="h-4 w-4" />
              Quote Inbox
            </TabsTrigger>
            <TabsTrigger 
              value="processing-queue"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 text-sm font-medium rounded-lg"
            >
              <Settings className="h-4 w-4" />
              Processing Queue
            </TabsTrigger>
            <TabsTrigger 
              value="quote-templates"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 text-sm font-medium rounded-lg"
            >
              <FileText className="h-4 w-4" />
              Templates Manager
            </TabsTrigger>
            <TabsTrigger 
              value="quote-history"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 text-sm font-medium rounded-lg"
            >
              <History className="h-4 w-4" />
              Quotation Logs
            </TabsTrigger>
            <TabsTrigger 
              value="product-catalog"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 text-sm font-medium rounded-lg"
            >
              <Package className="h-4 w-4" />
              Product Catalog
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          {children}
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200/60 bg-white/40 backdrop-blur-xl mt-16">
        <div className="container mx-auto px-6 py-4">
          <p className="text-center text-sm text-slate-500">
            Powered by <span className="font-semibold text-blue-600">Lovable</span> & <span className="font-semibold text-slate-700">Blackbox</span>
          </p>
        </div>
      </div>
    </div>
  );
}
