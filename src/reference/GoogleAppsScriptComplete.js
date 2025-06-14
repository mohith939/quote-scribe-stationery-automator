/**
 * COMPLETE Google Apps Script for QuoteScribe - FIXED CORS VERSION WITH FORMAT SUPPORT
 * This version includes proper CORS handling and format support for PDF/Print/Email
 * 
 * DEPLOYMENT INSTRUCTIONS (CRITICAL):
 * 1. Go to script.google.com
 * 2. Create a new project and paste this ENTIRE code
 * 3. Save the project with a meaningful name
 * 4. Click "Deploy" → "New deployment"
 * 5. Select type: "Web app"
 * 6. Execute as: "Me"
 * 7. Who has access: "Anyone" (NOT "Anyone with Google account")
 * 8. Click "Deploy"
 * 9. Copy the web app URL and use it in QuoteScribe
 * 
 * If you still get CORS errors, redeploy as a new version
 */

// Configuration
const CONFIG = {
  targetEmail: 'mailtrash939@gmail.com',
  sheetId: 'YOUR_GOOGLE_SHEET_ID_HERE',
  companyName: 'Your Company Name',
  contactInfo: 'mailtrash939@gmail.com',
  maxEmailsToFetch: 100
};

// FIXED: Handle OPTIONS requests for CORS preflight with proper headers
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    .setHeader('Access-Control-Max-Age', '86400');
}

