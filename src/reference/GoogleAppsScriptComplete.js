
/**
 * Complete Gmail Integration Script for QuoteScribe - FINAL VERSION
 * This combines enhanced email fetching with quote detection and processing
 * 
 * Instructions:
 * 1. Go to script.google.com
 * 2. Create a new project and paste this code
 * 3. Update the CONFIG section below with your details
 * 4. Deploy as a web app with "Execute as: Me" and "Access: Anyone"
 * 5. Copy the web app URL and paste it in QuoteScribe settings
 */

// Your configuration - UPDATE THESE VALUES
const CONFIG = {
  targetEmail: 'mailtrash939@gmail.com',
  sheetId: 'YOUR_GOOGLE_SHEET_ID_HERE', // Replace with your Google Sheets ID
  companyName: 'Your Company Name',
  contactInfo: 'mailtrash939@gmail.com',
  maxEmailsToFetch: 500 // Increased limit to fetch more emails
};

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'default';
    
    switch (action) {
      case 'getEmails':
      case 'getUnreadEmails':
      case 'getAllUnreadEmails':
        return getAllUnreadEmails(params.maxResults);
      case 'testConnection':
        return testConnection();
      case 'markAsRead':
        return markEmailAsRead(params.emailId);
      case 'sendEmail':
        return sendQuoteEmail(params.to, params.subject, params.body, params.emailId);
      case 'logQuote':
        return logQuoteToSheet(JSON.parse(params.quoteData || '{}'));
      case 'processEmail':
        return processEmailById(params.emailId);
      case 'getDashboardStats':
        return getDashboardStats();
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'QuoteScribe Gmail Integration Active - ' + new Date().toISOString(),
          timestamp: new Date().toISOString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'doGet error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
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
        return sendQuoteEmail(data.to, data.subject, data.body, data.emailId);
      case 'logQuote':
        return logQuoteToSheet(data.quoteData);
      case 'processEmail':
        return processEmailById(data.emailId);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false, 
          error: 'Unknown action: ' + action
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error processing request: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllUnreadEmails(maxResults) {
  try {
    const limit = parseInt(maxResults) || CONFIG.maxEmailsToFetch;
    Logger.log('Fetching ALL unread emails with limit: ' + limit);
    
    // Search for ALL unread emails in the inbox (removed target email restriction)
    const threads = GmailApp.search('is:unread in:inbox', 0, limit);
    const emails = [];
    
    Logger.log('Found ' + threads.length + ' unread threads');
    
    threads.forEach(function(thread, threadIndex) {
      try {
        const messages = thread.getMessages();
        
        // Process all unread messages in each thread
        messages.forEach(function(message, messageIndex) {
          if (message.isUnread()) {
            try {
              // Get attachments info
              const attachments = message.getAttachments();
              const attachmentInfo = attachments.map(function(attachment) {
                return {
                  name: attachment.getName(),
                  type: attachment.getContentType(),
                  size: attachment.getSize()
                };
              });
              
              // Get both plain and HTML body
              const plainBody = message.getPlainBody();
              const htmlBody = message.getBody();
              
              // Enhanced quote detection and processing
              const isQuoteRequest = detectQuoteRequest(plainBody);
              const detectedProducts = detectProducts(plainBody);
              const quantities = detectQuantities(plainBody);
              const confidence = calculateConfidence(isQuoteRequest, detectedProducts, quantities);
              
              // Determine processing status
              let processingStatus = 'pending';
              if (isQuoteRequest) {
                if (confidence === 'high') {
                  processingStatus = 'processed_automatically';
                } else if (confidence === 'medium' || confidence === 'low') {
                  processingStatus = 'needs_manual_processing';
                }
              } else {
                processingStatus = 'non_quote_message';
              }
              
              // Determine category
              const category = isQuoteRequest ? 'quote_request' : 
                              (confidence === 'none' ? 'pending_classification' : 'non_quote_message');
              
              emails.push({
                id: message.getId(),
                from: message.getFrom(),
                to: message.getTo(),
                subject: message.getSubject(),
                body: plainBody,
                htmlBody: htmlBody,
                date: message.getDate().toISOString(),
                threadId: message.getThread().getId(),
                attachments: attachmentInfo,
                hasAttachments: attachments.length > 0,
                snippet: plainBody.substring(0, 200) + '...',
                // Enhanced fields from quote detection
                isQuoteRequest: isQuoteRequest,
                products: detectedProducts,
                quantities: quantities,
                confidence: confidence,
                processingStatus: processingStatus,
                category: category,
                processingConfidence: confidence
              });
            } catch (msgError) {
              Logger.log('Error processing message ' + messageIndex + ' in thread ' + threadIndex + ': ' + msgError.toString());
            }
          }
        });
      } catch (threadError) {
        Logger.log('Error processing thread ' + threadIndex + ': ' + threadError.toString());
      }
    });
    
    Logger.log('Successfully processed ' + emails.length + ' unread emails');
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      emails: emails,
      timestamp: new Date().toISOString(),
      totalCount: emails.length,
      threadsProcessed: threads.length,
      hasMoreEmails: threads.length >= limit
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error fetching emails: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Failed to fetch emails: ' + error.toString(),
      emails: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to detect if an email is a quote request
function detectQuoteRequest(emailBody) {
  const keywords = [
    'quote', 'pricing', 'cost', 'price', 'estimate', 'quotation',
    'how much', 'inquiry', 'enquiry', 'interested in', 'purchase',
    'buy', 'order', 'supply', 'provide', 'zta-500n', 'digital force gauge',
    'glass thermometer', 'zero plate', 'metallic plate'
  ];
  const bodyLower = emailBody.toLowerCase();

  for (let i = 0; i < keywords.length; i++) {
    if (bodyLower.indexOf(keywords[i]) !== -1) {
      return true;
    }
  }

  return false;
}

// Function to detect products mentioned in the email
function detectProducts(emailBody) {
  const products = [
    { name: 'ZTA-500N Digital Force Gauge', keywords: ['zta-500n', 'digital force gauge', 'force gauge'] },
    { name: 'Zeal England Glass Thermometer Range : 10 Deg C -110 Deg C', keywords: ['glass thermometer', 'zeal england', 'thermometer'] },
    { name: 'zero plate Non-Ferrous', keywords: ['zero plate non-ferrous', 'non-ferrous plate'] },
    { name: 'zero plate Ferrous', keywords: ['zero plate ferrous', 'ferrous plate'] },
    { name: 'Zero microns metallic plate', keywords: ['metallic plate', 'zero microns', 'zero micron'] },
    { name: 'A4 Paper', keywords: ['a4', 'paper', 'sheet', 'sheets'] },
    { name: 'Ballpoint Pens', keywords: ['pen', 'pens', 'ballpoint'] },
    { name: 'Notebooks', keywords: ['notebook', 'notepad', 'spiral'] },
    { name: 'Staplers', keywords: ['stapler', 'staplers', 'staple'] },
    { name: 'Whiteboard Markers', keywords: ['marker', 'markers', 'whiteboard'] },
    { name: 'Sticky Notes', keywords: ['sticky', 'post-it', 'notes'] }
  ];

  const bodyLower = emailBody.toLowerCase();
  const detectedProducts = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    for (let j = 0; j < product.keywords.length; j++) {
      if (bodyLower.indexOf(product.keywords[j]) !== -1) {
        detectedProducts.push(product.name);
        break;
      }
    }
  }

  return detectedProducts;
}

// Function to detect quantities in the email
function detectQuantities(emailBody) {
  const quantities = [];
  const regex = /(\d+)\s*(sheets?|pcs?|pieces?|units?|boxes?|packs?|dozens?|reams?)/gi;
  let match;

  while ((match = regex.exec(emailBody)) !== null) {
    quantities.push({
      quantity: parseInt(match[1]),
      unit: match[2].toLowerCase()
    });
  }

  // Also look for standalone numbers
  const numberRegex = /\b(\d+)\b/g;
  while ((match = numberRegex.exec(emailBody)) !== null) {
    const number = parseInt(match[1]);
    if (number > 0 && number < 10000) { // Reasonable quantity range
      quantities.push({
        quantity: number,
        unit: 'units'
      });
    }
  }

  return quantities;
}

// Calculate confidence level for auto-processing
function calculateConfidence(isQuoteRequest, products, quantities) {
  if (!isQuoteRequest) {
    return 'none';
  }

  if (products.length > 0 && quantities.length > 0) {
    return 'high';
  } else if (products.length > 0 || quantities.length > 0) {
    return 'medium';
  } else {
    return 'low';
  }
}

function markEmailAsRead(emailId) {
  try {
    const message = GmailApp.getMessageById(emailId);
    message.markRead();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email marked as read'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error marking email as read: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Failed to mark email as read: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendQuoteEmail(to, subject, body, originalEmailId) {
  try {
    const signature = '\n\n---\nBest regards,\n' + CONFIG.companyName + '\nContact: ' + CONFIG.contactInfo;
    const fullBody = body + signature;
    
    GmailApp.sendEmail(to, subject, '', {htmlBody: fullBody});
    
    // Mark original email as read if provided
    if (originalEmailId) {
      try {
        const originalMessage = GmailApp.getMessageById(originalEmailId);
        originalMessage.markRead();
      } catch (e) {
        Logger.log('Could not mark original email as read: ' + e.toString());
      }
    }
    
    Logger.log('Email sent successfully to: ' + to);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email sent successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Failed to send email: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function logQuoteToSheet(quoteData) {
  try {
    if (!CONFIG.sheetId || CONFIG.sheetId === 'YOUR_GOOGLE_SHEET_ID_HERE') {
      throw new Error('Sheet ID not configured');
    }
    
    const sheet = SpreadsheetApp.openById(CONFIG.sheetId).getActiveSheet();
    
    // Check if headers exist, if not create them
    const headers = sheet.getRange(1, 1, 1, 8).getValues()[0];
    if (!headers[0]) {
      sheet.getRange(1, 1, 1, 8).setValues([[
        'Timestamp', 'Customer Name', 'Email Address', 'Product', 
        'Quantity', 'Price Per Unit', 'Total Amount', 'Status'
      ]]);
    }
    
    // Add the quote data
    sheet.appendRow([
      quoteData.timestamp || new Date().toISOString(),
      quoteData.customerName || 'Unknown',
      quoteData.emailAddress || 'Unknown',
      quoteData.product || 'Unknown',
      quoteData.quantity || 0,
      quoteData.pricePerUnit || 0,
      quoteData.totalAmount || 0,
      quoteData.status || 'Unknown'
    ]);
    
    Logger.log('Quote logged to sheet successfully');
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Quote logged successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error logging to sheet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Failed to log quote: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Process email by ID with enhanced quote detection
function processEmailById(emailId) {
  try {
    const message = GmailApp.getMessageById(emailId);
    if (!message) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Email not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const body = message.getPlainBody();
    const isQuoteRequest = detectQuoteRequest(body);
    const products = detectProducts(body);
    const quantities = detectQuantities(body);
    const confidence = calculateConfidence(isQuoteRequest, products, quantities);

    // Extract email address and name
    const fromEmail = extractEmailAddress(message.getFrom());
    const fromName = message.getFrom().split('<')[0].trim();

    // Mark as read
    message.markRead();

    // Get product prices (you can customize these)
    const productPrices = {
      'ZTA-500N Digital Force Gauge': 83200.00,
      'Zeal England Glass Thermometer Range : 10 Deg C -110 Deg C': 750.00,
      'zero plate Non-Ferrous': 1800.00,
      'zero plate Ferrous': 1800.00,
      'Zero microns metallic plate': 850.00,
      'A4 Paper': 0.02,
      'Ballpoint Pens': 1.50,
      'Notebooks': 3.75,
      'Staplers': 8.99,
      'Whiteboard Markers': 2.50,
      'Sticky Notes': 3.25
    };

    let unitPrice = 1000; // Default price
    let totalPrice = 0;
    let quantity = 1;

    if (products.length > 0 && quantities.length > 0) {
      unitPrice = productPrices[products[0]] || 1000;
      quantity = quantities[0].quantity;
      totalPrice = quantity * unitPrice;
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email processed successfully',
      details: {
        isQuoteRequest: isQuoteRequest,
        products: products,
        quantities: quantities,
        confidence: confidence,
        customerName: fromName,
        customerEmail: fromEmail,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        quantity: quantity
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error processing email: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to extract email address from a string like "Name <email@example.com>"
function extractEmailAddress(fromString) {
  const match = fromString.match(/<([^>]*)>/);
  if (match) {
    return match[1];
  }
  return fromString;
}

function getDashboardStats() {
  try {
    // Get unread emails count
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

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      stats: {
        unreadEmails: unreadCount,
        quoteRequests: quoteRequestCount,
        processedToday: 0, // You can implement this based on your logging
        successRate: 85 // You can calculate this based on your data
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error getting dashboard stats: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function testConnection() {
  try {
    // Test Gmail access and count unread emails
    const unreadThreads = GmailApp.search('is:unread in:inbox', 0, 10);
    let unreadCount = 0;
    
    unreadThreads.forEach(function(thread) {
      const messages = thread.getMessages();
      messages.forEach(function(message) {
        if (message.isUnread()) {
          unreadCount++;
        }
      });
    });
    
    // Test Sheets access if configured
    let sheetAccess = false;
    if (CONFIG.sheetId && CONFIG.sheetId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
      try {
        SpreadsheetApp.openById(CONFIG.sheetId);
        sheetAccess = true;
      } catch (e) {
        Logger.log('Sheet access test failed: ' + e.toString());
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Google Apps Script connection successful',
      timestamp: new Date().toISOString(),
      services: {
        gmail: true,
        sheets: sheetAccess
      },
      emailCount: unreadCount,
      config: {
        targetEmail: CONFIG.targetEmail,
        hasSheetId: CONFIG.sheetId && CONFIG.sheetId !== 'YOUR_GOOGLE_SHEET_ID_HERE',
        companyName: CONFIG.companyName,
        maxEmailsToFetch: CONFIG.maxEmailsToFetch
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Connection test failed: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Connection test failed: ' + error.toString(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
