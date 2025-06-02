
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Info, Mail, RefreshCw, CheckCircle } from "lucide-react";

export function GmailSettings() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  
  const handleSync = () => {
    toast({
      title: "Gmail Integration",
      description: "Gmail integration is handled through Google Apps Script. Please configure your Google Apps Script connection first.",
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Gmail Integration
        </CardTitle>
        <CardDescription>
          Gmail integration is handled through Google Apps Script for better security and control
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Google Apps Script Integration</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Gmail functionality is integrated through Google Apps Script which provides:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Secure email access without storing credentials</li>
                  <li>Direct Google Workspace integration</li>
                  <li>Custom email processing logic</li>
                  <li>Automatic email parsing and response</li>
                </ul>
                <p className="mt-2 font-medium">Configure your Google Apps Script connection in the settings above to enable Gmail features.</p>
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleSync} 
          variant="outline"
          className="w-full"
          size="lg"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Configure via Google Apps Script
        </Button>
      </CardContent>
    </Card>
  );
}

export default GmailSettings;
