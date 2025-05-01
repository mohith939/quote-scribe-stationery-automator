
import GmailSettings from "@/components/dashboard/GmailSettings";
import GoogleSheetsSettings from "@/components/dashboard/GoogleSheetsSettings";
import QuickStats from "@/components/dashboard/QuickStats";
import QuoteHistory from "@/components/dashboard/QuoteHistory";
import EmailInbox from "@/components/dashboard/EmailInbox";
import ProcessEmail from "@/components/dashboard/ProcessEmail";
import ProductCatalog from "@/components/dashboard/ProductCatalog";
import Navbar from "@/components/dashboard/Navbar";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 space-y-8">
        <QuickStats />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <GmailSettings />
            <GoogleSheetsSettings />
            <EmailInbox />
          </div>
          
          <div className="md:col-span-2 space-y-6">
            <ProcessEmail />
            <ProductCatalog />
            <QuoteHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
