import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, RefreshCw, Inbox, User, Clock, Filter, Edit, Send, CheckCircle, Settings, AlertTriangle, Trash2, AlertCircle, ExternalLink, Copy } from "lucide-react";
import { EmailMessage } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { fetchUnreadEmails, testGoogleAppsScriptConnection, markEmailAsRead, getQuotaStatus, clearEmailCache } from "@/services/gmailService";

export function EmailInboxReal() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'quote' | 'non-quote'>('all');
  const [editingEmail, setEditingEmail] = useState<EmailMessage | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scriptUrl, setScriptUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [quotaStatus, setQuotaStatus] = useState(getQuotaStatus());
  const [maxEmails, setMaxEmails] = useState(10);
  const [lastError, setLastError] = useState<string>('');

  useEffect(() => {
    // Load script URL from localStorage if available
    const savedUrl = localStorage.getItem('google_apps_script_url');
    if (savedUrl) {
      setScriptUrl(savedUrl);
    }

    // Update quota status
    setQuotaStatus(getQuotaStatus());
  }, []);

  const handleTestConnection = async () => {
    if (!scriptUrl.trim()) {
      toast({
        title: "Script URL Required",
        description: "Please enter your Google Apps Script URL first",
        variant: "destructive"
      });
      return;
    }

    setLastError('');
    try {
      console.log('Testing connection to:', scriptUrl);
      const result = await testGoogleAppsScriptConnection();
      setConnectionStatus(result.message);
      
      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setLastError(errorMessage);
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleSaveSettings = () => {
    if (scriptUrl.trim()) {
      localStorage.setItem('google_apps_script_url', scriptUrl.trim());
      toast({
        title: "Settings Saved",
        description: "Google Apps Script URL has been saved",
      });
    }
    setShowSettings(false);
  };

  const handleFetchEmails = async (forceRefresh: boolean = false) => {
    if (!scriptUrl.trim()) {
      setShowSettings(true);
      toast({
        title: "Setup Required",
        description: "Please configure your Google Apps Script URL first",
        variant: "destructive"
      });
      return;
    }

    // Check quota before attempting
    const currentQuotaStatus = getQuotaStatus();
    if (!currentQuotaStatus.canMakeCall && !forceRefresh) {
      toast({
        title: "Quota Exceeded",
        description: `Daily quota exceeded (${currentQuotaStatus.callsUsed}/${currentQuotaStatus.maxCalls}). Try again tomorrow.`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLastError('');
    
    try {
      console.log('Fetching emails from Google Apps Script...');
      console.log('Script URL:', scriptUrl);
      console.log('Max emails:', maxEmails);
      console.log('Force refresh:', forceRefresh);
      
      const fetchedEmails = await fetchUnreadEmails(maxEmails, forceRefresh);
      
      // Enhanced email processing with quote detection
      const processedEmails = fetchedEmails.map(email => ({
        ...email,
        isQuoteRequest: detectQuoteRequest(email.body + ' ' + email.subject),
        confidence: 'medium' as const,
        processingStatus: 'pending' as const,
        category: 'general' as const
      }));
      
      setEmails(processedEmails);
      setFilteredEmails(processedEmails);
      
      // Update quota status
      setQuotaStatus(getQuotaStatus());
      
      const cacheMessage = forceRefresh ? "" : " (using smart caching)";
      toast({
        title: "Emails Fetched",
        description: `Successfully fetched ${processedEmails.length} unread emails${cacheMessage}`,
      });

      console.log(`Fetched ${processedEmails.length} emails:`, processedEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch emails";
      setLastError(errorMessage);
      
      // Update quota status even on error
      setQuotaStatus(getQuotaStatus());
      
      // Enhanced error messaging based on error type
      const errorType = getErrorType(errorMessage);
      let toastDescription = errorMessage;
      let toastTitle = "Fetch Failed";
      
      switch (errorType) {
        case 'cors':
          toastTitle = "CORS Configuration Error";
          toastDescription = "Apps Script deployment needs CORS fix. Check error details below.";
          break;
        case 'deployment':
          toastTitle = "Apps Script Deployment Issue";
          toastDescription = "Script deployment or permissions problem. See troubleshooting below.";
          break;
        case 'quota':
          toastTitle = "Quota Exceeded";
          toastDescription = "Daily Gmail quota exceeded. Try again tomorrow.";
          break;
        case 'network':
          toastTitle = "Network/Connection Error";
          toastDescription = "Cannot reach Apps Script. Check URL and deployment.";
          break;
        default:
          toastTitle = "Fetch Failed";
          toastDescription = errorMessage.length > 100 ? "Check error details below" : errorMessage;
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = () => {
    clearEmailCache();
    toast({
      title: "Cache Cleared",
      description: "Email cache has been cleared. Next fetch will get fresh data.",
    });
  };

  const detectQuoteRequest = (text: string): boolean => {
    const keywords = [
      'quote', 'quotation', 'pricing', 'price', 'cost', 'estimate',
      'how much', 'inquiry', 'enquiry', 'interested in', 'purchase',
      'buy', 'order', 'supply', 'provide', 'need', 'require'
    ];
    
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  };

  const filterEmails = (type: 'all' | 'quote' | 'non-quote') => {
    setFilterType(type);
    if (type === 'all') {
      setFilteredEmails(emails);
    } else if (type === 'quote') {
      setFilteredEmails(emails.filter(email => email.isQuoteRequest));
    } else {
      setFilteredEmails(emails.filter(email => !email.isQuoteRequest));
    }
  };

  const handleEditClassification = (email: EmailMessage) => {
    setEditingEmail(email);
    setShowEditDialog(true);
  };

  const handleSaveClassification = (newClassification: boolean) => {
    if (!editingEmail) return;

    const updatedEmails = emails.map(email => 
      email.id === editingEmail.id 
        ? { ...email, isQuoteRequest: newClassification }
        : email
    );
    
    setEmails(updatedEmails);
    filterEmails(filterType);
    setShowEditDialog(false);
    setEditingEmail(null);
    
    toast({
      title: "Email Classification Updated",
      description: `Email marked as ${newClassification ? 'quote request' : 'non-quote'}`,
    });
  };

  const handleProcessQuote = (email: EmailMessage) => {
    toast({
      title: "Email Added to Processing Queue",
      description: `Email from ${extractSenderName(email.from)} moved to processing queue`,
    });
    
    const remainingEmails = emails.filter(e => e.id !== email.id);
    setEmails(remainingEmails);
    filterEmails(filterType);
  };

  const handleMarkAsRead = async (email: EmailMessage) => {
    try {
      const success = await markEmailAsRead(email.id);
      if (success) {
        toast({
          title: "Email Marked as Read",
          description: `Email from ${extractSenderName(email.from)} marked as read`,
        });
        
        // Remove from local list
        const remainingEmails = emails.filter(e => e.id !== email.id);
        setEmails(remainingEmails);
        filterEmails(filterType);
      } else {
        toast({
          title: "Failed to Mark as Read",
          description: "Could not mark email as read. Check your Apps Script connection.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark email as read",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const extractSenderName = (fromField: string) => {
    const match = fromField.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim().replace(/['"]/g, '') : fromField;
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>;
      case 'low':
        return <Badge className="bg-orange-100 text-orange-800">Low Confidence</Badge>;
      default:
        return null;
    }
  };

  const getErrorType = (error: string) => {
    if (error.includes('CORS') || error.includes('cross-origin') || error.includes('Access-Control-Allow-Origin')) {
      return 'cors';
    }
    if (error.includes('HTML error page') || error.includes('deployment')) {
      return 'deployment';
    }
    if (error.includes('quota exceeded')) {
      return 'quota';
    }
    if (error.includes('Failed to fetch') || error.includes('NetworkError')) {
      return 'network';
    }
    return 'general';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard",
    });
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Gmail Inbox via Apps Script</CardTitle>
                <CardDescription>Fetch and process your unread emails using Google Apps Script</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                onClick={() => handleFetchEmails(false)}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Fetching...' : 'Smart Fetch'}
              </Button>
              <Button 
                onClick={() => handleFetchEmails(true)}
                disabled={isLoading}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Fetching...' : 'Force Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Enhanced Error Display with CORS-specific guidance */}
          {lastError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-800 mb-2">Error Details:</div>
                  <div className="text-sm text-red-700 mb-3 font-mono bg-red-100 p-2 rounded">
                    {lastError}
                  </div>
                  
                  {getErrorType(lastError) === 'cors' && (
                    <div className="text-sm text-red-800">
                      <div className="font-medium mb-2">🔧 CORS Fix Required:</div>
                      <ol className="list-decimal list-inside space-y-1 mb-3">
                        <li>Open your Google Apps Script project</li>
                        <li>Click "Deploy" → "Manage deployments"</li>
                        <li>Click the edit icon (pencil) on your deployment</li>
                        <li>Under "Who has access", select <strong>"Anyone"</strong></li>
                        <li>Click "Deploy" and copy the new URL</li>
                        <li>Update the URL in Settings below</li>
                      </ol>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(lastError)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Error
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('https://script.google.com', '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open Apps Script
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {getErrorType(lastError) === 'network' && (
                    <div className="text-sm text-red-800">
                      <div className="font-medium mb-2">🌐 Network/URL Issues:</div>
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        <li>Verify your script URL is complete and correct</li>
                        <li>Test the URL directly in a browser</li>
                        <li>Make sure the script is deployed as a web app</li>
                        <li>Try creating a new deployment</li>
                      </ul>
                    </div>
                  )}
                  
                  {(getErrorType(lastError) === 'deployment' || lastError.includes('HTML error page')) && (
                    <div className="text-sm text-red-800">
                      <div className="font-medium mb-2">⚙️ Deployment Issues:</div>
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        <li>Redeploy your Apps Script as a web app</li>
                        <li>Set "Execute as: Me" and "Access: Anyone"</li>
                        <li>Make sure your script has doGet() function</li>
                        <li>Check Apps Script logs for errors</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quota Status Display */}
          <div className={`mb-4 p-3 border rounded-lg ${quotaStatus.canMakeCall ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {quotaStatus.canMakeCall ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${quotaStatus.canMakeCall ? 'text-green-800' : 'text-red-800'}`}>
                  Quota: {quotaStatus.callsUsed}/{quotaStatus.maxCalls} calls used today
                </span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {quotaStatus.callsRemaining} remaining
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCache}
                  className="h-6 px-2"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear Cache
                </Button>
              </div>
            </div>
            {!quotaStatus.canMakeCall && (
              <div className="text-xs text-red-600 mt-1">
                Daily quota exceeded. Resets at: {quotaStatus.resetTime}
              </div>
            )}
          </div>

          {/* Connection Status */}
          {scriptUrl && !lastError && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">Apps Script URL configured - Ready to fetch emails</span>
              </div>
              {connectionStatus && (
                <div className="text-xs text-green-600 mt-1">{connectionStatus}</div>
              )}
            </div>
          )}

          {!scriptUrl && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">Google Apps Script not configured - Click Settings to setup</span>
              </div>
            </div>
          )}

          {/* Filter Controls */}
          {emails.length > 0 && (
            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <Label className="text-sm font-medium">Filter by type:</Label>
              </div>
              <Select value={filterType} onValueChange={filterEmails}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Emails ({emails.length})</SelectItem>
                  <SelectItem value="quote">Quote Requests ({emails.filter(e => e.isQuoteRequest).length})</SelectItem>
                  <SelectItem value="non-quote">Non-Quote Emails ({emails.filter(e => !e.isQuoteRequest).length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {filteredEmails.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium mb-2">
                {emails.length === 0 ? 'No emails loaded' : `No ${filterType} emails found`}
              </h3>
              <p className="text-sm mb-4">
                {emails.length === 0 
                  ? 'Click "Fetch Emails" to load your unread Gmail messages' 
                  : 'Try changing the filter or fetch more emails'
                }
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Fetching emails from Gmail...</h3>
              <p className="text-sm">This may take a moment depending on your inbox size</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {filteredEmails.length} Email{filteredEmails.length !== 1 ? 's' : ''} Found
                </Badge>
                {filterType !== 'all' && (
                  <Badge variant="outline">
                    Filtered by: {filterType === 'quote' ? 'Quote Requests' : 'Non-Quote Emails'}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredEmails.map((email) => (
                  <div key={email.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-900 truncate">
                            {extractSenderName(email.from)}
                          </span>
                          {email.isQuoteRequest ? (
                            <Badge className="bg-green-100 text-green-800">Quote Request</Badge>
                          ) : (
                            <Badge variant="outline">Non-Quote</Badge>
                          )}
                          {email.confidence && getConfidenceBadge(email.confidence)}
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {email.subject}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-500 ml-4">
                        <Clock className="h-4 w-4" />
                        {formatDate(email.date)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded mb-2">
                      <p>{email.snippet || email.body?.substring(0, 150) + '...'}</p>
                    </div>

                    {email.hasAttachments && (
                      <Badge variant="outline" className="text-xs mb-2">
                        📎 Attachments
                      </Badge>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        ID: {email.id.substring(0, 8)}...
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClassification(email)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {email.isQuoteRequest ? (
                          <Button
                            size="sm"
                            onClick={() => handleProcessQuote(email)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Process Quote
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(email)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Google Apps Script Configuration</DialogTitle>
            <DialogDescription>
              Configure your Google Apps Script URL and fetch settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="scriptUrl">Apps Script URL</Label>
              <Input
                id="scriptUrl"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
              />
            </div>

            <div>
              <Label htmlFor="maxEmails">Max Emails to Fetch (1-50)</Label>
              <Input
                id="maxEmails"
                type="number"
                min="1"
                max="50"
                value={maxEmails}
                onChange={(e) => setMaxEmails(Math.min(50, Math.max(1, parseInt(e.target.value) || 10)))}
              />
              <div className="text-xs text-gray-500 mt-1">
                Lower numbers help conserve your daily quota
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Quota Management:</h4>
              <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                <li>Smart caching reduces API calls</li>
                <li>Daily limit: {quotaStatus.maxCalls} calls</li>
                <li>Cache duration: 5 minutes</li>
                <li>Use "Smart Fetch" to leverage cache</li>
                <li>Use "Force Refresh" only when needed</li>
              </ul>
            </div>
            
            {scriptUrl && (
              <Button onClick={handleTestConnection} variant="outline" className="w-full">
                Test Connection
              </Button>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Classification Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Email Classification</DialogTitle>
            <DialogDescription>
              Change how this email is classified in the system
            </DialogDescription>
          </DialogHeader>
          
          {editingEmail && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium">Email Subject:</div>
                <div className="text-sm text-gray-600">{editingEmail.subject}</div>
                <div className="text-sm font-medium mt-2">From:</div>
                <div className="text-sm text-gray-600">{extractSenderName(editingEmail.from)}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Classification</Label>
                <RadioGroup
                  defaultValue={editingEmail.isQuoteRequest ? "quote" : "non-quote"}
                  onValueChange={(value) => {
                    setEditingEmail({
                      ...editingEmail,
                      isQuoteRequest: value === "quote"
                    });
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quote" id="quote" />
                    <Label htmlFor="quote">Quote Request - Customer wants pricing information</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-quote" id="non-quote" />
                    <Label htmlFor="non-quote">Non-Quote - General inquiry or information</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSaveClassification(editingEmail?.isQuoteRequest || false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
