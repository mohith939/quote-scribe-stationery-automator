
/**
 * SIMPLE & FAST Gmail Integration for QuoteScribe
 * This version prioritizes speed and simplicity over advanced features
 * 
 * Instructions:
 * 1. Go to script.google.com
 * 2. Create new project, paste this code
 * 3. Deploy as web app: "Execute as: Me", "Access: Anyone"
 * 4. Copy the web app URL to QuoteScribe
 */

function doGet(e) {
  const action = e.parameter.action || 'getEmails';
  
  try {
    switch (action) {
      case 'getEmails':
      case 'getAllUnreadEmails':
        return getUnreadEmails();
      case 'testConnection':
        return testConnection();
      default:
        return jsonResponse({ success: true, message: 'QuoteScribe Integration Active' });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function getUnreadEmails() {
  try {
    // Get unread emails - simple and fast approach
    const threads = GmailApp.search('is:unread', 0, 50); // Limit to 50 for speed
    const emails = [];
    
    for (let i = 0; i < threads.length; i++) {
      const messages = threads[i].getMessages();
      
      for (let j = 0; j < messages.length; j++) {
        const msg = messages[j];
        if (msg.isUnread()) {
          emails.push({
            id: msg.getId(),
            from: msg.getFrom(),
            to: msg.getTo() || '',
            subject: msg.getSubject() || '',
            body: msg.getPlainBody() || '',
            date: msg.getDate().toISOString(),
            threadId: threads[i].getId(),
            snippet: (msg.getPlainBody() || '').substring(0, 150) + '...',
            attachments: [],
            hasAttachments: msg.getAttachments().length > 0
          });
        }
      }
      
      // Break early if we have enough emails
      if (emails.length >= 20) break;
    }
    
    return jsonResponse({
      success: true,
      emails: emails,
      count: emails.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.toString(),
      emails: []
    });
  }
}

function testConnection() {
  try {
    const threads = GmailApp.search('is:unread', 0, 5);
    let count = 0;
    
    for (let i = 0; i < threads.length; i++) {
      const messages = threads[i].getMessages();
      for (let j = 0; j < messages.length; j++) {
        if (messages[j].isUnread()) count++;
      }
    }
    
    return jsonResponse({
      success: true,
      message: 'Connection successful',
      emailCount: count,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
