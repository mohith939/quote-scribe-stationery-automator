
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PDFTemplateCustomizer } from "@/components/templates/PDFTemplateCustomizer";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  FileText, 
  Settings, 
  Download, 
  Send, 
  Edit,
  Mail,
  Printer,
  Eye
} from "lucide-react";

interface QuoteTemplatesProps {
  quoteData?: any;
}

export function QuoteTemplates({ quoteData }: QuoteTemplatesProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState('formal-business');
  const [outputFormat, setOutputFormat] = useState('email');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  
  // Load saved company info and logo
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState({
    name: "Your Company Name",
    address: "123 Business Street",
    city: "Business City, BC 12345",
    phone: "+1 (555) 123-4567",
    email: "contact@yourcompany.com",
    website: "www.yourcompany.com"
  });
  
  const [templateSettings, setTemplateSettings] = useState({
    headerText: "QUOTATION",
    footerText: "Thank you for your business!",
    termsAndConditions: "Payment terms: Net 30 days. Prices valid for 30 days. All prices in USD.",
    includeCompanyLogo: true,
    includeTerms: true,
    primaryColor: "#2563eb"
  });

  // Create user-specific storage key
  const getUserStorageKey = (key: string) => {
    return user ? `${key}_${user.id}` : key;
  };

  // Load saved data on component mount
  useEffect(() => {
    if (user) {
      // Load saved template and format
      const savedTemplate = localStorage.getItem(getUserStorageKey('selected_template'));
      const savedFormat = localStorage.getItem(getUserStorageKey('output_format'));
      
      if (savedTemplate) {
        setSelectedTemplate(savedTemplate);
      }
      if (savedFormat) {
        setOutputFormat(savedFormat);
      }

      // Load company logo
      const savedLogo = localStorage.getItem('companyLogo');
      if (savedLogo) {
        setCompanyLogo(savedLogo);
      }

      // Load company info
      const savedCompanyInfo = localStorage.getItem('companyInfo');
      if (savedCompanyInfo) {
        try {
          setCompanyInfo(JSON.parse(savedCompanyInfo));
        } catch (error) {
          console.error('Error parsing company info:', error);
        }
      }

      // Load template settings
      const savedTemplateSettings = localStorage.getItem('templateSettings');
      if (savedTemplateSettings) {
        try {
          setTemplateSettings(JSON.parse(savedTemplateSettings));
        } catch (error) {
          console.error('Error parsing template settings:', error);
        }
      }

      // Load quote data if available
      const savedQuoteData = localStorage.getItem(getUserStorageKey('current_quote_data'));
      if (savedQuoteData && !quoteData) {
        try {
          const parsedQuoteData = JSON.parse(savedQuoteData);
          console.log('Loaded quote data from localStorage:', parsedQuoteData);
        } catch (error) {
          console.error('Error parsing quote data:', error);
        }
      }
    }
  }, [user, quoteData]);

  // Save selections when they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(getUserStorageKey('selected_template'), selectedTemplate);
      localStorage.setItem(getUserStorageKey('output_format'), outputFormat);
    }
  }, [selectedTemplate, outputFormat, user]);

  const templates = [
    {
      id: 'formal-business',
      name: 'Formal Business',
      description: 'Professional tone with standard business language',
      preview: 'Dear [Customer], Thank you for your inquiry regarding our products...'
    },
    {
      id: 'casual-friendly',
      name: 'Casual & Friendly', 
      description: 'Warm and approachable tone for closer relationships',
      preview: 'Hi [Customer]! Thanks for reaching out about our products...'
    },
    {
      id: 'detailed-comprehensive',
      name: 'Detailed & Comprehensive',
      description: 'Thorough template with complete terms and conditions',
      preview: '=== COMPREHENSIVE QUOTATION === Customer: [Customer Name]...'
    },
    {
      id: 'simple-quick',
      name: 'Simple & Quick',
      description: 'Minimal template for fast responses',
      preview: 'Quote for [Products]: [Details] Valid for 7 days...'
    }
  ];

  const outputFormats = [
    { id: 'email', name: 'Email', icon: Mail, description: 'Send as formatted email' },
    { id: 'pdf', name: 'PDF', icon: FileText, description: 'Generate PDF attachment' },
    { id: 'print', name: 'Print', icon: Printer, description: 'Print-ready format' }
  ];

  const handleSendQuote = () => {
    if (!quoteData) {
      toast({
        title: "No Quote Data",
        description: "Please select a quote from the processing queue first.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Quote Sent Successfully",
      description: `Quote sent to ${quoteData.customerName} via ${outputFormat}`,
    });
  };

  const handlePreviewQuote = () => {
    toast({
      title: "Generating Preview",
      description: "Creating quote preview with current template...",
    });
  };

  // Get current quote data (from props or localStorage)
  const currentQuoteData = quoteData || (() => {
    if (user) {
      const saved = localStorage.getItem(getUserStorageKey('current_quote_data'));
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error('Error parsing saved quote data:', error);
        }
      }
    }
    return null;
  })();

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Quote Templates</CardTitle>
                <CardDescription>
                  Customize and send professional quotations
                  {currentQuoteData && (
                    <span className="block text-blue-600 font-medium mt-1">
                      Current: {currentQuoteData.customerName} - {currentQuoteData.emailSubject}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCustomizerOpen(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Customize PDF
              </Button>
              <Button
                onClick={handlePreviewQuote}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={handleSendQuote}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={!currentQuoteData}
              >
                <Send className="h-4 w-4" />
                Send Quote
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Select Template Style
              </CardTitle>
              <CardDescription>
                Choose the tone and format for your quotation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      {selectedTemplate === template.id && (
                        <Badge className="bg-blue-600">Selected</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="bg-gray-50 p-2 rounded text-xs text-gray-700">
                      {template.preview}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Output Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Output Format</CardTitle>
              <CardDescription>
                Choose how you want to deliver the quotation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {outputFormats.map((format) => {
                  const IconComponent = format.icon;
                  return (
                    <div
                      key={format.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all text-center ${
                        outputFormat === format.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setOutputFormat(format.id)}
                    >
                      <IconComponent className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <h3 className="font-semibold mb-1">{format.name}</h3>
                      <p className="text-xs text-gray-600">{format.description}</p>
                      {outputFormat === format.id && (
                        <Badge className="mt-2 bg-blue-600">Selected</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                Preview of your quotation with current settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-lg p-4 shadow-sm min-h-[400px] text-sm">
                {/* PDF Header with Logo */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2" style={{borderColor: templateSettings.primaryColor}}>
                  {companyLogo && templateSettings.includeCompanyLogo && (
                    <img 
                      src={companyLogo} 
                      alt="Company Logo" 
                      className="h-8 object-contain max-w-[100px]" 
                    />
                  )}
                  <div className="text-right">
                    <h1 className="text-lg font-bold" style={{color: templateSettings.primaryColor}}>
                      {templateSettings.headerText}
                    </h1>
                    <p className="text-xs text-slate-600">Quote #QS-2024-001</p>
                  </div>
                </div>

                {/* Company & Customer Info */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                  <div>
                    <h3 className="font-semibold mb-1" style={{color: templateSettings.primaryColor}}>From:</h3>
                    <div>
                      <p className="font-medium">{companyInfo.name}</p>
                      <p>{companyInfo.address}</p>
                      <p>{companyInfo.city}</p>
                      <p>{companyInfo.phone}</p>
                      <p>{companyInfo.email}</p>
                      <p>{companyInfo.website}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style={{color: templateSettings.primaryColor}}>To:</h3>
                    <div>
                      <p className="font-medium">
                        {currentQuoteData?.customerName || 'Sample Customer'}
                      </p>
                      <p>{currentQuoteData?.customerEmail || 'customer@example.com'}</p>
                    </div>
                  </div>
                </div>

                {/* Quote Content Based on Selected Template */}
                <div className="mb-4">
                  {selectedTemplate === 'formal-business' && (
                    <div>
                      <p className="mb-2">Dear {currentQuoteData?.customerName || 'Customer'},</p>
                      <p className="mb-2">Thank you for your inquiry regarding our products.</p>
                      <p>We are pleased to provide you with the following quotation:</p>
                    </div>
                  )}
                  {selectedTemplate === 'casual-friendly' && (
                    <div>
                      <p className="mb-2">Hi {currentQuoteData?.customerName || 'Customer'}!</p>
                      <p>Thanks for reaching out about our products. Here's your quote:</p>
                    </div>
                  )}
                  {selectedTemplate === 'detailed-comprehensive' && (
                    <div>
                      <h3 className="font-bold mb-2" style={{color: templateSettings.primaryColor}}>
                        COMPREHENSIVE QUOTATION
                      </h3>
                      <p>Customer: {currentQuoteData?.customerName || 'Sample Customer'}</p>
                      <p>Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedTemplate === 'simple-quick' && (
                    <div>
                      <p>Quote for products: Ready to ship!</p>
                    </div>
                  )}
                </div>

                {/* Sample Product Table */}
                <div className="mb-4">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr style={{backgroundColor: `${templateSettings.primaryColor}15`}}>
                        <th className="border p-1 text-left">Product</th>
                        <th className="border p-1 text-center">Qty</th>
                        <th className="border p-1 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentQuoteData?.detectedProducts?.map((product: any, index: number) => (
                        <tr key={index}>
                          <td className="border p-1">{product.product}</td>
                          <td className="border p-1 text-center">{product.quantity || 1}</td>
                          <td className="border p-1 text-right">₹1,000.00</td>
                        </tr>
                      )) || (
                        <tr>
                          <td className="border p-1">Sample Product</td>
                          <td className="border p-1 text-center">1</td>
                          <td className="border p-1 text-right">₹1,000.00</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Terms & Footer */}
                {templateSettings.includeTerms && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-xs mb-1" style={{color: templateSettings.primaryColor}}>
                      Terms & Conditions:
                    </h4>
                    <p className="text-xs text-gray-600">{templateSettings.termsAndConditions}</p>
                  </div>
                )}

                <div className="text-center pt-2 border-t border-gray-300">
                  <p className="text-xs text-gray-600">{templateSettings.footerText}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PDFTemplateCustomizer
        open={isCustomizerOpen}
        onOpenChange={setIsCustomizerOpen}
        templateName={templates.find(t => t.id === selectedTemplate)?.name || 'Template'}
      />
    </div>
  );
}
