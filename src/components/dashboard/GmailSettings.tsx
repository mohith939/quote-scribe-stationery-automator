
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Mail, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";

export function GmailSettings() {
  const { toast } = useToast();
  
  const integrationOptions = [
    {
      name: "Gmail API with OAuth",
      description: "Direct, secure integration with Gmail using Google's official API",
      pros: ["Most reliable", "Real-time access", "Full feature support"],
      cons: ["Requires OAuth setup", "More complex implementation"],
      link: "https://developers.google.com/gmail/api",
      recommended: true
    },
    {
      name: "IMAP Integration", 
      description: "Universal email protocol - works with Gmail, Outlook, and others",
      pros: ["Works with any email provider", "Standardized protocol", "Real-time"],
      cons: ["Requires email credentials", "May need app passwords"],
      link: "https://developers.google.com/gmail/imap_extensions",
      recommended: false
    },
    {
      name: "Email Webhooks",
      description: "Receive emails via webhooks using services like SendGrid or Mailgun",
      pros: ["Real-time notifications", "No polling needed", "Scalable"],
      cons: ["Requires webhook endpoint", "Third-party dependency"],
      link: "https://sendgrid.com/docs/for-developers/parsing-email/inbound-email/",
      recommended: false
    },
    {
      name: "Zapier/Make.com",
      description: "No-code automation to forward emails to your application",
      pros: ["No coding required", "Quick setup", "Reliable"],
      cons: ["Monthly cost", "Limited customization"],
      link: "https://zapier.com/apps/gmail/integrations",
      recommended: false
    }
  ];

  const handleLearnMore = (url: string) => {
    window.open(url, '_blank');
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Email Integration Options
        </CardTitle>
        <CardDescription>
          Choose the best email integration method for your needs
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="rounded-md bg-amber-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Google Apps Script Removed</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>We've removed the problematic Google Apps Script integration. Below are better, more reliable alternatives for email integration.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {integrationOptions.map((option, index) => (
            <Card key={index} className={`relative ${option.recommended ? 'ring-2 ring-green-200 bg-green-50/30' : ''}`}>
              {option.recommended && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Recommended
                  </div>
                </div>
              )}
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{option.name}</h4>
                </div>
                
                <p className="text-sm text-slate-600 mb-3">{option.description}</p>
                
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <h5 className="text-xs font-medium text-green-700 mb-1">Pros:</h5>
                    <ul className="text-xs text-green-600 space-y-0.5">
                      {option.pros.map((pro, i) => (
                        <li key={i}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-amber-700 mb-1">Cons:</h5>
                    <ul className="text-xs text-amber-600 space-y-0.5">
                      {option.cons.map((con, i) => (
                        <li key={i}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleLearnMore(option.link)}
                  className="w-full"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Learn More & Setup Guide
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Choose an integration method above based on your needs</li>
            <li>Follow the setup guide for your chosen method</li>
            <li>Update the EmailService class in the code to implement your chosen integration</li>
            <li>Test with a few sample emails before processing large volumes</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

export default GmailSettings;
