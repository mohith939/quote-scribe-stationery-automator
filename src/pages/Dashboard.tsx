
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-1 p-4 md:p-6 pt-6 space-y-8">
        <QuickStats />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-6 md:col-span-1 lg:col-span-1">
            <GmailSettings />
            <GoogleSheetsSettings />
          </div>
          <div className="space-y-6 md:col-span-1 lg:col-span-2">
            <ProductCatalog />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <EmailInbox />
          <ProcessEmail />
        </div>
        
        <QuoteHistory />
      </div>
    </div>
  );
}
