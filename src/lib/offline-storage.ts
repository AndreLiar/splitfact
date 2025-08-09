// Offline Storage Service for Splitfact PWA
// Provides offline capabilities for invoice drafts, client data, and user preferences

import { openDB } from 'idb';

// Offline Storage interfaces for TypeScript support

class OfflineStorage {
  private db: any = null;

  async init() {
    if (this.db) return this.db;

    this.db = await openDB('splitfact-offline', 1, {
      upgrade(db) {
        // Invoice drafts store
        const invoiceStore = db.createObjectStore('invoiceDrafts', {
          keyPath: 'id'
        });
        invoiceStore.createIndex('userId', 'userId');
        invoiceStore.createIndex('synced', 'synced');

        // Clients cache
        const clientsStore = db.createObjectStore('clients', {
          keyPath: 'id'
        });
        clientsStore.createIndex('userId', 'userId');
        clientsStore.createIndex('synced', 'synced');

        // AI responses cache
        const aiStore = db.createObjectStore('aiResponses', {
          keyPath: 'id'
        });
        aiStore.createIndex('userId', 'userId');
        aiStore.createIndex('expiresAt', 'expiresAt');

        // User preferences
        const prefsStore = db.createObjectStore('userPreferences', {
          keyPath: 'userId'
        });

        // Sync queue
        const syncStore = db.createObjectStore('syncQueue', {
          keyPath: 'id'
        });
        syncStore.createIndex('entityType', 'entityType');
        syncStore.createIndex('createdAt', 'createdAt');
      }
    });

    return this.db;
  }

  // Invoice Draft Management
  async saveInvoiceDraft(userId: string, draftData: any) {
    const db = await this.init();
    const id = draftData.id || `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.put('invoiceDrafts', {
      id,
      userId,
      data: draftData,
      createdAt: draftData.createdAt || new Date(),
      updatedAt: new Date(),
      synced: false
    });

    // Add to sync queue
    await this.addToSyncQueue('invoice', 'create', draftData);
    
    return id;
  }

  async getInvoiceDrafts(userId: string) {
    const db = await this.init();
    return await db.getAllFromIndex('invoiceDrafts', 'userId', userId);
  }

  async deleteInvoiceDraft(draftId: string) {
    const db = await this.init();
    await db.delete('invoiceDrafts', draftId);
  }

  // Client Data Caching
  async cacheClients(userId: string, clients: any[]) {
    const db = await this.init();
    const tx = db.transaction('clients', 'readwrite');
    
    for (const client of clients) {
      await tx.store.put({
        id: client.id,
        userId,
        data: client,
        lastUpdated: new Date(),
        synced: true
      });
    }
    
    await tx.done;
  }

  async getCachedClients(userId: string) {
    const db = await this.init();
    const clients = await db.getAllFromIndex('clients', 'userId', userId);
    return clients.map((c: any) => c.data);
  }

  // AI Responses Caching
  async cacheAIResponse(userId: string, query: string, response: string, metadata: any = {}) {
    const db = await this.init();
    const id = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours
    
    await db.put('aiResponses', {
      id,
      userId,
      query: query.toLowerCase().trim(),
      response,
      metadata,
      createdAt: new Date(),
      expiresAt
    });
  }

  async getCachedAIResponse(userId: string, query: string) {
    const db = await this.init();
    const normalizedQuery = query.toLowerCase().trim();
    const allResponses = await db.getAllFromIndex('aiResponses', 'userId', userId);
    
    // Find matching response that hasn't expired
    const now = new Date();
    const match = allResponses.find((r: any) => 
      r.query === normalizedQuery && r.expiresAt > now
    );
    
    return match ? { response: match.response, metadata: match.metadata } : null;
  }

  // Clean expired AI responses
  async cleanExpiredAIResponses() {
    const db = await this.init();
    const now = new Date();
    const expired = await db.getAllFromIndex('aiResponses', 'expiresAt', IDBKeyRange.upperBound(now));
    
    for (const item of expired) {
      await db.delete('aiResponses', item.id);
    }
  }

  // User Preferences
  async saveUserPreferences(userId: string, preferences: any) {
    const db = await this.init();
    await db.put('userPreferences', {
      userId,
      preferences,
      updatedAt: new Date()
    });
  }

  async getUserPreferences(userId: string) {
    const db = await this.init();
    const result = await db.get('userPreferences', userId);
    return result?.preferences || {};
  }

  // Sync Queue Management
  private async addToSyncQueue(entityType: 'invoice' | 'client' | 'preference', type: 'create' | 'update' | 'delete', data: any) {
    const db = await this.init();
    const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.put('syncQueue', {
      id,
      type,
      entityType,
      data,
      createdAt: new Date(),
      retryCount: 0
    });
  }

  async getSyncQueue() {
    const db = await this.init();
    return await db.getAll('syncQueue');
  }

  async removeSyncItem(id: string) {
    const db = await this.init();
    await db.delete('syncQueue', id);
  }

  async incrementRetryCount(id: string) {
    const db = await this.init();
    const item = await db.get('syncQueue', id);
    if (item) {
      item.retryCount++;
      await db.put('syncQueue', item);
    }
  }

  // Background Sync
  async syncWhenOnline() {
    if (!navigator.onLine) return;

    const queue = await this.getSyncQueue();
    
    for (const item of queue) {
      try {
        await this.processSync(item);
        await this.removeSyncItem(item.id);
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
        await this.incrementRetryCount(item.id);
        
        // Remove items with too many retries
        if (item.retryCount >= 5) {
          await this.removeSyncItem(item.id);
        }
      }
    }
  }

  private async processSync(item: any) {
    const { type, entityType, data } = item;
    
    switch (entityType) {
      case 'invoice':
        if (type === 'create') {
          await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        }
        break;
      case 'client':
        if (type === 'create') {
          await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        }
        break;
      // Add more sync handlers as needed
    }
  }

  // Storage Usage
  async getStorageUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return await navigator.storage.estimate();
    }
    return null;
  }

  // Clear all offline data
  async clearAll() {
    const db = await this.init();
    const tx = db.transaction(['invoiceDrafts', 'clients', 'aiResponses', 'userPreferences', 'syncQueue'], 'readwrite');
    
    await tx.objectStore('invoiceDrafts').clear();
    await tx.objectStore('clients').clear();
    await tx.objectStore('aiResponses').clear();
    await tx.objectStore('userPreferences').clear();
    await tx.objectStore('syncQueue').clear();
    
    await tx.done;
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Hook for React components
export function useOfflineStorage() {
  return offlineStorage;
}