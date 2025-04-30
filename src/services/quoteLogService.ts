
import { GoogleSheetsConfig } from "@/types";
import { getGoogleSheetsConfig } from "./googleSheetsService";
import { GOOGLE_APPS_SCRIPT_URL } from "./serviceConfig";

// Log quote information to Google Sheets
export const logQuoteToSheet = async (quoteData: {
  timestamp: string;
  customerName: string;
  emailAddress: string;
  product: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: 'Sent' | 'Failed' | 'Pending' | 'Manual';
}): Promise<boolean> => {
  try {
    // Get Google Sheets configuration
    const sheetsConfig: GoogleSheetsConfig = getGoogleSheetsConfig();
    
    if (!sheetsConfig.isConnected || !sheetsConfig.spreadsheetId) {
      console.log("Google Sheets not connected, skipping log");
      return true; // Return true to not block the flow
    }
    
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'logQuote',
        spreadsheetId: sheetsConfig.spreadsheetId,
        sheetName: sheetsConfig.quotesSheetName,
        quoteData
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to log quote: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error logging quote to sheet:", error);
    return false;
  }
}