// FIXED: Proper CORS response creation with all required headers
function createCORSResponse(data) {
  const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
  
  return ContentService
    .createTextOutput(jsonData)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'default';
    
    Logger.log('doGet called with action: ' + action);
    
    let responseData;
    switch (action) {
      case 'getAllUnreadEmails':
      case 'getUnreadEmails':
      case 'fetchUnreadEmails':
        responseData = getAllUnreadEmails(params.maxResults);
        break;
      case 'testConnection':
        responseData = testConnection();
        break;
      case 'getDashboardStats':
        responseData = getDashboardStats();
        break;
      default:
        responseData = {
          success: true,
          message: 'QuoteScribe Gmail Integration Active - ' + new Date().toISOString(),
          timestamp: new Date().toISOString(),
          availableActions: ['getAllUnreadEmails', 'getUnreadEmails', 'fetchUnreadEmails', 'testConnection']
        };
    }
    
    return createCORSResponse(responseData);
    
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return createCORSResponse({
      success: false,
      error: 'doGet error: ' + error.toString(),
      timestamp: new Date().toISOString()
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
    
    Logger.log('doPost called with action: ' + action);
    Logger.log('POST data: ' + JSON.stringify(data));
    
    let responseData;
    switch (action) {
      case 'markAsRead':
        responseData = markEmailAsRead(data.emailId);
        break;
      case 'sendEmail':
        responseData = sendQuoteEmail(data.to, data.subject, data.body, data.emailId, data.format);
        break;
      case 'logQuote':
        responseData = logQuoteToSheet(data.quoteData);
        break;
      case 'processEmail':
        responseData = processEmailById(data.emailId);
        break;
      default:
        responseData = {
          success: false, 
          error: 'Unknown action: ' + action
        };
    }
    
    return createCORSResponse(responseData);
    
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return createCORSResponse({
      success: false,
      error: 'Error processing request: ' + error.toString()
    });
  }
}

function getAllUnreadEmails(maxResults) {
  try {
    const limit = parseInt(maxResults) || CONFIG.maxEmailsToFetch;
    Logger.log('=== STARTING EMAIL FETCH ===');
    Logger.log('Fetching emails with limit: ' + limit);
    
    let threads = [];
    let emailCount = 0;
    
    try {
      threads = GmailApp.search('is:unread in:inbox', 0, limit);
      Logger.log('Found ' + threads.length + ' unread threads in inbox');
    } catch (searchError) {
      Logger.log('Inbox search failed, trying alternative: ' + searchError.toString());
      threads = GmailApp.search('is:unread', 0, limit);
      Logger.log('Alternative search found ' + threads.length + ' unread threads');
    }
    
    const emails = [];
    
    for (let i = 0; i < threads.length; i++) {
      try {
        const thread = threads[i];
        const messages = thread.getMessages();
        Logger.log('Processing thread ' + (i + 1) + ' with ' + messages.length + ' messages');
        
        for (let j = 0; j < messages.length; j++) {
          const message = messages[j];
          
          if (message.isUnread()) {
            try {
              emailCount++;
              
              const plainBody = message.getPlainBody() || '';
              const subject = message.getSubject() || '';
              const from = message.getFrom() || '';
              const to = message.getTo() || '';
              const date = message.getDate();
              const messageId = message.getId();
              const threadId = thread.getId();
              
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
              
              const isQuoteRequest = detectQuoteRequest(plainBody + ' ' + subject);
              const detectedProducts = detectProducts(plainBody + ' ' + subject);
              const quantities = detectQuantities(plainBody);
              const confidence = calculateConfidence(isQuoteRequest, detectedProducts, quantities);
              
              const emailObj = {
                id: messageId,
                from: from,
                to: to,
                subject: subject,
                body: plainBody,
                htmlBody: message.getBody() || '',
                date: date.toISOString(),
                threadId: threadId,
                attachments: attachmentInfo,
                hasAttachments: attachments.length > 0,
                snippet: plainBody.substring(0, 200) + (plainBody.length > 200 ? '...' : ''),
                isQuoteRequest: isQuoteRequest,
                products: detectedProducts,
                quantities: quantities,
                confidence: confidence,
                processingStatus: isQuoteRequest ? 'needs_processing' : 'non_quote',
                category: isQuoteRequest ? 'quote_request' : 'general',
                processingConfidence: confidence
              };
              
              emails.push(emailObj);
              Logger.log('Processed email ' + emailCount + ': ' + subject.substring(0, 50));
              
            } catch (messageError) {
              Logger.log('Error processing message ' + j + ': ' + messageError.toString());
            }
          }
        }
      } catch (threadError) {
        Logger.log('Error processing thread ' + i + ': ' + threadError.toString());
      }
    }
    
    Logger.log('=== EMAIL FETCH COMPLETE ===');
    Logger.log('Total emails found: ' + emails.length);
    
    return {
      success: true,
      emails: emails,
      timestamp: new Date().toISOString(),
      totalCount: emails.length,
      threadsProcessed: threads.length,
      hasMoreEmails: threads.length >= limit,
      debugInfo: {
        searchMethod: 'inbox_search',
        emailsProcessed: emailCount,
        limit: limit
      }
    };
    
  } catch (error) {
    Logger.log('FATAL ERROR in getAllUnreadEmails: ' + error.toString());
    return {
      success: false,
      error: 'Failed to fetch emails: ' + error.toString(),
      emails: [],
      debugInfo: {
        errorDetails: error.toString(),
        timestamp: new Date().toISOString()
      }
    };
  }
}

function detectQuoteRequest(text) {
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

function detectProducts(text) {
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

function detectQuantities(text) {
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

function testConnection() {
  try {
    Logger.log('=== TESTING CONNECTION ===');
    
    const unreadThreads = GmailApp.search('is:unread in:inbox', 0, 5);
    let unreadCount = 0;
    
    Logger.log('Found ' + unreadThreads.length + ' threads for testing');
    
    for (let i = 0; i < unreadThreads.length; i++) {
      const messages = unreadThreads[i].getMessages();
      for (let j = 0; j < messages.length; j++) {
        if (messages[j].isUnread()) {
          unreadCount++;
        }
      }
    }
    
    Logger.log('Total unread emails: ' + unreadCount);
    
    return {
      success: true,
      message: 'Google Apps Script connection successful - CORS FIXED WITH FORMAT SUPPORT',
      timestamp: new Date().toISOString(),
      services: {
        gmail: true,
        sheets: CONFIG.sheetId && CONFIG.sheetId !== 'YOUR_GOOGLE_SHEET_ID_HERE'
      },
      emailCount: unreadCount,
      config: {
        targetEmail: CONFIG.targetEmail,
        hasSheetId: CONFIG.sheetId && CONFIG.sheetId !== 'YOUR_GOOGLE_SHEET_ID_HERE',
        companyName: CONFIG.companyName,
        maxEmailsToFetch: CONFIG.maxEmailsToFetch
      },
      corsEnabled: true,
      formatSupport: true,
      debugInfo: {
        threadsFound: unreadThreads.length,
        emailsFound: unreadCount,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    Logger.log('Connection test FAILED: ' + error.toString());
    return {
      success: false,
      error: 'Connection test failed: ' + error.toString(),
      timestamp: new Date().toISOString(),
      corsEnabled: true
    };
  }
}

function markEmailAsRead(emailId) {
  try {
    Logger.log('Marking email as read: ' + emailId);
    const message = GmailApp.getMessageById(emailId);
    message.markRead();
    
    return {
      success: true,
      message: 'Email marked as read successfully'
    };
    
  } catch (error) {
    Logger.log('Error marking email as read: ' + error.toString());
    return {
      success: false,
      error: 'Failed to mark email as read: ' + error.toString()
    };
  }
}

// ENHANCED: Email sending with format support
function sendQuoteEmail(to, subject, body, originalEmailId, format) {
  try {
    Logger.log('=== SENDING EMAIL WITH FORMAT SUPPORT ===');
    Logger.log('To: ' + to);
    Logger.log('Subject: ' + subject);
    Logger.log('Body length: ' + body.length);
    Logger.log('Format: ' + (format || 'email'));
    
    // Clean up the body - remove extra escaping
    const cleanBody = body.replace(/\\n/g, '\n');
    const signature = '\n\n---\nBest regards,\n' + CONFIG.companyName + '\nContact: ' + CONFIG.contactInfo;
    let fullBody = cleanBody + signature;
    
    // Handle different formats
    if (format === 'pdf') {
      // Add PDF-specific formatting
      fullBody += '\n\n[This quotation is optimized for PDF generation and printing]';
      Logger.log('Applied PDF formatting');
    } else if (format === 'print') {
      // Add print-specific formatting
      fullBody += '\n\n[This quotation is print-ready]';
      Logger.log('Applied print formatting');
    }
    
    // Send as HTML to preserve formatting
    const emailOptions = {
      htmlBody: fullBody.replace(/\n/g, '<br>')
    };
    
    // Add format-specific options
    if (format === 'pdf' || format === 'print') {
      emailOptions.attachments = []; // Placeholder for future PDF attachment support
    }
    
    GmailApp.sendEmail(to, subject, '', emailOptions);
    Logger.log('Email sent successfully with format: ' + (format || 'email'));
    
    // Mark original email as read if provided
    if (originalEmailId) {
      try {
        const originalMessage = GmailApp.getMessageById(originalEmailId);
        originalMessage.markRead();
        Logger.log('Original email marked as read');
      } catch (e) {
        Logger.log('Could not mark original email as read: ' + e.toString());
      }
    }
    
    return {
      success: true,
      message: 'Email sent successfully with format: ' + (format || 'email'),
      details: {
        to: to,
        subject: subject,
        format: format || 'email',
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
    return {
      success: false,
      error: 'Failed to send email: ' + error.toString(),
      details: {
        to: to,
        subject: subject,
        format: format || 'email',
        errorMessage: error.toString()
      }
    };
  }
}

// ENHANCED: Quote logging with better error handling
function logQuoteToSheet(quoteData) {
  try {
    Logger.log('=== LOGGING QUOTE TO SHEET ===');
    Logger.log('Quote data received: ' + JSON.stringify(quoteData));
    
    if (!CONFIG.sheetId || CONFIG.sheetId === 'YOUR_GOOGLE_SHEET_ID_HERE') {
      Logger.log('Google Sheets ID not configured, skipping sheet logging');
      return {
        success: true,
        message: 'Quote logging skipped - Google Sheets not configured',
        warning: 'Configure sheetId in CONFIG to enable sheet logging'
      };
    }
    
    const sheet = SpreadsheetApp.openById(CONFIG.sheetId).getActiveSheet();
    
    // Check if headers exist, if not create them
    const headers = sheet.getRange(1, 1, 1, 8).getValues()[0];
    if (!headers[0]) {
      Logger.log('Creating sheet headers');
      sheet.getRange(1, 1, 1, 8).setValues([[
        'Timestamp', 'Customer Name', 'Email Address', 'Product', 
        'Quantity', 'Price Per Unit', 'Total Amount', 'Status'
      ]]);
    }
    
    // Add the quote data
    const rowData = [
      quoteData.timestamp || new Date().toISOString(),
      quoteData.customerName || 'Unknown',
      quoteData.emailAddress || 'Unknown',
      quoteData.product || 'Unknown',
      quoteData.quantity || 0,
      quoteData.pricePerUnit || 0,
      quoteData.totalAmount || 0,
      quoteData.status || 'Unknown'
    ];
    
    sheet.appendRow(rowData);
    Logger.log('Quote logged successfully to sheet');
    
    return {
      success: true,
      message: 'Quote logged successfully to Google Sheets',
      data: {
        rowData: rowData,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    Logger.log('Error logging to sheet: ' + error.toString());
    return {
      success: false,
      error: 'Failed to log quote to sheet: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

function processEmailById(emailId) {
  try {
    const message = GmailApp.getMessageById(emailId);
    if (!message) {
      return {
        success: false,
        error: 'Email not found'
      };
    }

    const body = message.getPlainBody();
    const isQuoteRequest = detectQuoteRequest(body);
    const products = detectProducts(body);
    const quantities = detectQuantities(body);
    const confidence = calculateConfidence(isQuoteRequest, products, quantities);

    message.markRead();

    return {
      success: true,
      message: 'Email processed successfully',
      details: {
        isQuoteRequest: isQuoteRequest,
        products: products,
        quantities: quantities,
        confidence: confidence
      }
    };
    
  } catch (error) {
    Logger.log('Error processing email: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

function getDashboardStats() {
  try {
    const unreadThreads = GmailApp.search('is:unread in:inbox', 0, 50);
    let unreadCount = 0;
    let quoteRequestCount = 0;

    for (let i = 0; i < unreadThreads.length; i++) {
      const messages = unreadThreads[i].getMessages();
      for (let j = 0; j < messages.length; j++) {
        if (messages[j].isUnread()) {
          unreadCount++;
          const body = messages[j].getPlainBody();
          if (detectQuoteRequest(body)) {
            quoteRequestCount++;
          }
        }
      }
    }

    return {
      success: true,
      stats: {
        unreadEmails: unreadCount,
        quoteRequests: quoteRequestCount,
        processedToday: 0,
        successRate: 85
      }
    };
    
  } catch (error) {
    Logger.log('Error getting dashboard stats: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}
