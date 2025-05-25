
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Check, Eye, Settings, FileText, Mail, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  format: 'email' | 'pdf' | 'formal' | 'casual';
  preview: string;
}

const templates: QuoteTemplate[] = [
  {
    id: "formal-email",
    name: "Formal Email",
    description: "Professional business email format",
    format: "formal",
    preview: "Dear {customer},\n\nThank you for your inquiry regarding {product}.\n\nWe are pleased to provide you with the following quotation:\n\nProduct: {product}\nQuantity: {quantity} units\nUnit Price: ₹{price_per_unit}\nTotal Amount: ₹{total_amount}\n\nThis quotation is valid for 30 days.\n\nBest regards,\nYour Company"
  },
  {
    id: "casual-email",
    name: "Casual Email",
    description: "Friendly and personal email format",
    format: "casual",
    preview: "Hi {customer}!\n\nThanks for reaching out about {product}. Here's your quote:\n\n• Product: {product}\n• Quantity: {quantity} units\n• Price per unit: ₹{price_per_unit}\n• Total: ₹{total_amount}\n\nThis quote is good for 30 days. Let me know if you have questions!\n\nCheers,\nYour Team"
  },
  {
    id: "pdf-detailed",
    name: "PDF Format",
    description: "Detailed PDF quotation document",
    format: "pdf",
    preview: "=== QUOTATION DOCUMENT ===\n\nCustomer: {customer}\nDate: {date}\n\nProduct Details:\n- Name: {product}\n- Quantity: {quantity}\n- Unit Price: ₹{price_per_unit}\n- Total: ₹{total_amount}\n\nTerms & Conditions:\n- Payment: 50% advance\n- Delivery: 7-10 days\n- Warranty: 1 year\n\n[Company Letterhead]"
  },
  {
    id: "quick-text",
    name: "Quick Text",
    description: "Simple text message format",
    format: "email",
    preview: "Quote for {product}:\n{quantity} units × ₹{price_per_unit} = ₹{total_amount}\n\nValid for 7 days. Ready to ship!\nCall to confirm order."
  }
];

export function QuoteTemplates() {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("formal-email");
  const [showPreview, setShowPreview] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'email' | 'pdf' | 'print'>('email');

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    toast({
      title: "Template Selected",
      description: `Switched to ${templates.find(t => t.id === templateId)?.name} template`
    });
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: `Template and output format preferences have been saved.`
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quote Template Settings</CardTitle>
          <CardDescription>
            Select the email format and output type for your quotations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Email Template</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select template format" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {template.format.toUpperCase()}
                      </Badge>
                      <span>{template.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-sm text-muted-foreground">
                {selectedTemplate.description}
              </p>
            )}
          </div>

          {/* Output Format */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Output Format</Label>
            <RadioGroup value={outputFormat} onValueChange={(value) => setOutputFormat(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF Attachment
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="print" id="print" />
                <Label htmlFor="print" className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Format
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Current Selection Preview */}
          {selectedTemplate && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Current Template: {selectedTemplate.name}</h4>
                <Button variant="outline" size="sm" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>
              <div className="text-sm bg-white p-3 rounded border font-mono whitespace-pre-line max-h-32 overflow-y-auto">
                {selectedTemplate.preview.substring(0, 200)}...
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Full Preview
            </Button>
            <Button onClick={handleSaveSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Preview of how the quote will be formatted when sent
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedTemplate.format.toUpperCase()}</Badge>
                <Badge variant="outline">{outputFormat.toUpperCase()}</Badge>
              </div>
              <div className="bg-gray-50 p-4 rounded border">
                <Label className="font-semibold">Email Content:</Label>
                <div className="mt-2 bg-white p-4 rounded border font-mono text-sm whitespace-pre-line">
                  {selectedTemplate.preview}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Placeholders like {'{customer}'}, {'{product}'}, {'{quantity}'} will be replaced with actual values
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default QuoteTemplates;
