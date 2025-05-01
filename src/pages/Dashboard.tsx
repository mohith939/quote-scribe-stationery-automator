
import { useState } from "react";
import GmailSettings from "@/components/dashboard/GmailSettings";
import GoogleSheetsSettings from "@/components/dashboard/GoogleSheetsSettings";
import QuickStats from "@/components/dashboard/QuickStats";
import QuoteHistory from "@/components/dashboard/QuoteHistory";
import EmailInbox from "@/components/dashboard/EmailInbox";
import ProcessEmail from "@/components/dashboard/ProcessEmail";
import ProductCatalog from "@/components/dashboard/ProductCatalog";
import Navbar from "@/components/dashboard/Navbar";

type TabType = 'inbox' | 'process' | 'history' | 'catalog' | 'settings';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  
  // Render the main content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'inbox':
        return (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left panel - Split into top and bottom */}
            <div className="md:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1">
                  <EmailInbox />
                </div>
                <div className="col-span-1">
                  <ProcessEmail />
                </div>
              </div>
              <QuoteHistory />
            </div>
            
            {/* Right panel */}
            <div className="md:col-span-4 space-y-6">
              <ProductCatalog />
              <div className="space-y-6">
                <GmailSettings />
                <GoogleSheetsSettings />
              </div>
            </div>
          </div>
        );
      
      case 'process':
        return <ProcessEmail />;
      
      case 'history':
        return <QuoteHistory />;
      
      case 'catalog':
        return <ProductCatalog />;
      
      case 'settings':
        return (
          <div className="space-y-6">
            <GmailSettings />
            <GoogleSheetsSettings />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 px-4">
        {/* Header section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage quotations and product pricing for your stationery business
          </p>
        </div>
        
        {/* Stats cards */}
        <QuickStats />
        
        {/* Tabs-like layout */}
        <div className="flex space-x-4 border-b mt-8 mb-6">
          <div 
            className={`pb-2 px-4 cursor-pointer ${activeTab === 'inbox' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('inbox')}
          >
            Email Inbox
          </div>
          <div 
            className={`pb-2 px-4 cursor-pointer ${activeTab === 'process' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('process')}
          >
            Process Email
          </div>
          <div 
            className={`pb-2 px-4 cursor-pointer ${activeTab === 'history' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('history')}
          >
            Quote History
          </div>
          <div 
            className={`pb-2 px-4 cursor-pointer ${activeTab === 'catalog' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('catalog')}
          >
            Product Catalog
          </div>
          <div 
            className={`pb-2 px-4 cursor-pointer ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </div>
        </div>
        
        {/* Main content area */}
        {renderContent()}
      </div>
    </div>
  );
}
