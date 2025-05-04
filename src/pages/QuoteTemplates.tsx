
import Navbar from "@/components/dashboard/Navbar";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { QuoteTemplate } from "@/types";
import { defaultQuoteTemplate } from "@/services/quoteService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save } from "lucide-react";

const QuoteTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<QuoteTemplate[]>([defaultQuoteTemplate]);
  const [activeTemplate, setActiveTemplate] = useState<QuoteTemplate>(defaultQuoteTemplate);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultQuoteTemplate.id);
  
  const handleTemplateChange = (field: keyof QuoteTemplate, value: string) => {
    setActiveTemplate({
      ...activeTemplate,
      [field]: value
    });
  };

  const handleSaveTemplate = () => {
    // Update the template in the list
    setTemplates(templates.map(t => 
      t.id === activeTemplate.id ? activeTemplate : t
    ));
    
    toast({
      title: "Template Saved",
      description: "Your quote template has been saved successfully"
    });
  };
  
  const handleNewTemplate = () => {
    const newTemplate: QuoteTemplate = {
      id: `template-${Date.now()}`,
      name: "New Template",
      subject: "Quote for your {product} inquiry",
      greeting: "Dear {customer},",
      body: "Thank you for your inquiry about {product}.\n\nBased on your request, we are pleased to offer:\n\nProduct: {product}\nQuantity: {quantity} units\nPrice per unit: ₹{price_per_unit}\nTotal amount: ₹{total_amount}\n\nThis quote is valid for 30 days from today.",
      signoff: "Best regards,\nYour Company Name"
    };
    
    setTemplates([...templates, newTemplate]);
    setActiveTemplate(newTemplate);
    setSelectedTemplateId(newTemplate.id);
    
    toast({
      title: "New Template Created",
      description: "You can now customize your new template"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 p-8 pt-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Quote Templates</h2>
          <p className="text-muted-foreground">
            Create and manage email templates for your quotations
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Template Builder</CardTitle>
                <CardDescription>
                  Customize your quotation email templates
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleNewTemplate}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </CardHeader>
            <CardContent>
              {templates.length > 0 && (
                <Tabs 
                  value={selectedTemplateId} 
                  onValueChange={(value) => {
                    const template = templates.find(t => t.id === value);
                    if (template) {
                      setSelectedTemplateId(value);
                      setActiveTemplate(template);
                    }
                  }}
                  className="mb-4"
                >
                  <TabsList className="w-full">
                    {templates.map(template => (
                      <TabsTrigger key={template.id} value={template.id} className="flex-1">
                        {template.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={activeTemplate.name}
                    onChange={(e) => handleTemplateChange("name", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={activeTemplate.subject}
                    onChange={(e) => handleTemplateChange("subject", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{product}"} as placeholder for product name
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="greeting">Greeting</Label>
                  <Input
                    id="greeting"
                    value={activeTemplate.greeting}
                    onChange={(e) => handleTemplateChange("greeting", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{customer}"} as placeholder for customer name
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    rows={8}
                    value={activeTemplate.body}
                    onChange={(e) => handleTemplateChange("body", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available placeholders: {"{product}"}, {"{quantity}"}, {"{price_per_unit}"}, {"{total_amount}"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signoff">Sign-off</Label>
                  <Textarea
                    id="signoff"
                    rows={3}
                    value={activeTemplate.signoff}
                    onChange={(e) => handleTemplateChange("signoff", e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveTemplate} className="flex items-center">
                    <Save className="h-4 w-4 mr-1.5" />
                    Save Template
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                See how your template will look when sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border p-4 rounded-md bg-white">
                <div className="mb-4 border-b pb-2">
                  <p className="font-medium">To: customer@example.com</p>
                  <p className="font-medium">
                    Subject: {activeTemplate.subject.replace(/{product}/g, "A4 Paper - 80gsm")}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <p>{activeTemplate.greeting.replace(/{customer}/g, "Customer")}</p>
                  
                  <div className="whitespace-pre-line">
                    {activeTemplate.body
                      .replace(/{product}/g, "A4 Paper - 80gsm")
                      .replace(/{quantity}/g, "500")
                      .replace(/{price_per_unit}/g, "0.40")
                      .replace(/{total_amount}/g, "200.00")
                      .replace(/\$/g, "₹")}
                  </div>
                  
                  <div className="mt-4 whitespace-pre-line">
                    {activeTemplate.signoff}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuoteTemplates;
