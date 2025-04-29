
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/dashboard/Navbar";
import QuickStats from "@/components/dashboard/QuickStats";
import EmailInbox from "@/components/dashboard/EmailInbox";
import QuoteHistory from "@/components/dashboard/QuoteHistory";
import ProductCatalog from "@/components/dashboard/ProductCatalog";
import ProcessEmail from "@/components/dashboard/ProcessEmail";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [templateData, setTemplateData] = useState({
    name: "Default Template",
    subject: "Your Quotation for {product}",
    greeting: "Dear {customer},",
    body: "Thank you for your inquiry. Please find our quotation below:\n\nProduct: {product}\nQuantity: {quantity}\nPrice per Unit: ${price_per_unit}\nTotal Amount: ${total_amount}\n\nThis quotation is valid for 14 days from the date of this email.",
    signoff: "Best regards,\nYour Stationery Shop"
  });

  const handleTemplateChange = (field: string, value: string) => {
    setTemplateData({
      ...templateData,
      [field]: value
    });
  };

  const handleSaveTemplate = () => {
    toast({
      title: "Template Saved",
      description: "Your quote template has been saved successfully"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 p-8 pt-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Manage quotations and product pricing for your stationery business
          </p>
        </div>
        
        <QuickStats />
        
        <Tabs defaultValue="inbox" className="mt-6">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="inbox">Email Inbox</TabsTrigger>
            <TabsTrigger value="process">Process Email</TabsTrigger>
            <TabsTrigger value="templates">Quote Templates</TabsTrigger>
            <TabsTrigger value="history">Quote History</TabsTrigger>
            <TabsTrigger value="products">Product Catalog</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbox" className="space-y-4">
            <EmailInbox />
          </TabsContent>
          
          <TabsContent value="process">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProcessEmail />
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Quote Template</CardTitle>
                  <CardDescription>
                    Preview the quotation that will be sent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border p-4 rounded-md">
                    <div className="mb-4">
                      <p className="font-medium">To: customer@example.com</p>
                      <p className="font-medium">Subject: Your Quotation for A4 Paper</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>Dear Customer,</p>
                      <p>Thank you for your inquiry. Please find our quotation below:</p>
                      <div className="my-4 border-y py-4">
                        <p><strong>Product:</strong> A4 Paper - 80gsm</p>
                        <p><strong>Quantity:</strong> 500 sheets</p>
                        <p><strong>Price per Unit:</strong> $0.40</p>
                        <p className="font-bold mt-2">Total Amount: $200.00</p>
                      </div>
                      <p>This quotation is valid for 14 days from the date of this email.</p>
                      <p>Please let us know if you would like to proceed with this order.</p>
                      <p className="mt-4">Best regards,</p>
                      <p>Your Stationery Shop</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quote Template Builder</CardTitle>
                  <CardDescription>
                    Customize your quotation email templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="templateName">Template Name</Label>
                      <Input
                        id="templateName"
                        value={templateData.name}
                        onChange={(e) => handleTemplateChange("name", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Email Subject</Label>
                      <Input
                        id="subject"
                        value={templateData.subject}
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
                        value={templateData.greeting}
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
                        value={templateData.body}
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
                        value={templateData.signoff}
                        onChange={(e) => handleTemplateChange("signoff", e.target.value)}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={handleSaveTemplate}>Save Template</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Template Preview</CardTitle>
                  <CardDescription>
                    See how your template will look
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border p-4 rounded-md bg-white">
                    <div className="mb-4">
                      <p className="font-medium">To: customer@example.com</p>
                      <p className="font-medium">
                        Subject: {templateData.subject.replace(/{product}/g, "A4 Paper - 80gsm")}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>{templateData.greeting.replace(/{customer}/g, "Customer")}</p>
                      
                      <div className="whitespace-pre-line">
                        {templateData.body
                          .replace(/{product}/g, "A4 Paper - 80gsm")
                          .replace(/{quantity}/g, "500")
                          .replace(/{price_per_unit}/g, "0.40")
                          .replace(/{total_amount}/g, "200.00")}
                      </div>
                      
                      <div className="mt-4 whitespace-pre-line">
                        {templateData.signoff}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <QuoteHistory />
          </TabsContent>
          
          <TabsContent value="products">
            <ProductCatalog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
