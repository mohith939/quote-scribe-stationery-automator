
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Eye, Settings, FileText, Mail, Printer, Palette, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PDFTemplateCustomizer } from "@/components/templates/PDFTemplateCustomizer";

interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  category: 'formal' | 'casual' | 'detailed' | 'simple';
  preview: string;
}

const templates: QuoteTemplate[] = [
  {
    id: "formal-business",
    name: "Formal Business PDF",
    description: "Professional corporate PDF with company branding",
    category: "formal",
    preview: "Dear {customer},\n\nThank you for your inquiry regarding {product}.\n\nWe are pleased to provide you with the following quotation:\n\nProduct: {product}\nQuantity: {quantity} units\nUnit Price: ₹{price_per_unit}\nTotal Amount: ₹{total_amount}\n\nThis quotation is valid for 30 days.\n\nBest regards,\nYour Company"
  },
  {
    id: "casual-friendly",
    name: "Casual & Friendly PDF",
    description: "Warm and approachable PDF template",
    category: "casual",
    preview: "Hi {customer}!\n\nThanks for reaching out about {product}. Here's your quote:\n\n• Product: {product}\n• Quantity: {quantity} units\n• Price per unit: ₹{price_per_unit}\n• Total: ₹{total_amount}\n\nThis quote is good for 30 days. Let me know if you have questions!\n\nCheers,\nYour Team"
  },
  {
    id: "detailed-comprehensive",
    name: "Detailed Comprehensive PDF",
    description: "Complete PDF with terms, conditions, and specifications",
    category: "detailed",
    preview: "=== COMPREHENSIVE QUOTATION ===\n\nCustomer: {customer}\nDate: {date}\n\nProduct Details:\n- Name: {product}\n- Quantity: {quantity}\n- Unit Price: ₹{price_per_unit}\n- Total: ₹{total_amount}\n\nTerms & Conditions:\n- Payment: 50% advance, 50% on delivery\n- Delivery: 7-10 business days\n- Warranty: 1 year manufacturer warranty\n- Validity: 30 days\n\n[Company Letterhead]"
  },
  {
    id: "simple-quick",
    name: "Simple & Quick PDF",
    description: "Minimal PDF format for fast communication",
    category: "simple",
    preview: "Quote for {product}:\n{quantity} units × ₹{price_per_unit} = ₹{total_amount}\n\nValid for 7 days. Ready to ship!\nCall to confirm order."
  }
];

export function QuoteTemplates() {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("formal-business");
  const [outputFormat, setOutputFormat] = useState<'email' | 'pdf' | 'print'>('pdf');
  const [showCustomizer, setShowCustomizer] = useState(false);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    toast({
      title: "Template Selected",
      description: `Switched to ${templates.find(t => t.id === templateId)?.name} template`
    });
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: `Template and output format preferences have been saved.`
    });
  };

  const handleCustomizeTemplate = () => {
    setShowCustomizer(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'formal': return 'bg-blue-100 text-blue-800';
      case 'casual': return 'bg-green-100 text-green-800';
      case 'detailed': return 'bg-purple-100 text-purple-800';
      case 'simple': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Templates Manager</h2>
            <p className="text-slate-600 mt-1">Customize your PDF quotation templates with company branding</p>
          </div>
          <Button 
            onClick={handleSaveSettings}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <Settings className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selection Card */}
          <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Template Selection
              </CardTitle>
              <CardDescription>
                Choose your preferred PDF template format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">PDF Template</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="w-full bg-white border-slate-200">
                    <SelectValue placeholder="Select template format" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2 py-1">
                          <Badge className={getCategoryColor(template.category)}>
                            {template.category.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{template.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    {selectedTemplate.description}
                  </p>
                )}
              </div>

              {/* Output Format Selection */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <Label className="text-sm font-medium text-slate-700">Output Format</Label>
                <RadioGroup value={outputFormat} onValueChange={(value) => setOutputFormat(value as any)}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Email with PDF Attachment</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="h-4 w-4 text-red-600" />
                      <span className="font-medium">PDF Only</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <RadioGroupItem value="print" id="print" />
                    <Label htmlFor="print" className="flex items-center gap-2 cursor-pointer">
                      <Printer className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">Print Format</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview Card */}
          <Card className="lg:col-span-2 bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-green-600" />
                PDF Template Preview
              </CardTitle>
              <CardDescription>
                Preview how your PDF quotation will appear to customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTemplate && (
                <div className="space-y-4">
                  {/* Template Info */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <Badge className={getCategoryColor(selectedTemplate.category)}>
                      {selectedTemplate.category.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="border-slate-300">
                      {outputFormat.toUpperCase()}
                    </Badge>
                    <span className="font-semibold text-slate-800">{selectedTemplate.name}</span>
                  </div>

                  {/* PDF Preview */}
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold text-slate-700">PDF Template Preview</Label>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            onClick={handleCustomizeTemplate}
                          >
                            <Palette className="h-3 w-3 mr-1" />
                            Customize
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs">
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="bg-white border rounded-lg p-6 shadow-sm">
                        {/* PDF Header Simulation */}
                        <div className="border-b-2 border-blue-600 pb-4 mb-6">
                          <div className="flex justify-between items-center">
                            <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center text-xs text-slate-500">
                              LOGO
                            </div>
                            <div className="text-right">
                              <h1 className="text-2xl font-bold text-blue-600">QUOTATION</h1>
                              <p className="text-sm text-slate-600">Quote #QS-2024-001</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Email Content in PDF Format */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                              <h3 className="font-semibold text-blue-600 mb-2">From:</h3>
                              <div className="text-slate-700">
                                <p>Your Company Name</p>
                                <p>123 Business Street</p>
                                <p>contact@company.com</p>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-blue-600 mb-2">To:</h3>
                              <div className="text-slate-700">
                                <p>{"{customer_name}"}</p>
                                <p>{"{customer_email}"}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="font-mono text-sm whitespace-pre-line leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-lg border-l-4 border-blue-500">
                            {selectedTemplate.preview}
                          </div>
                          
                          <div className="border-t pt-4 text-center">
                            <p className="text-sm text-slate-600">Thank you for your business!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features Info */}
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>PDF Features:</strong> Professional formatting, company logo, branded headers, customer details, itemized quotations, terms & conditions, and digital signatures.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-slate-200/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Current Configuration</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Using <span className="font-medium">{selectedTemplate?.name}</span> template with <span className="font-medium">{outputFormat}</span> output format
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Test Send
                </Button>
                <Button 
                  onClick={handleSaveSettings}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Apply & Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PDF Template Customizer Modal */}
      <PDFTemplateCustomizer 
        open={showCustomizer}
        onOpenChange={setShowCustomizer}
        templateName={selectedTemplate?.name || ""}
      />
    </>
  );
}

export default QuoteTemplates;
