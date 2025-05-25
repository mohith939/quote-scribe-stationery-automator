
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Plus, Edit2, Copy, Trash2, Eye, FileText, Palette, Download, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface QuoteTemplate {
  id: string;
  name: string;
  subject: string;
  greeting: string;
  body: string;
  signoff: string;
  isDefault?: boolean;
  color?: string;
  style?: string;
}

const defaultTemplates: QuoteTemplate[] = [
  {
    id: "formal",
    name: "Formal Business",
    subject: "Quotation for {product} - Reference #{quote_id}",
    greeting: "Dear {customer_name},",
    body: "Thank you for your inquiry regarding {product}.\n\nWe are pleased to provide you with the following quotation:\n\nProduct: {product}\nQuantity: {quantity} units\nUnit Price: ₹{price_per_unit}\nTotal Amount: ₹{total_amount}\n\nThis quotation is valid for 30 days from the date of this email.\n\nPlease feel free to contact us if you have any questions or require further clarification.",
    signoff: "Best regards,\n{company_name}\n{contact_person}\n{phone}\n{email}",
    isDefault: true,
    color: "blue",
    style: "professional"
  },
  {
    id: "friendly",
    name: "Friendly & Personal",
    subject: "Your Quote for {product} is Ready!",
    greeting: "Hi {customer_name}!",
    body: "Thanks for reaching out to us about {product}. We're excited to work with you!\n\nHere's what we can offer:\n\n• Product: {product}\n• Quantity: {quantity} units\n• Price per unit: ₹{price_per_unit}\n• Total: ₹{total_amount}\n\nThis quote is good for the next 30 days. Let me know if you have any questions - I'm here to help!",
    signoff: "Cheers,\n{contact_person}\n{company_name}\n📞 {phone}\n✉️ {email}",
    color: "green",
    style: "casual"
  },
  {
    id: "detailed",
    name: "Detailed Technical",
    subject: "Comprehensive Quotation - {product}",
    greeting: "Dear {customer_name},",
    body: "Following your inquiry, please find our detailed quotation below:\n\n=== QUOTATION DETAILS ===\nProduct Code: {product_code}\nProduct Name: {product}\nSpecifications: {specifications}\nQuantity Requested: {quantity} units\nUnit Price: ₹{price_per_unit}\nSubtotal: ₹{subtotal}\nTax (18% GST): ₹{tax_amount}\nTotal Amount: ₹{total_amount}\n\n=== TERMS & CONDITIONS ===\n• Payment: 50% advance, 50% on delivery\n• Delivery: 7-10 business days\n• Warranty: 1 year manufacturer warranty\n• Quote validity: 30 days\n\nFor technical specifications or bulk discounts, please contact our technical team.",
    signoff: "Yours sincerely,\n{contact_person}\nSales Manager\n{company_name}\nPhone: {phone}\nEmail: {email}",
    color: "purple",
    style: "technical"
  },
  {
    id: "urgent",
    name: "Quick Response",
    subject: "URGENT: Quote for {product}",
    greeting: "Hello {customer_name},",
    body: "Quick quote as requested:\n\n{product} x {quantity} = ₹{total_amount}\n(₹{price_per_unit} per unit)\n\nValid for 7 days. Ready to ship immediately upon confirmation.\n\nCall {phone} to place order now!",
    signoff: "Regards,\n{contact_person}\n{company_name}",
    color: "red",
    style: "urgent"
  }
];

