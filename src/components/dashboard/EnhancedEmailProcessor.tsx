
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle, AlertCircle, Package, TrendingUp, Zap } from "lucide-react";
import { EmailMessage } from "@/types";
import { enhancedClassifyEmail } from "@/services/enhancedEmailClassification";
import { SmartProductMatcher } from "@/services/smartProductMatcher";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface EnhancedEmailProcessorProps {
  emails: EmailMessage[];
  onEmailProcessed: (emailId: string) => void;
}

export function EnhancedEmailProcessor({ emails, onEmailProcessed }: EnhancedEmailProcessorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [processingEmail, setProcessingEmail] = useState<string | null>(null);
  const [processedResults, setProcessedResults] = useState<Map<string, any>>(new Map());

  // Fetch products for enhanced classification
  const { data: products = [] } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_products')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const processEmailWithEnhancedAI = async (email: EmailMessage) => {
    setProcessingEmail(email.id);
    
    try {
      // Enhanced classification
      const classification = enhancedClassifyEmail(email, products);
      
      // Smart product matching
      const productMatcher = new SmartProductMatcher(products);
      const productMatches = productMatcher.findMatches(`${email.subject} ${email.body}`, 5);
      
      const result = {
        classification,
        productMatches,
        processedAt: new Date().toISOString()
      };
      
      setProcessedResults(prev => new Map(prev.set(email.id, result)));
      
      toast({
        title: "Enhanced Processing Complete",
        description: `Classified with ${classification.confidence} confidence (${classification.score}% score)`,
        variant: classification.confidence === 'high' ? 'default' : 'secondary'
      });
      
      onEmailProcessed(email.id);
      
    } catch (error) {
      console.error('Enhanced processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process email with enhanced AI",
        variant: "destructive"
      });
    } finally {
      setProcessingEmail(null);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <AlertCircle className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  if (emails.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium mb-2">No emails to process</h3>
          <p className="text-sm text-slate-600">Fetch some emails first to use enhanced processing</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle>Enhanced Email Processing</CardTitle>
            <CardDescription>
              AI-powered email classification and product matching ({emails.length} emails)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {emails.slice(0, 10).map((email) => {
            const result = processedResults.get(email.id);
            const isProcessing = processingEmail === email.id;
            
            return (
              <div key={email.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{email.subject}</h4>
                    <p className="text-xs text-slate-600 mt-1">From: {email.from}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {email.body?.substring(0, 100)}...
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => processEmailWithEnhancedAI(email)}
                    disabled={isProcessing || !!result}
                    className="ml-4"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Processing...
                      </>
                    ) : result ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Processed
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3 mr-1" />
                        Enhance
                      </>
                    )}
                  </Button>
                </div>
                
                {result && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getConfidenceColor(result.classification.confidence)}>
                        {getConfidenceIcon(result.classification.confidence)}
                        <span className="ml-1">{result.classification.confidence.toUpperCase()}</span>
                      </Badge>
                      
                      <Badge variant="outline">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Score: {result.classification.score}
                      </Badge>
                      
                      {result.classification.isQuoteRequest && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Quote Request
                        </Badge>
                      )}
                      
                      {result.productMatches.length > 0 && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Package className="h-3 w-3 mr-1" />
                          {result.productMatches.length} Product(s)
                        </Badge>
                      )}
                    </div>
                    
                    {result.classification.reasoning && (
                      <p className="text-xs text-slate-600">
                        <strong>Reasoning:</strong> {result.classification.reasoning}
                      </p>
                    )}
                    
                    {result.productMatches.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-slate-700 mb-1">Detected Products:</p>
                        <div className="space-y-1">
                          {result.productMatches.slice(0, 3).map((match: any, index: number) => (
                            <div key={index} className="text-xs bg-white p-2 rounded border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{match.product.name}</p>
                                  <p className="text-slate-500">{match.product.product_code}</p>
                                  {match.product.brand && (
                                    <p className="text-slate-500">Brand: {match.product.brand}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(match.confidence * 100)}%
                                  </Badge>
                                  <p className="text-xs text-slate-500 mt-1">
                                    ₹{match.product.unit_price}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {result.classification.extractedQuantities.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-slate-700 mb-1">Quantities:</p>
                        <div className="flex gap-2 flex-wrap">
                          {result.classification.extractedQuantities.map((qty: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {qty.quantity} {qty.product !== 'generic' ? `× ${qty.product}` : 'units'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {emails.length > 10 && (
            <div className="text-center py-4 text-sm text-slate-500">
              Showing first 10 emails. Process individually or implement batch processing.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
