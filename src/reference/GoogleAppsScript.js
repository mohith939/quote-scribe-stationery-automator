
/**
 * Google Apps Script code to deploy as a web app
 * 
 * Once deployed, set the GOOGLE_APPS_SCRIPT_URL in gmailService.ts to the deployed URL
 * 
 * How to deploy:
 * 1. Go to https://script.google.com/ and create a new project
 * 2. Copy this code into the editor
 * 3. Click on Deploy > New deployment
 * 4. Select "Web app" as the deployment type
 * 5. Set "Execute as" to "Me"
 * 6. Set "Who has access" to "Anyone" (for testing) or "Anyone with Google account" (for production)
 * 7. Click Deploy
 * 8. Copy the web app URL and update GOOGLE_APPS_SCRIPT_URL in gmailService.ts
 */

// Handle incoming HTTP requests
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'fetchUnreadEmails') {
    return ContentService
      .createTextOutput(JSON.stringify({ emails: getUnreadEmails() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === 'markAsRead') {
    const result = markEmailAsRead(data.emailId);
    return ContentService
      .createTextOutput(JSON.stringify({ success: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } 
  else if (action === 'sendEmail') {
    const result = sendEmail(data.to, data.subject, data.body);
    return ContentService
      .createTextOutput(JSON.stringify({ success: result }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get unread emails from Gmail
function getUnreadEmails() {
  // Get unread messages in the inbox
  const threads = GmailApp.search('is:unread in:inbox', 0, 10);
  const emails = [];
  
  for (let i = 0; i < threads.length; i++) {
    const messages = threads[i].getMessages();
    
    for (let j = 0; j < messages.length; j++) {
      const message = messages[j];
      
      if (message.isUnread()) {
        emails.push({
          id: message.getId(),
          from: message.getFrom(),
          subject: message.getSubject(),
          body: message.getPlainBody(),
          date: message.getDate().toISOString()
        });
      }
    }
  }
  
  return emails;
}

// Mark an email as read
function markEmailAsRead(emailId) {
  try {
    const message = GmailApp.getMessageById(emailId);
    message.markRead();
    return true;
  } catch (error) {
    console.error('Error marking email as read:', error);
    return false;
  }
}

// Send an email
function sendEmail(to, subject, body) {
  try {
    GmailApp.sendEmail(to, subject, body, {
      htmlBody: body
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Log quote to Google Sheets
function logQuote(quoteData) {
  try {
    // Open the spreadsheet - replace with your spreadsheet ID
    const spreadsheetId = 'YOUR_SPREADSHEET_ID';
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Quotes') 
      || SpreadsheetApp.openById(spreadsheetId).insertSheet('Quotes');
    
    // Check if headers exist, add them if not
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 
        'Customer Name', 
        'Customer Email', 
        'Product', 
        'Quantity',
        'Total Amount',
        'Status'
      ]);
    }
    
    // Add the new quote data
    sheet.appendRow([
      new Date(),
      quoteData.customerName,
      quoteData.email,
      quoteData.product,
      quoteData.quantity,
      quoteData.totalAmount,
      quoteData.status
    ]);
    
    return true;
  } catch (error) {
    console.error('Error logging quote to spreadsheet:', error);
    return false;
  }
}
