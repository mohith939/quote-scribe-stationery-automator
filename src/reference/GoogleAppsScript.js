
/**
 * Simplified Google Apps Script to fetch unread emails without marking them as read.
 * Deploy this as a web app and update the URL in your frontend service.
 */

// Handle GET requests
function doGet(e) {
  // Add CORS headers
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  if (!e || !e.parameter) {
    return output.setContent(JSON.stringify({ error: 'No parameters provided' }));
  }

  const action = e.parameter.action;
  
  if (action === 'fetchUnreadEmails') {
    return output.setContent(JSON.stringify({ emails: getUnreadEmails() }));
  }
  
  return output.setContent(JSON.stringify({ error: 'Invalid action' }));
}

// Handle POST requests (for CORS preflight)
function doPost(e) {
  return doGet(e);
}

// Get unread emails from Gmail inbox without marking them as read
function getUnreadEmails() {
  try {
    const threads = GmailApp.search('is:unread in:inbox', 0, 50); // limit to 50 threads for performance
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
            body: message.getPlainBody().substring(0, 500), // limit body length
            date: message.getDate().toISOString()
          });
        }
      }
    }
    
    return emails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    return [];
  }
}
