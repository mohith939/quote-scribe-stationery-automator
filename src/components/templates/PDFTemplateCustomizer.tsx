
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, Download, Save } from "lucide-react";

interface PDFTemplateCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
}

export function PDFTemplateCustomizer({ open, onOpenChange, templateName }: PDFTemplateCustomizerProps) {
  const { toast } = useToast();
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

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyLogo(e.target?.result as string);
        toast({
          title: "Logo uploaded",
          description: "Company logo has been updated successfully."
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplate = () => {
    toast({
      title: "Template saved",
      description: `${templateName} template has been customized and saved.`
    });
    onOpenChange(false);
  };

  const handlePreviewPDF = () => {
    toast({
      title: "Generating preview",
      description: "Creating PDF preview with your customizations..."
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Customize PDF Template</h2>
              <p className="text-sm text-slate-600">Template: {templateName}</p>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customization Panel */}
          <div className="space-y-6">
            {/* Company Logo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Logo</CardTitle>
                <CardDescription>Upload your company logo for the PDF header</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  {companyLogo ? (
                    <div>
                      <img src={companyLogo} alt="Company Logo" className="mx-auto h-16 object-contain mb-4" />
                      <p className="text-sm text-slate-600">Logo uploaded successfully</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Click to upload logo</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <Button variant="outline" className="mt-2" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Information</CardTitle>
                <CardDescription>This information will appear on your PDF quotations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input
                      id="companyEmail"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Address</Label>
                  <Input
                    id="companyAddress"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone</Label>
                    <Input
                      id="companyPhone"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Website</Label>
                    <Input
                      id="companyWebsite"
                      value={companyInfo.website}
                      onChange={(e) => setCompanyInfo({...companyInfo, website: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Settings</CardTitle>
                <CardDescription>Customize the appearance and content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headerText">Header Text</Label>
                  <Input
                    id="headerText"
                    value={templateSettings.headerText}
                    onChange={(e) => setTemplateSettings({...templateSettings, headerText: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input
                    id="footerText"
                    value={templateSettings.footerText}
                    onChange={(e) => setTemplateSettings({...templateSettings, footerText: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termsConditions">Terms & Conditions</Label>
                  <Textarea
                    id="termsConditions"
                    rows={4}
                    value={templateSettings.termsAndConditions}
                    onChange={(e) => setTemplateSettings({...templateSettings, termsAndConditions: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={templateSettings.primaryColor}
                      onChange={(e) => setTemplateSettings({...templateSettings, primaryColor: e.target.value})}
                      className="w-12 h-10 border border-slate-300 rounded"
                    />
                    <Input
                      value={templateSettings.primaryColor}
                      onChange={(e) => setTemplateSettings({...templateSettings, primaryColor: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PDF Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PDF Preview</CardTitle>
                <CardDescription>Live preview of your PDF template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-6 shadow-lg min-h-[600px]">
                  {/* PDF Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b-2" style={{borderColor: templateSettings.primaryColor}}>
                    {companyLogo && (
                      <img src={companyLogo} alt="Company Logo" className="h-12 object-contain" />
                    )}
                    <div className="text-right">
                      <h1 className="text-2xl font-bold" style={{color: templateSettings.primaryColor}}>
                        {templateSettings.headerText}
                      </h1>
                      <p className="text-sm text-slate-600">Quote #QS-2024-001</p>
                    </div>
                  </div>

                  {/* Company & Customer Info */}
                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                      <h3 className="font-semibold mb-2" style={{color: templateSettings.primaryColor}}>From:</h3>
                      <div className="text-sm">
                        <p className="font-medium">{companyInfo.name}</p>
                        <p>{companyInfo.address}</p>
                        <p>{companyInfo.city}</p>
                        <p>{companyInfo.phone}</p>
                        <p>{companyInfo.email}</p>
                        <p>{companyInfo.website}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2" style={{color: templateSettings.primaryColor}}>To:</h3>
                      <div className="text-sm">
                        <p className="font-medium">{"{customer_name}"}</p>
                        <p>{"{customer_address}"}</p>
                        <p>{"{customer_email}"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quote Details */}
                  <div className="mb-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr style={{backgroundColor: `${templateSettings.primaryColor}15`}}>
                          <th className="border p-2 text-left">Product</th>
                          <th className="border p-2 text-center">Qty</th>
                          <th className="border p-2 text-right">Unit Price</th>
                          <th className="border p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2">{"{product_name}"}</td>
                          <td className="border p-2 text-center">{"{quantity}"}</td>
                          <td className="border p-2 text-right">{"{unit_price}"}</td>
                          <td className="border p-2 text-right font-semibold">{"{total_amount}"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Terms & Conditions */}
                  {templateSettings.includeTerms && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2" style={{color: templateSettings.primaryColor}}>Terms & Conditions:</h3>
                      <p className="text-sm text-slate-700">{templateSettings.termsAndConditions}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="text-center pt-4 border-t border-slate-300">
                    <p className="text-sm text-slate-600">{templateSettings.footerText}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handlePreviewPDF} variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Preview PDF
              </Button>
              <Button onClick={handleSaveTemplate} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
