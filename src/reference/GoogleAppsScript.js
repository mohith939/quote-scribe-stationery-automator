
/**
 * Simplified Google Apps Script to fetch unread emails without marking them as read.
 * Deploy this as a web app and update the URL in your frontend service.
 */

// Handle GET requests
function doGet(e) {
  if (!e || !e.parameter) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'No parameters provided' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

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

// Get unread emails from Gmail inbox without marking them as read
function getUnreadEmails() {
  const threads = GmailApp.search('is:unread in:inbox'); // fetch all unread threads
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
