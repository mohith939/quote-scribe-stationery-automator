
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Code, 
  Download, 
  Link as LinkIcon, 
  RefreshCw,
  FileText,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface GoogleAppsScriptConfig {
  id?: string;
  user_id: string;
  script_url?: string;
  is_connected?: boolean;
  last_sync_time?: string;
  created_at?: string;
  updated_at?: string;
}

export function GoogleAppsScriptIntegration() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [scriptUrl, setScriptUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  // Load Google Apps Script configuration on component mount
  useEffect(() => {
    if (user) {
      loadGoogleAppsScriptConfig();
    }
  }, [user]);

  const getGoogleAppsScriptCode = () => {
    const userEmail = user?.email || 'your-business-email@gmail.com';
    
    return `/**
 * Enhanced Gmail Integration Script for QuoteScribe - UPDATED VERSION
 * Deploy this as a web app and use the URL in QuoteScribe settings
 * 
 * IMPORTANT: This version fetches ALL unread emails, not just recent ones
 * 
 * Instructions:
 * 1. Go to script.google.com
 * 2. Create a new project and paste this code
 * 3. Update the CONFIG section below with your Google Sheets ID
 * 4. Deploy as a web app with "Execute as: Me" and "Access: Anyone"
 * 5. Copy the web app URL and paste it in QuoteScribe settings
 */

// Your configuration - UPDATE THE SHEET ID
const CONFIG = {
  targetEmail: '${userEmail}',
  sheetId: 'YOUR_GOOGLE_SHEET_ID_HERE', // Replace with your Google Sheets ID
  companyName: 'Your Company Name',
  contactInfo: '${userEmail}',
  maxEmailsToFetch: 500 // Increased limit to fetch more emails
};

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'default';
    
    switch (action) {
      case 'getUnreadEmails':
      case 'getAllUnreadEmails':
        return getAllUnreadEmails(params.maxResults);
      case 'testConnection':
        return testConnection();
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'QuoteScribe Gmail Integration Active - ' + new Date().toISOString(),
          timestamp: new Date().toISOString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'doGet error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No POST data received');
    }
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'markAsRead':
        return markEmailAsRead(data.emailId);
      case 'sendEmail':
        return sendQuoteEmail(data.to, data.subject, data.body);
      case 'logQuote':
        return logQuoteToSheet(data.quoteData);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false, 
          error: 'Unknown action: ' + action
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error processing request: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllUnreadEmails(maxResults) {
  try {
    const limit = parseInt(maxResults) || CONFIG.maxEmailsToFetch;
    Logger.log('Fetching ALL unread emails with limit: ' + limit);
    
    // Search for ALL unread emails in the inbox (removed target email restriction)
    const threads = GmailApp.search('is:unread in:inbox', 0, limit);
    const emails = [];
    
    Logger.log('Found ' + threads.length + ' unread threads');
    
    threads.forEach(function(thread, threadIndex) {
      try {
        const messages = thread.getMessages();
        
        // Process all unread messages in each thread
        messages.forEach(function(message, messageIndex) {
          if (message.isUnread()) {
            try {
              // Get attachments info
              const attachments = message.getAttachments();
              const attachmentInfo = attachments.map(function(attachment) {
                return {
                  name: attachment.getName(),
                  type: attachment.getContentType(),
                  size: attachment.getSize()
                };
              });
              
              // Get both plain and HTML body
              const plainBody = message.getPlainBody();
              const htmlBody = message.getBody();
              
              emails.push({
                id: message.getId(),
                from: message.getFrom(),
                to: message.getTo(),
                subject: message.getSubject(),
                body: plainBody,
                htmlBody: htmlBody,
                date: message.getDate().toISOString(),
                threadId: message.getThread().getId(),
                attachments: attachmentInfo,
                hasAttachments: attachments.length > 0,
                snippet: plainBody.substring(0, 200) + '...'
              });
            } catch (msgError) {
              Logger.log('Error processing message ' + messageIndex + ' in thread ' + threadIndex + ': ' + msgError.toString());
            }
          }
        });
      } catch (threadError) {
        Logger.log('Error processing thread ' + threadIndex + ': ' + threadError.toString());
      }
    });
    
    Logger.log('Successfully processed ' + emails.length + ' unread emails');
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      emails: emails,
      timestamp: new Date().toISOString(),
      totalCount: emails.length,
      threadsProcessed: threads.length,
      hasMoreEmails: threads.length >= limit
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error fetching emails: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Failed to fetch emails: ' + error.toString(),
      emails: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function markEmailAsRead(emailId) {
  try {
    const message = GmailApp.getMessageById(emailId);
    message.markRead();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email marked as read'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error marking email as read: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Failed to mark email as read: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendQuoteEmail(to, subject, body) {
  try {
    const signature = '\\n\\n---\\nBest regards,\\n' + CONFIG.companyName + '\\nContact: ' + CONFIG.contactInfo;
    const fullBody = body + signature;
    
    GmailApp.sendEmail(to, subject, fullBody);
    
    Logger.log('Email sent successfully to: ' + to);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email sent successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Failed to send email: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function logQuoteToSheet(quoteData) {
  try {
    if (!CONFIG.sheetId || CONFIG.sheetId === 'YOUR_GOOGLE_SHEET_ID_HERE') {
      throw new Error('Sheet ID not configured');
    }
    
    const sheet = SpreadsheetApp.openById(CONFIG.sheetId).getActiveSheet();
    
    // Check if headers exist, if not create them
    const headers = sheet.getRange(1, 1, 1, 8).getValues()[0];
    if (!headers[0]) {
      sheet.getRange(1, 1, 1, 8).setValues([[
        'Timestamp', 'Customer Name', 'Email Address', 'Product', 
        'Quantity', 'Price Per Unit', 'Total Amount', 'Status'
      ]]);
    }
    
    // Add the quote data
    sheet.appendRow([
      quoteData.timestamp || new Date().toISOString(),
      quoteData.customerName || 'Unknown',
      quoteData.emailAddress || 'Unknown',
      quoteData.product || 'Unknown',
      quoteData.quantity || 0,
      quoteData.pricePerUnit || 0,
      quoteData.totalAmount || 0,
      quoteData.status || 'Unknown'
    ]);
    
    Logger.log('Quote logged to sheet successfully');
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Quote logged successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error logging to sheet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Failed to log quote: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function testConnection() {
  try {
    // Test Gmail access and count unread emails
    const unreadThreads = GmailApp.search('is:unread in:inbox', 0, 10);
    let unreadCount = 0;
    
    unreadThreads.forEach(function(thread) {
      const messages = thread.getMessages();
      messages.forEach(function(message) {
        if (message.isUnread()) {
          unreadCount++;
        }
      });
    });
    
    // Test Sheets access if configured
    let sheetAccess = false;
    if (CONFIG.sheetId && CONFIG.sheetId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
      try {
        SpreadsheetApp.openById(CONFIG.sheetId);
        sheetAccess = true;
      } catch (e) {
        Logger.log('Sheet access test failed: ' + e.toString());
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Google Apps Script connection successful',
      timestamp: new Date().toISOString(),
      services: {
        gmail: true,
        sheets: sheetAccess
      },
      emailCount: unreadCount,
      config: {
        targetEmail: CONFIG.targetEmail,
        hasSheetId: CONFIG.sheetId && CONFIG.sheetId !== 'YOUR_GOOGLE_SHEET_ID_HERE',
        companyName: CONFIG.companyName,
        maxEmailsToFetch: CONFIG.maxEmailsToFetch
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Connection test failed: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Connection test failed: ' + error.toString(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  };

  const loadGoogleAppsScriptConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('google_apps_script_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading config:', error);
        return;
      }

      if (data) {
        const config = data as GoogleAppsScriptConfig;
        setScriptUrl(config.script_url || '');
        setIsConnected(config.is_connected || false);
        setLastSyncTime(config.last_sync_time || null);
      }
    } catch (error) {
      console.error('Error loading Google Apps Script config:', error);
    }
  };

  const testConnection = async () => {
    if (!scriptUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter the Google Apps Script URL first.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to test the connection.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const testUrl = `${scriptUrl}?action=testConnection&_=${Date.now()}`;
      console.log('Testing connection to:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'omit'
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        data = { success: true, message: responseText };
      }

      if (data.success || responseText.includes('QuoteScribe Gmail Integration Active')) {
        await updateGoogleAppsScriptConfig(scriptUrl, true);
        setIsConnected(true);
        setLastSyncTime(new Date().toISOString());
        
        toast({
          title: "Connection Successful",
          description: data.message || "Connected to Google Apps Script successfully!",
        });
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      await updateGoogleAppsScriptConfig(scriptUrl, false);
      setIsConnected(false);
      
      let errorMessage = "Could not connect to Google Apps Script.";
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = "Network error: Please check if the URL is correct and the web app is deployed properly. Make sure the deployment has 'Execute as: Me' and 'Access: Anyone' permissions.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateGoogleAppsScriptConfig = async (url: string, connected: boolean) => {
    if (!user) return;

    try {
      const configData = {
        user_id: user.id,
        script_url: url,
        is_connected: connected,
        last_sync_time: connected ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('google_apps_script_config')
        .upsert(configData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating config:', error);
      }
    } catch (error) {
      console.error('Error updating Google Apps Script config:', error);
    }
  };

  const downloadCodeAsText = () => {
    const googleAppsScriptCode = getGoogleAppsScriptCode();
    
    const blob = new Blob([googleAppsScriptCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'google-apps-script-quotescribe-fixed.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Fixed Code Downloaded",
      description: "Updated Google Apps Script code has been downloaded.",
    });
  };

  const copyToClipboard = () => {
    const googleAppsScriptCode = getGoogleAppsScriptCode();
    navigator.clipboard.writeText(googleAppsScriptCode);
    toast({
      title: "Fixed Code Copied",
      description: "Updated Google Apps Script code has been copied to clipboard.",
    });
  };

  const disconnect = async () => {
    if (!user) return;
    
    try {
      await updateGoogleAppsScriptConfig(scriptUrl, false);
      setIsConnected(false);
      setLastSyncTime(null);
      
      toast({
        title: "Disconnected",
        description: "Google Apps Script integration has been disconnected.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-green-600" />
          <CardTitle>Google Apps Script Integration</CardTitle>
          <div className="ml-auto flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Not Connected</span>
              </div>
            )}
          </div>
        </div>
        <CardDescription>
          Connect your Google Apps Script to enable email processing and Gmail integration. Updated version fetches ALL unread emails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="script-url">Google Apps Script Web App URL</Label>
          <Input 
            id="script-url" 
            type="url" 
            placeholder="https://script.google.com/macros/s/your-script-id/exec"
            value={scriptUrl}
            onChange={(e) => setScriptUrl(e.target.value)}
            className="mt-1"
          />
          {lastSyncTime && (
            <p className="text-xs text-slate-500 mt-1">
              Last connected: {new Date(lastSyncTime).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={testConnection} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 mr-2" />
                {isConnected ? 'Test Connection' : 'Connect'}
              </>
            )}
          </Button>
          
          {isConnected && (
            <Button variant="outline" onClick={disconnect}>
              Disconnect
            </Button>
          )}
          
          <Dialog open={showCode} onOpenChange={setShowCode}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Code className="h-4 w-4 mr-2" />
                View Updated Script Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Updated Google Apps Script Code - Enhanced Email Fetching</DialogTitle>
                <DialogDescription>
                  This updated version fetches ALL unread emails from your inbox, not just recent ones. It removes email filtering and increases the fetch limit to 500 emails.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    Copy Updated Code
                  </Button>
                  <Button onClick={downloadCodeAsText} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Updated Code
                  </Button>
                </div>
                <Textarea
                  value={getGoogleAppsScriptCode()}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enhanced Features:
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Fetches ALL unread emails in your inbox (up to 500)</li>
                    <li>Removed email address filtering - gets emails sent to any address</li>
                    <li>Improved error handling and logging</li>
                    <li>Better thread and message processing</li>
                    <li>Enhanced connection testing with email count</li>
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    IMPORTANT - Update Required:
                  </h4>
                  <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                    <li>Your current script only fetches 2 emails - you need to update it</li>
                    <li>Replace your old Google Apps Script code with this new version</li>
                    <li>Deploy as a NEW web app to get a fresh deployment</li>
                    <li>Update the URL in QuoteScribe settings</li>
                    <li>This version will fetch hundreds of unread emails instead of just 2</li>
                  </ol>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={downloadCodeAsText}>
            <FileText className="h-4 w-4 mr-2" />
            Download Updated Code
          </Button>
        </div>

        {!isConnected && scriptUrl && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Limited Email Fetching Detected</span>
            </div>
            <div className="text-xs text-red-700 mt-1">
              <p>Your script is only fetching 2 emails out of hundreds. Please:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Download the UPDATED code above</li>
                <li>Replace your old Google Apps Script completely</li>
                <li>Deploy as a NEW web app</li>
                <li>Use the new URL for connection</li>
              </ul>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Integration Active</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Google Apps Script is connected. If you're still only getting 2 emails, please update to the new script code above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GoogleAppsScriptIntegration;
