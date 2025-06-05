
/**
 * FINAL COMPLETE Google Apps Script for QuoteScribe
 * This version handles CORS properly and includes all necessary functions
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Replace all code with this entire script
 * 4. Save the project (Ctrl+S)
 * 5. Click "Deploy" → "New deployment"
 * 6. Choose "Web app" as type
 * 7. Set "Execute as": Me (your@email.com)
 * 8. Set "Who has access": Anyone
 * 9. Click "Deploy"
 * 10. Copy the web app URL and use it in your app
 * 
 * IMPORTANT: After deployment, the script URL should work immediately
 */

// Configuration
const CONFIG = {
  maxEmailsToFetch: 50,
  enableDetailedLogging: true
};

/**
 * Handle GET requests - Main entry point
 */
function doGet(e) {
  // Log the incoming request
  console.log('doGet called with parameters:', e ? e.parameter : 'no parameters');
  
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'getAllUnreadEmails';
    
    console.log('Action requested:', action);
    
    switch (action) {
      case 'getAllUnreadEmails':
      case 'fetchUnreadEmails':
        const maxResults = parseInt(params.maxResults) || CONFIG.maxEmailsToFetch;
        return getAllUnreadEmails(maxResults);
      
      case 'testConnection':
        return testConnection();
      
      case 'markAsRead':
        return markEmailAsRead(params.emailId);
      
      default:
        return createJsonResponse({
          success: true,
          message: 'QuoteScribe Gmail Integration Active',
          timestamp: new Date().toISOString(),
          availableActions: ['getAllUnreadEmails', 'fetchUnreadEmails', 'testConnection', 'markAsRead']
        });
    }
  } catch (error) {
    console.error('doGet error:', error);
    return createJsonResponse({
      success: false,
      error: 'Request processing failed: ' + error.toString(),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  console.log('doPost called');
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No POST data received');
    }
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    console.log('POST action requested:', action);
    
    switch (action) {
      case 'markAsRead':
        return markEmailAsRead(data.emailId);
      
      case 'sendEmail':
        return sendQuoteEmail(data.to, data.subject, data.body);
      
      default:
        return createJsonResponse({
          success: false,
          error: 'Unknown POST action: ' + action
        });
    }
  } catch (error) {
    console.error('doPost error:', error);
    return createJsonResponse({
      success: false,
      error: 'POST request processing failed: ' + error.toString()
    });
  }
}

/**
 * Create properly formatted JSON response
 */
