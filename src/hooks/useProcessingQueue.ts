
import { useState, useCallback } from 'react';
import { ProcessingQueueItem } from "@/types";
import { EmailMessage } from "@/types";
import { EmailClassification } from "@/services/emailClassificationService";

interface EnhancedEmailMessage extends EmailMessage {
  classification: EmailClassification;
}

export function useProcessingQueue() {
  const [queueItems, setQueueItems] = useState<ProcessingQueueItem[]>([]);

  const addToQueue = useCallback((email: EnhancedEmailMessage) => {
    const newItem: ProcessingQueueItem = {
      id: `queue_${Date.now()}_${email.id}`,
      email: {
        id: email.id,
        from: email.from,
        to: email.to || '',
        subject: email.subject,
        body: email.body,
        date: email.date,
        snippet: email.snippet
      },
      customerInfo: {
        name: extractCustomerName(email.from),
        email: extractEmailAddress(email.from)
      },
      detectedProducts: email.classification.detectedProduct ? [{
        product: email.classification.detectedProduct.name,
        productCode: email.classification.detectedProduct.code,
        brand: email.classification.detectedProduct.description?.split(' - ')[0] || '',
        quantity: 1,
        confidence: email.classification.confidence
      }] : [],
      status: 'pending',
      dateAdded: new Date().toISOString()
    };

    setQueueItems(prev => [newItem, ...prev]);
    return newItem.id;
  }, []);

  const removeFromQueue = useCallback((itemId: string) => {
    setQueueItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateQueueItem = useCallback((itemId: string, updates: Partial<ProcessingQueueItem>) => {
    setQueueItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  }, []);

  return {
    queueItems,
    addToQueue,
    removeFromQueue,
    updateQueueItem
  };
}

function extractCustomerName(emailFrom: string): string {
  const nameMatch = emailFrom.match(/^([^<]+)<([^>]+)>$/);
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1].trim().replace(/['"]/g, '');
  }
  
  const emailMatch = emailFrom.match(/([^@<\s]+)@[^>]+/);
  if (emailMatch && emailMatch[1]) {
    return emailMatch[1].charAt(0).toUpperCase() + emailMatch[1].slice(1);
  }
  
  return "Customer";
}

function extractEmailAddress(emailFrom: string): string {
  const emailMatch = emailFrom.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return emailMatch ? emailMatch[0] : "";
}
