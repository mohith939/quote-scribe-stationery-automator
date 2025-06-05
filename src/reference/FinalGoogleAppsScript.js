
/**
 * FINAL Google Apps Script - Simple Email Fetcher with CORS Support
 * This fetches ALL unread emails without any configuration
 * Deploy as web app with "Execute as: Me" and "Access: Anyone"
 */

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'getAllUnreadEmails';
    
    if (action === 'getAllUnreadEmails' || action === 'fetchUnreadEmails') {
      return getAllUnreadEmails();
    }
    
    if (action === 'testConnection') {
      return testConnection();
    }
    
    return createCorsResponse({
      success: true,
      message: 'Gmail Integration Active',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return createCorsResponse({
      success: false,
      error: error.toString()
    });
  }
}

function doPost(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'getAllUnreadEmails';
    
    if (action === 'getAllUnreadEmails' || action === 'fetchUnreadEmails') {
      return getAllUnreadEmails();
    }
    
    if (action === 'testConnection') {
      return testConnection();
    }
    
    return createCorsResponse({
      success: true,
      message: 'Gmail Integration Active',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return createCorsResponse({
      success: false,
      error: error.toString()
    });
  }
}

function createCorsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  output.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  });
  
  return output;
}

function getAllUnreadEmails() {
  try {
    // Get ALL unread emails from Gmail
    const threads = GmailApp.search('is:unread');
    const emails = [];
    
    for (let i = 0; i < threads.length; i++) {
      const messages = threads[i].getMessages();
      
      for (let j = 0; j < messages.length; j++) {
        const message = messages[j];
        
        if (message.isUnread()) {
          try {
            // Get attachments info
            const attachments = message.getAttachments();
            const attachmentInfo = [];
            
            for (let k = 0; k < attachments.length; k++) {
              attachmentInfo.push({
                name: attachments[k].getName(),
                type: attachments[k].getContentType(),
                size: attachments[k].getSize()
              });
            }
            
            emails.push({
              id: message.getId(),
              from: message.getFrom(),
              to: message.getTo(),
              subject: message.getSubject(),
              body: message.getPlainBody(),
              htmlBody: message.getBody(),
              date: message.getDate().toISOString(),
              threadId: threads[i].getId(),
              attachments: attachmentInfo,
              hasAttachments: attachments.length > 0,
              snippet: message.getPlainBody().substring(0, 200)
            });
          } catch (messageError) {
            console.log('Error processing message: ' + messageError.toString());
          }
        }
      }
    }
    
    return createCorsResponse({
      success: true,
      emails: emails,
      timestamp: new Date().toISOString(),
      totalCount: emails.length
    });
    
  } catch (error) {
    return createCorsResponse({
      success: false,
      error: 'Failed to fetch emails: ' + error.toString(),
      emails: []
    });
  }
}

function testConnection() {
  try {
    const threads = GmailApp.search('is:unread', 0, 5);
    let unreadCount = 0;
    
    for (let i = 0; i < threads.length; i++) {
      const messages = threads[i].getMessages();
      for (let j = 0; j < messages.length; j++) {
        if (messages[j].isUnread()) {
          unreadCount++;
        }
      }
    }
    
    return createCorsResponse({
      success: true,
      message: 'Connection successful',
      emailCount: unreadCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return createCorsResponse({
      success: false,
      error: 'Connection test failed: ' + error.toString()
    });
  }
}