function createJsonResponse(data) {
  const jsonString = JSON.stringify(data, null, 2);
  console.log('Responding with:', jsonString.substring(0, 500) + (jsonString.length > 500 ? '...' : ''));
  
  return ContentService
    .createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get all unread emails from Gmail
 */
function getAllUnreadEmails(maxResults = CONFIG.maxEmailsToFetch) {
  console.log('=== STARTING EMAIL FETCH ===');
  console.log('Max results requested:', maxResults);
  
  try {
    // Search for unread emails in inbox
    const threads = GmailApp.search('is:unread in:inbox', 0, maxResults);
    console.log('Found threads:', threads.length);
    
    const emails = [];
    let processedCount = 0;
    
    // Process each thread
    for (let i = 0; i < threads.length; i++) {
      try {
        const thread = threads[i];
        const messages = thread.getMessages();
        
        console.log(`Processing thread ${i + 1}/${threads.length} with ${messages.length} messages`);
        
        // Process each message in the thread
        for (let j = 0; j < messages.length; j++) {
          const message = messages[j];
          
          // Only process unread messages
          if (message.isUnread()) {
            try {
              processedCount++;
              
              // Get basic message info
              const messageId = message.getId();
              const from = message.getFrom() || '';
              const to = message.getTo() || '';
              const subject = message.getSubject() || '';
              const plainBody = message.getPlainBody() || '';
              const htmlBody = message.getBody() || '';
              const date = message.getDate();
              const threadId = thread.getId();
              
              // Get attachment info
              const attachments = message.getAttachments();
              const attachmentInfo = [];
              
              for (let k = 0; k < attachments.length; k++) {
                const attachment = attachments[k];
                attachmentInfo.push({
                  name: attachment.getName(),
                  type: attachment.getContentType(),
                  size: attachment.getSize()
                });
              }
              
              // Enhanced quote detection
              const isQuoteRequest = detectQuoteRequest(plainBody + ' ' + subject);
              const detectedProducts = detectProducts(plainBody + ' ' + subject);
              const quantities = detectQuantities(plainBody);
              const confidence = calculateConfidence(isQuoteRequest, detectedProducts, quantities);
              
              // Create email object
              const emailObj = {
                id: messageId,
                from: from,
                to: to,
                subject: subject,
                body: plainBody,
                htmlBody: htmlBody,
                date: date.toISOString(),
                threadId: threadId,
                snippet: plainBody.substring(0, 200) + (plainBody.length > 200 ? '...' : ''),
                attachments: attachmentInfo,
                hasAttachments: attachments.length > 0,
                // Enhanced fields for quote processing
                isQuoteRequest: isQuoteRequest,
                products: detectedProducts,
                quantities: quantities,
                confidence: confidence,
                processingStatus: isQuoteRequest ? 'pending' : 'non_quote',
                category: isQuoteRequest ? 'quote_request' : 'general',
                processingConfidence: confidence
              };
              
              emails.push(emailObj);
              
              if (CONFIG.enableDetailedLogging) {
                console.log(`Processed email ${processedCount}: ${subject.substring(0, 50)}${subject.length > 50 ? '...' : ''}`);
              }
              
            } catch (messageError) {
              console.error(`Error processing message ${j} in thread ${i}:`, messageError);
            }
          }
        }
      } catch (threadError) {
        console.error(`Error processing thread ${i}:`, threadError);
      }
    }
    
    console.log('=== EMAIL FETCH COMPLETE ===');
    console.log(`Total emails found: ${emails.length}`);
    console.log(`Threads processed: ${threads.length}`);
    console.log(`Messages processed: ${processedCount}`);
    
    const response = {
      success: true,
      emails: emails,
      timestamp: new Date().toISOString(),
      totalCount: emails.length,
      threadsProcessed: threads.length,
      messagesProcessed: processedCount,
      hasMoreEmails: threads.length >= maxResults,
      debugInfo: {
        searchQuery: 'is:unread in:inbox',
        maxResults: maxResults,
        actualResults: emails.length,
        timestamp: new Date().toISOString()
      }
    };
    
    return createJsonResponse(response);
    
  } catch (error) {
    console.error('FATAL ERROR in getAllUnreadEmails:', error);
    return createJsonResponse({
      success: false,
      error: 'Failed to fetch emails: ' + error.toString(),
      emails: [],
      timestamp: new Date().toISOString(),
      debugInfo: {
        errorType: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      }
    });
  }
}

/**
 * Enhanced quote detection
 */
function detectQuoteRequest(text) {
  if (!text) return false;
  
  const keywords = [
    'quote', 'quotation', 'pricing', 'price', 'cost', 'estimate',
    'how much', 'inquiry', 'enquiry', 'interested in', 'purchase',
    'buy', 'order', 'supply', 'provide', 'need', 'require',
    'zta-500n', 'digital force gauge', 'glass thermometer', 'zero plate'
  ];
  
  const lowerText = text.toLowerCase();
  
  for (let i = 0; i < keywords.length; i++) {
    if (lowerText.indexOf(keywords[i]) !== -1) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect products mentioned in email
 */
function detectProducts(text) {
  if (!text) return [];
  
  const products = [
    { name: 'ZTA-500N Digital Force Gauge', keywords: ['zta-500n', 'digital force gauge', 'force gauge'] },
    { name: 'Glass Thermometer', keywords: ['glass thermometer', 'thermometer', 'zeal england'] },
    { name: 'Zero Plate Non-Ferrous', keywords: ['zero plate non-ferrous', 'non-ferrous'] },
    { name: 'Zero Plate Ferrous', keywords: ['zero plate ferrous', 'ferrous'] },
    { name: 'Metallic Plate', keywords: ['metallic plate', 'zero microns'] }
  ];
  
  const lowerText = text.toLowerCase();
  const detectedProducts = [];
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    for (let j = 0; j < product.keywords.length; j++) {
      if (lowerText.indexOf(product.keywords[j]) !== -1) {
        detectedProducts.push(product.name);
        break;
      }
    }
  }
  
  return detectedProducts;
}

/**
 * Detect quantities in email text
 */
function detectQuantities(text) {
  if (!text) return [];
  
  const quantities = [];
  const regex = /(\d+)\s*(pieces?|pcs?|units?|sheets?)/gi;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    quantities.push({
      quantity: parseInt(match[1]),
      unit: match[2].toLowerCase()
    });
  }
  
  return quantities;
}

/**
 * Calculate confidence level for quote detection
 */
function calculateConfidence(isQuoteRequest, products, quantities) {
  if (!isQuoteRequest) return 'none';
  
  if (products.length > 0 && quantities.length > 0) {
    return 'high';
  } else if (products.length > 0 || quantities.length > 0) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Test Gmail connection
 */
function testConnection() {
  console.log('=== TESTING CONNECTION ===');
  
  try {
    // Test basic Gmail access
    const threads = GmailApp.search('is:unread in:inbox', 0, 5);
    let unreadCount = 0;
    
    console.log(`Found ${threads.length} threads for testing`);
    
    for (let i = 0; i < threads.length; i++) {
      const messages = threads[i].getMessages();
      for (let j = 0; j < messages.length; j++) {
        if (messages[j].isUnread()) {
          unreadCount++;
        }
      }
    }
    
    console.log(`Total unread emails: ${unreadCount}`);
    
    const response = {
      success: true,
      message: 'Gmail connection successful',
      emailCount: unreadCount,
      threadsFound: threads.length,
      timestamp: new Date().toISOString(),
      permissions: {
        gmail: true,
        canReadEmails: true,
        canSendEmails: true
      },
      config: {
        maxEmailsToFetch: CONFIG.maxEmailsToFetch,
        detailedLogging: CONFIG.enableDetailedLogging
      }
    };
    
    console.log('Test connection successful:', response);
    return createJsonResponse(response);
    
  } catch (error) {
    console.error('Connection test FAILED:', error);
    return createJsonResponse({
      success: false,
      error: 'Connection test failed: ' + error.toString(),
      timestamp: new Date().toISOString(),
      debugInfo: {
        errorType: error.name,
        errorMessage: error.message
      }
    });
  }
}

/**
 * Mark email as read
 */
function markEmailAsRead(emailId) {
  console.log('Marking email as read:', emailId);
  
  try {
    if (!emailId) {
      throw new Error('Email ID is required');
    }
    
    const message = GmailApp.getMessageById(emailId);
    message.markRead();
    
    console.log('Email marked as read successfully');
    return createJsonResponse({
      success: true,
      message: 'Email marked as read successfully',
      emailId: emailId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error marking email as read:', error);
    return createJsonResponse({
      success: false,
      error: 'Failed to mark email as read: ' + error.toString(),
      emailId: emailId
    });
  }
}

/**
 * Send quote email
 */
function sendQuoteEmail(to, subject, body) {
  console.log('Sending email to:', to);
  
  try {
    if (!to || !subject || !body) {
      throw new Error('To, subject, and body are required');
    }
    
    // Send the email
    GmailApp.sendEmail(to, subject, '', {
      htmlBody: body
    });
    
    console.log('Email sent successfully to:', to);
    return createJsonResponse({
      success: true,
      message: 'Email sent successfully',
      to: to,
      subject: subject,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error sending email:', error);
    return createJsonResponse({
      success: false,
      error: 'Failed to send email: ' + error.toString(),
      to: to
    });
  }
}

/**
 * Logger utility for debugging
 */
function logInfo(message) {
  if (CONFIG.enableDetailedLogging) {
    console.log('[INFO]', message);
  }
}

function logError(message, error) {
  console.error('[ERROR]', message, error);
}
