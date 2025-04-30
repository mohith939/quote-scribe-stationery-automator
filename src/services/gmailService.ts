
// Re-export all services from their respective files
export { fetchUnreadEmails, markEmailAsRead, sendQuoteEmail } from './emailFetchService';
export { logQuoteToSheet } from './quoteLogService';
export { getEmailProcessingMetrics } from './emailMetricsService';
export { setupAutoEmailProcessing, autoProcessEmails, autoProcessSingleEmail } from './autoEmailProcessService';