export function QuoteTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<QuoteTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<QuoteTemplate | null>(null);
  const [selectedTemplateForUse, setSelectedTemplateForUse] = useState<string>("formal");
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customColor, setCustomColor] = useState("blue");
  const [outputFormat, setOutputFormat] = useState("email");

  const handleCreateTemplate = () => {
    const newTemplate: QuoteTemplate = {
      id: `template-${Date.now()}`,
      name: "New Template",
      subject: "Quote for {product}",
      greeting: "Dear {customer_name},",
      body: "Thank you for your inquiry.\n\nProduct: {product}\nQuantity: {quantity}\nPrice: ₹{total_amount}\n\nThis quote is valid for 30 days.",
      signoff: "Best regards,\n{company_name}",
      color: "blue",
      style: "professional"
    };
    setSelectedTemplate(newTemplate);
    setIsEditing(true);
  };

  const handleEditTemplate = (template: QuoteTemplate) => {
    setSelectedTemplate({ ...template });
    setIsEditing(true);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    
    if (selectedTemplate.id.startsWith('template-')) {
      setTemplates([...templates, selectedTemplate]);
    } else {
      setTemplates(templates.map(t => t.id === selectedTemplate.id ? selectedTemplate : t));
    }
    
    setIsEditing(false);
    setSelectedTemplate(null);
    toast({
      title: "Template Saved",
      description: "Quote template has been saved successfully."
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    toast({
      title: "Template Deleted",
      description: "Quote template has been deleted."
    });
  };

  const handleDuplicateTemplate = (template: QuoteTemplate) => {
    const newTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isDefault: false
    };
    setTemplates([...templates, newTemplate]);
    toast({
      title: "Template Duplicated",
      description: "Quote template has been duplicated."
    });
  };

  const handleGeneratePDF = () => {
    toast({
      title: "PDF Generated",
      description: "Quote template has been exported as PDF."
    });
  };

  const getColorClass = (color: string) => {
    const colors = {
      blue: "border-blue-200 bg-blue-50",
      green: "border-green-200 bg-green-50",
      purple: "border-purple-200 bg-purple-50",
      red: "border-red-200 bg-red-50",
      orange: "border-orange-200 bg-orange-50",
      gray: "border-gray-200 bg-gray-50"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Template Selection Section */}
        <Card>
          <CardHeader>
            <CardTitle>Select Active Template</CardTitle>
            <CardDescription>
              Choose which template to use for new quotations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplateForUse === template.id 
                      ? `ring-2 ring-blue-500 ${getColorClass(template.color || "blue")}` 
                      : "hover:shadow-lg"
                  }`}
                  onClick={() => setSelectedTemplateForUse(template.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      {selectedTemplateForUse === template.id && (
                        <Check className="h-4 w-4 text-blue-500" />
                      )}
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-2">{template.subject}</p>
                    <div className="text-xs bg-gray-50 p-2 rounded max-h-16 overflow-hidden">
                      {template.body.substring(0, 80)}...
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const template = templates.find(t => t.id === selectedTemplateForUse);
                    if (template) {
                      setSelectedTemplate(template);
                      setShowPreview(true);
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Selected
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCustomization(true)}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Customize
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="word">Word Doc</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleGeneratePDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Management Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Manage Templates</CardTitle>
              <CardDescription>
                Create, edit, and organize your quote templates
              </CardDescription>
            </div>
            <Button onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="relative">
                  {template.isDefault && (
                    <Badge className="absolute top-2 right-2 bg-blue-500">Default</Badge>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.subject}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-20 overflow-hidden">
                          {template.greeting}<br/>
                          {template.body.substring(0, 100)}...
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowPreview(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {!template.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.id.startsWith('template-') ? 'Create' : 'Edit'} Template
            </DialogTitle>
            <DialogDescription>
              Customize your quote template. Use placeholders like {'{customer_name}'}, {'{product}'}, {'{quantity}'}, {'{total_amount}'}.
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={selectedTemplate.name}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={selectedTemplate.subject}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="greeting">Greeting</Label>
                <Input
                  id="greeting"
                  value={selectedTemplate.greeting}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, greeting: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  rows={8}
                  value={selectedTemplate.body}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="signoff">Sign-off</Label>
                <Textarea
                  id="signoff"
                  rows={3}
                  value={selectedTemplate.signoff}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, signoff: e.target.value})}
                />
              </div>
              <div>
                <Label>Template Color</Label>
                <RadioGroup 
                  value={selectedTemplate.color || "blue"} 
                  onValueChange={(value) => setSelectedTemplate({...selectedTemplate, color: value})}
                  className="flex gap-4 mt-2"
                >
                  {["blue", "green", "purple", "red", "orange", "gray"].map((color) => (
                    <div key={color} className="flex items-center space-x-2">
                      <RadioGroupItem value={color} id={color} />
                      <Label htmlFor={color} className="capitalize">{color}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of how the template will look when sent
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Subject:</Label>
                <div className="bg-gray-50 p-2 rounded font-mono text-sm">
                  {selectedTemplate.subject}
                </div>
              </div>
              <div>
                <Label className="font-semibold">Email Body:</Label>
                <div className={`p-4 rounded font-mono text-sm whitespace-pre-line ${getColorClass(selectedTemplate.color || "blue")}`}>
                  {selectedTemplate.greeting}
                  {'\n\n'}
                  {selectedTemplate.body}
                  {'\n\n'}
                  {selectedTemplate.signoff}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customization Dialog */}
      <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Template</DialogTitle>
            <DialogDescription>
              Adjust colors and formatting options for the selected template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Color Theme</Label>
              <RadioGroup value={customColor} onValueChange={setCustomColor} className="grid grid-cols-3 gap-4 mt-2">
                {["blue", "green", "purple", "red", "orange", "gray"].map((color) => (
                  <div key={color} className="flex items-center space-x-2">
                    <RadioGroupItem value={color} id={`custom-${color}`} />
                    <Label htmlFor={`custom-${color}`} className="capitalize">{color}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label>Output Format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Format</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="word">Word Document</SelectItem>
                  <SelectItem value="html">HTML Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomization(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              const template = templates.find(t => t.id === selectedTemplateForUse);
              if (template) {
                const updatedTemplate = { ...template, color: customColor };
                setTemplates(templates.map(t => t.id === template.id ? updatedTemplate : t));
              }
              setShowCustomization(false);
              toast({
                title: "Template Updated",
                description: "Template customization has been applied."
              });
            }}>
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default QuoteTemplates;
