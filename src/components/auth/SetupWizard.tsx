
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowRight, ArrowLeft, Mail, Database, FileText, Settings } from "lucide-react";

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState({
    companyName: "",
    companyEmail: "",
    enableGmailSync: false,
    enableAutoQuoting: true,
    quoteCurrency: "USD",
    defaultTemplate: "professional",
  });
  const { toast } = useToast();

  const steps = [
    {
      title: "Company Information",
      description: "Let's start with your business details",
      icon: FileText,
    },
    {
      title: "Email Integration",
      description: "Connect your email for automated quotes",
      icon: Mail,
    },
    {
      title: "Product Catalog",
      description: "Import or create your product catalog",
      icon: Database,
    },
    {
      title: "Automation Settings",
      description: "Configure your quoting preferences",
      icon: Settings,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    toast({
      title: "Setup completed!",
      description: "Your QuoteScribe platform is ready to use.",
    });
    onComplete();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Your Company Ltd."
                value={setupData.companyName}
                onChange={(e) => setSetupData({ ...setupData, companyName: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Business Email</Label>
              <Input
                id="companyEmail"
                type="email"
                placeholder="info@yourcompany.com"
                value={setupData.companyEmail}
                onChange={(e) => setSetupData({ ...setupData, companyEmail: e.target.value })}
                className="h-12"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Gmail Integration</h4>
                <p className="text-sm text-slate-600">
                  Automatically monitor your inbox for quote requests
                </p>
              </div>
              <Switch
                checked={setupData.enableGmailSync}
                onCheckedChange={(checked) => 
                  setSetupData({ ...setupData, enableGmailSync: checked })
                }
              />
            </div>
            {setupData.enableGmailSync && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  You'll be redirected to Google to authorize email access after setup.
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-lg">
              <Database className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h4 className="font-medium mb-2">Import Product Catalog</h4>
              <p className="text-sm text-slate-600 mb-4">
                Upload a CSV file with your products, or start with our sample data
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  Upload CSV File
                </Button>
                <Button variant="ghost" className="w-full">
                  Use Sample Data
                </Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Auto-Generate Quotes</h4>
                <p className="text-sm text-slate-600">
                  Automatically create quotes for recognized requests
                </p>
              </div>
              <Switch
                checked={setupData.enableAutoQuoting}
                onCheckedChange={(checked) => 
                  setSetupData({ ...setupData, enableAutoQuoting: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <select 
                className="w-full h-12 px-3 border border-slate-200 rounded-md"
                value={setupData.quoteCurrency}
                onChange={(e) => setSetupData({ ...setupData, quoteCurrency: e.target.value })}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const stepIconClasses = index <= currentStep 
                ? 'border-blue-600 bg-blue-600 text-white' 
                : 'border-slate-300 bg-white text-slate-400';
              const connectorClasses = index < currentStep ? 'bg-blue-600' : 'bg-slate-300';
              
              return (
                <div key={index} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${stepIconClasses}`}>
                    {index < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      React.createElement(step.icon, { className: "h-5 w-5" })
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-24 h-0.5 ml-4 ${connectorClasses}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-slate-800">
              {steps[currentStep].title}
            </h2>
            <p className="text-slate-600">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Setup Card */}
        <Card className="backdrop-blur-xl bg-white/80 border-slate-200/60 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep].icon, { className: "h-5 w-5 text-blue-600" })}
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {steps.length}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-6">
            {renderStepContent()}
          </CardContent>

          {/* Navigation */}
          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
