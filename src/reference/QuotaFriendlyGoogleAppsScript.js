
/**
 * QUOTA-FRIENDLY Gmail Integration for QuoteScribe
 * Designed to handle large email volumes without hitting quota limits
 * 
 * Instructions:
 * 1. Go to script.google.com
 * 2. Create new project, paste this code
 * 3. Deploy as web app: "Execute as: Me", "Access: Anyone"
 * 4. Copy the web app URL to QuoteScribe
 */

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || 'getEmails';
  const maxEmails = parseInt(params.maxEmails) || 10; // Default to 10 to prevent quota issues
  
  try {
    switch (action.toLowerCase()) {
      case 'getemails':
      case 'getallunreademails':
        return getUnreadEmails(maxEmails);
      case 'testconnection':
        return testConnection();
      default:
        return jsonResponse({ 
          success: true, 
          message: 'QuoteScribe Gmail Integration Active',
          available_actions: ['getAllUnreadEmails', 'testConnection']
        });
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return jsonResponse({ 
      success: false, 
      error: error.toString(),
      stack: error.stack
    });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No POST data received');
    }
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'markAsRead':
        return markEmailAsRead(data.emailId);
      case 'sendEmail':
        return sendQuoteEmail(data.to, data.subject, data.body);
      case 'logQuote':
        return logQuoteToSheet(data.quoteData);
      default:
        return jsonResponse({
          success: false, 
          error: 'Unknown action: ' + action
        });
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return jsonResponse({
      success: false,
      error: 'Error processing request: ' + error.toString()
    });
  }
}

function getUnreadEmails(maxEmails) {
  try {
    const startTime = new Date().getTime();
    Logger.log('Starting to fetch up to ' + maxEmails + ' unread emails');
    
    // Use a more specific search to reduce processing time
    // Only get emails from the last 30 days to avoid processing thousands
    const searchQuery = 'is:unread in:inbox newer_than:30d';
    const threads = GmailApp.search(searchQuery, 0, Math.min(maxEmails * 2, 50)); // Get some extra threads in case some don't have unread messages
    const emails = [];
    
    Logger.log('Found ' + threads.length + ' threads to process');
    
    // Process threads until we have enough emails or run out of threads
    for (let i = 0; i < threads.length && emails.length < maxEmails; i++) {
      try {
        const messages = threads[i].getMessages();
        
        // Only process the latest few messages in each thread to save quota
        const messagesToCheck = Math.min(messages.length, 3);
        for (let j = messages.length - messagesToCheck; j < messages.length && emails.length < maxEmails; j++) {
          const msg = messages[j];
          if (msg.isUnread()) {
            try {
              const plainBody = msg.getPlainBody();
              
              emails.push({
                id: msg.getId(),
                from: msg.getFrom(),
                to: msg.getTo() || '',
                subject: msg.getSubject() || '(No subject)',
                body: plainBody,
                date: msg.getDate().toISOString(),
                threadId: threads[i].getId(),
                snippet: plainBody.substring(0, 150) + (plainBody.length > 150 ? '...' : ''),
                attachments: [], // Skip attachment processing to save quota
                hasAttachments: msg.getAttachments().length > 0
              });
            } catch (msgError) {
              Logger.log('Error processing message: ' + msgError.toString());
              // Continue processing other messages
            }
          }
        }
      } catch (threadError) {
        Logger.log('Error processing thread: ' + threadError.toString());
        // Continue processing other threads
      }
    }
    
    const endTime = new Date().getTime();
    const processingTime = endTime - startTime;
    
    Logger.log('Successfully processed ' + emails.length + ' emails in ' + processingTime + 'ms');
    
    return jsonResponse({
      success: true,
      emails: emails,
      count: emails.length,
      processing_time_ms: processingTime,
      threads_processed: threads.length,
      max_requested: maxEmails,
      timestamp: new Date().toISOString(),
      search_query: searchQuery
    });
    
  } catch (error) {
    Logger.log('Error in getUnreadEmails: ' + error.toString());
    return jsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack,
      emails: []
    });
  }
}

function testConnection() {
  try {
    const startTime = new Date().getTime();
    
    // Use a lightweight method to check connection
    const unreadCount = GmailApp.getInboxUnreadCount();
    
    const endTime = new Date().getTime();
    const processingTime = endTime - startTime;
    
    return jsonResponse({
      success: true,
      message: 'Gmail connection successful',
      unread_emails: unreadCount,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString(),
      quota_warning: unreadCount > 1000 ? 'Large number of unread emails detected. Consider using small fetch limits.' : null
    });
    
  } catch (error) {
    Logger.log('Error in testConnection: ' + error.toString());
    return jsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

function markEmailAsRead(emailId) {
  try {
    const message = GmailApp.getMessageById(emailId);
    message.markRead();
    
    return jsonResponse({
      success: true,
      message: 'Email marked as read'
    });
    
  } catch (error) {
    Logger.log('Error marking email as read: ' + error.toString());
    return jsonResponse({
      success: false,
      error: 'Failed to mark email as read: ' + error.toString()
    });
  }
}

function sendQuoteEmail(to, subject, body) {
  try {
    const signature = '\n\n---\nBest regards,\nQuoteScribe Team';
    const fullBody = body + signature;
    
    GmailApp.sendEmail(to, subject, fullBody);
    
    Logger.log('Email sent successfully to: ' + to);
    return jsonResponse({
      success: true,
      message: 'Email sent successfully'
    });
    
  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
    return jsonResponse({
      success: false,
      error: 'Failed to send email: ' + error.toString()
    });
  }
}

function logQuoteToSheet(quoteData) {
  try {
    // This would need a Sheet ID configured
    // For now, just log the action
    Logger.log('Quote logged: ' + JSON.stringify(quoteData));
    
    return jsonResponse({
      success: true,
      message: 'Quote logged successfully (to console - configure Sheet ID for actual logging)'
    });
    
  } catch (error) {
    Logger.log('Error logging quote: ' + error.toString());
    return jsonResponse({
      success: false,
      error: 'Failed to log quote: ' + error.toString()
    });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
