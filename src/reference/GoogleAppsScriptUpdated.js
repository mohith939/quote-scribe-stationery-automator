
/**
 * Google Apps Script for QuoteScribe Application
 * 
 * This script provides the backend functionality for:
 * 1. Fetching unread emails from Gmail
 * 2. Marking emails as read
 * 3. Sending automated quote responses
 * 4. Logging quote data to Google Sheets
 * 
 * HOW TO DEPLOY:
 * 1. Go to https://script.google.com/
 * 2. Create a new project
 * 3. Copy and paste this entire script
 * 4. Save the file (File > Save)
 * 5. Deploy as a web app (Deploy > New deployment)
 *    - Set "Execute as" to "Me (your email)"
 *    - Set "Who has access" to "Anyone" (for dev) or "Anyone within your organization" (for production)
 * 6. Copy the web app URL and use it in your app's GOOGLE_APPS_SCRIPT_URL setting
 */

/**
 * Process web app requests based on action parameter
 */
function doGet(e) {
  const action = e.parameter.action;
  
  switch (action) {
    case 'fetchUnreadEmails':
      return handleFetchUnreadEmails();
    default:
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Invalid action'
      })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests for actions requiring more data
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'markAsRead':
        return handleMarkAsRead(data);
      case 'sendEmail':
        return handleSendEmail(data);
      case 'logQuote':
        return handleLogQuote(data);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: 'Invalid action'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error processing request: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Fetch unread emails from Gmail
 */
function handleFetchUnreadEmails() {
  try {
    // Search for unread messages
    const threads = GmailApp.search('is:unread', 0, 20);
    const emails = [];
    
    // Process each thread (conversation)
    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      const messages = thread.getMessages();
      
      // Get the latest message in the thread
      const lastMessage = messages[messages.length - 1];
      
      // Extract relevant information
      emails.push({
        id: lastMessage.getId(),
        from: lastMessage.getFrom(),
        subject: lastMessage.getSubject(),
        body: lastMessage.getPlainBody(),
        date: lastMessage.getDate().toISOString()
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      emails: emails
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error fetching emails: ' + error.toString(),
      emails: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Mark an email as read
 */
function handleMarkAsRead(data) {
  try {
    const messageId = data.emailId;
    const message = GmailApp.getMessageById(messageId);
    
    if (!message) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Email not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Mark the message as read
    message.markRead();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email marked as read'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error marking email as read: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Send a quote email response
 */
function handleSendEmail(data) {
  try {
    const to = data.to;
    const subject = data.subject;
    const body = data.body;
    const originalEmailId = data.originalEmailId; // Optional
    
    // Send the email
    GmailApp.sendEmail(to, subject, body);
    
    // If there's an original email ID, mark it as read and add a label
    if (originalEmailId) {
      try {
        const message = GmailApp.getMessageById(originalEmailId);
        if (message) {
          message.markRead();
          
          // Create or get a 'Quoted' label
          let quotedLabel = GmailApp.getUserLabelByName('Quoted');
          if (!quotedLabel) {
            quotedLabel = GmailApp.createLabel('Quoted');
          }
          
          // Add the label to the thread
          const thread = message.getThread();
          quotedLabel.addToThread(thread);
        }
      } catch (labelError) {
        console.error('Error handling original email:', labelError);
        // Continue even if labeling fails
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email sent successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error sending email: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Log quote data to Google Sheets
 */
function handleLogQuote(data) {
  try {
    // Configuration - Update these values with your specific sheet IDs
    const SPREADSHEET_ID = '1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456'; // Example ID, replace with actual
    const QUOTES_SHEET_NAME = 'Quotes';
    
    // Get or create the spreadsheet
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      // If the spreadsheet doesn't exist, create a new one
      spreadsheet = SpreadsheetApp.create('QuoteScribe Data');
      SPREADSHEET_ID = spreadsheet.getId();
    }
    
    // Get or create the quotes sheet
    let quotesSheet;
    try {
      quotesSheet = spreadsheet.getSheetByName(QUOTES_SHEET_NAME);
    } catch (e) {
      quotesSheet = spreadsheet.insertSheet(QUOTES_SHEET_NAME);
      
      // Set up the header row if this is a new sheet
      quotesSheet.appendRow([
        'Timestamp',
        'Customer Name',
        'Email Address',
        'Product',
        'Quantity',
        'Price Per Unit',
        'Total Amount',
        'Status'
      ]);
      
      // Format the header row
      quotesSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f3f3f3');
    }
    
    // Extract quote data
    const quoteData = data.quoteData;
    
    // Append the data to the sheet
    quotesSheet.appendRow([
      quoteData.timestamp,
      quoteData.customerName,
      quoteData.emailAddress,
      quoteData.product,
      quoteData.quantity,
      quoteData.pricePerUnit,
      quoteData.totalAmount,
      quoteData.status
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Quote logged successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error logging quote: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
