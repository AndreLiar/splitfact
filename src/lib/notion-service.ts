// Notion Integration Service - Connect user's Notion workspace for enhanced fiscal data
// Provides bidirectional sync between Splitfact and user's Notion databases

import { Client } from '@notionhq/client';
import { prisma } from './prisma';

// Fiscal data structures that can be synced with Notion
export interface NotionFiscalData {
  revenues: NotionRevenue[];
  expenses: NotionExpense[];
  clients: NotionClient[];
  fiscalNotes: NotionFiscalNote[];
  businessMetrics: NotionBusinessMetric[];
}

export interface NotionRevenue {
  id: string;
  date: string;
  amount: number;
  client: string;
  description: string;
  invoiceNumber?: string;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  source: 'notion' | 'splitfact';
}

export interface NotionExpense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  supplier?: string;
  isDeductible: boolean;
  source: 'notion' | 'splitfact';
}

export interface NotionClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  projects: string[];
  totalRevenue: number;
  source: 'notion' | 'splitfact';
}

export interface NotionFiscalNote {
  id: string;
  date: string;
  title: string;
  content: string;
  category: 'regulation' | 'deadline' | 'strategy' | 'question' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  source: 'notion' | 'splitfact';
}

export interface NotionBusinessMetric {
  id: string;
  date: string;
  metric: string;
  value: number;
  unit: string;
  category: 'revenue' | 'expense' | 'productivity' | 'client';
  source: 'notion' | 'splitfact';
}

// User's Notion connection information
export interface NotionConnection {
  userId: string;
  accessToken: string;
  workspaceId: string;
  workspaceName: string;
  connectedAt: Date;
  lastSyncAt?: Date;
  databases: NotionDatabase[];
  isActive: boolean;
}

export interface NotionDatabase {
  id: string;
  name: string;
  type: 'revenues' | 'expenses' | 'clients' | 'notes' | 'metrics' | 'custom';
  properties: Record<string, NotionProperty>;
  mappedTo?: string; // Splitfact field mapping
  syncEnabled: boolean;
}

export interface NotionProperty {
  id: string;
  name: string;
  type: 'title' | 'rich_text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'email' | 'phone_number';
  options?: string[]; // For select/multi_select
}

// Standard database templates for fiscal management
const FISCAL_DATABASE_TEMPLATES = {
  revenues: {
    name: '💰 Revenus - Splitfact Sync',
    properties: {
      'Client': { type: 'title' },
      'Montant': { type: 'number' },
      'Date': { type: 'date' },
      'Description': { type: 'rich_text' },
      'Facture N°': { type: 'rich_text' },
      'Statut': { 
        type: 'select',
        options: ['En attente', 'Payé', 'En retard']
      },
      'Source': { 
        type: 'select',
        options: ['Notion', 'Splitfact']
      }
    }
  },
  expenses: {
    name: '📊 Dépenses - Splitfact Sync',
    properties: {
      'Description': { type: 'title' },
      'Montant': { type: 'number' },
      'Date': { type: 'date' },
      'Catégorie': { 
        type: 'select',
        options: ['Matériel', 'Logiciels', 'Formation', 'Transport', 'Repas', 'Autre']
      },
      'Fournisseur': { type: 'rich_text' },
      'Déductible': { type: 'checkbox' },
      'Source': { 
        type: 'select',
        options: ['Notion', 'Splitfact']
      }
    }
  },
  clients: {
    name: '👥 Clients - Splitfact Sync',
    properties: {
      'Nom': { type: 'title' },
      'Email': { type: 'email' },
      'Téléphone': { type: 'phone_number' },
      'Adresse': { type: 'rich_text' },
      'CA Total': { type: 'number' },
      'Projets': { type: 'multi_select' },
      'Source': { 
        type: 'select',
        options: ['Notion', 'Splitfact']
      }
    }
  }
};

export class NotionIntegrationService {
  private notion: Client | null = null;
  private userId: string;
  private connection: NotionConnection | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Initialize Notion client with user's access token
   */
  async initialize(): Promise<boolean> {
    try {
      // Load user's Notion connection from database
      this.connection = await this.loadUserConnection();
      
      if (!this.connection || !this.connection.isActive) {
        return false;
      }

      this.notion = new Client({
        auth: this.connection.accessToken,
      });

      // Test connection
      await this.notion.users.me({});
      return true;
    } catch (error) {
      console.error('Failed to initialize Notion client:', error);
      return false;
    }
  }

  /**
   * Connect user's Notion account with OAuth flow
   */
  async connectUserAccount(accessToken: string, workspaceInfo?: any): Promise<boolean> {
    try {
      // Create temporary client to test token
      const testClient = new Client({ auth: accessToken });
      const user = await testClient.users.me({});
      
      // Get workspace information
      const workspace = workspaceInfo || await this.getWorkspaceInfo(testClient);
      
      // Save connection to database
      const connection: NotionConnection = {
        userId: this.userId,
        accessToken,
        workspaceId: workspace.id || 'unknown',
        workspaceName: workspace.name || 'Unknown Workspace',
        connectedAt: new Date(),
        databases: [],
        isActive: true
      };

      await this.saveUserConnection(connection);
      this.connection = connection;
      this.notion = testClient;

      // Discover existing databases
      await this.discoverUserDatabases();

      return true;
    } catch (error) {
      console.error('Failed to connect Notion account:', error);
      return false;
    }
  }

  /**
   * Disconnect user's Notion account
   */
  async disconnectUserAccount(): Promise<boolean> {
    try {
      if (this.connection) {
        this.connection.isActive = false;
        await this.saveUserConnection(this.connection);
      }
      
      this.notion = null;
      this.connection = null;
      return true;
    } catch (error) {
      console.error('Failed to disconnect Notion account:', error);
      return false;
    }
  }

  /**
   * Sync fiscal data from user's Notion workspace
   */
  async syncFiscalData(): Promise<NotionFiscalData> {
    if (!this.notion || !this.connection) {
      throw new Error('Notion not connected');
    }

    try {
      const fiscalData: NotionFiscalData = {
        revenues: [],
        expenses: [],
        clients: [],
        fiscalNotes: [],
        businessMetrics: []
      };

      // Sync each database type
      for (const database of this.connection.databases) {
        if (!database.syncEnabled) continue;

        switch (database.type) {
          case 'revenues':
            fiscalData.revenues = await this.syncRevenuesFromDatabase(database.id);
            break;
          case 'expenses':
            fiscalData.expenses = await this.syncExpensesFromDatabase(database.id);
            break;
          case 'clients':
            fiscalData.clients = await this.syncClientsFromDatabase(database.id);
            break;
          case 'notes':
            fiscalData.fiscalNotes = await this.syncNotesFromDatabase(database.id);
            break;
          case 'metrics':
            fiscalData.businessMetrics = await this.syncMetricsFromDatabase(database.id);
            break;
        }
      }

      // Update last sync time
      this.connection.lastSyncAt = new Date();
      await this.saveUserConnection(this.connection);

      return fiscalData;
    } catch (error) {
      console.error('Failed to sync fiscal data:', error);
      throw error;
    }
  }

  /**
   * Create a fiscal entry in user's Notion database
   */
  async createFiscalEntry(type: 'revenue' | 'expense' | 'client' | 'note', data: any): Promise<string> {
    if (!this.notion || !this.connection) {
      throw new Error('Notion not connected');
    }

    try {
      const database = this.connection.databases.find(db => db.type === type + 's');
      if (!database) {
        throw new Error(`No ${type} database found`);
      }

      const properties = this.mapDataToNotionProperties(data, database.properties, type);
      
      const response = await this.notion.pages.create({
        parent: { database_id: database.id },
        properties
      });

      return response.id;
    } catch (error) {
      console.error(`Failed to create ${type} entry:`, error);
      throw error;
    }
  }

  /**
   * Search for content in user's Notion workspace
   */
  async searchNotionContent(query: string, filter?: { types?: string[], limit?: number }): Promise<any[]> {
    if (!this.notion) {
      throw new Error('Notion not connected');
    }

    try {
      const searchResults = await this.notion.search({
        query,
        filter: filter?.types ? { 
          value: 'page',
          property: 'object' 
        } : undefined,
        page_size: filter?.limit || 20
      });

      return searchResults.results.map(result => ({
        id: result.id,
        title: this.extractPageTitle(result),
        url: (result as any).url,
        lastEdited: (result as any).last_edited_time,
        type: result.object
      }));
    } catch (error) {
      console.error('Failed to search Notion content:', error);
      return [];
    }
  }

  /**
   * Get connection status and diagnostics
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    workspace?: string;
    lastSync?: Date;
    databases: number;
    errors?: string[];
  }> {
    const status = {
      connected: !!this.connection?.isActive,
      workspace: this.connection?.workspaceName,
      lastSync: this.connection?.lastSyncAt,
      databases: this.connection?.databases.length || 0,
      errors: [] as string[]
    };

    if (this.connection && this.notion) {
      try {
        await this.notion.users.me({});
      } catch (error) {
        status.connected = false;
        status.errors.push('Token expired or invalid');
      }
    }

    return status;
  }

  /**
   * Create standard fiscal databases in user's workspace
   */
  async createFiscalDatabases(): Promise<NotionDatabase[]> {
    if (!this.notion) {
      throw new Error('Notion not connected');
    }

    const createdDatabases: NotionDatabase[] = [];

    try {
      // Create each standard fiscal database
      for (const [type, template] of Object.entries(FISCAL_DATABASE_TEMPLATES)) {
        const database = await this.notion.databases.create({
          parent: {
            type: 'page_id',
            page_id: await this.getOrCreateFiscalPage()
          },
          title: [{ text: { content: template.name } }],
          properties: this.convertTemplateToNotionProperties(template.properties)
        });

        const notionDb: NotionDatabase = {
          id: database.id,
          name: template.name,
          type: type as any,
          properties: await this.extractDatabaseProperties(database),
          syncEnabled: true
        };

        createdDatabases.push(notionDb);
      }

      // Update connection with new databases
      if (this.connection) {
        this.connection.databases = [...this.connection.databases, ...createdDatabases];
        await this.saveUserConnection(this.connection);
      }

      return createdDatabases;
    } catch (error) {
      console.error('Failed to create fiscal databases:', error);
      throw error;
    }
  }

  // --- Private Helper Methods ---

  private async loadUserConnection(): Promise<NotionConnection | null> {
    try {
      // In a real implementation, this would query your database
      // For now, return null to indicate no connection
      return null;
    } catch (error) {
      console.error('Failed to load user connection:', error);
      return null;
    }
  }

  private async saveUserConnection(connection: NotionConnection): Promise<void> {
    try {
      // In a real implementation, this would save to your database
      // For now, we'll just log it
      console.log('Saving Notion connection for user:', connection.userId);
    } catch (error) {
      console.error('Failed to save user connection:', error);
      throw error;
    }
  }

  private async getWorkspaceInfo(client: Client): Promise<any> {
    try {
      const user = await client.users.me({});
      return {
        id: (user as any).workspace_id || 'unknown',
        name: (user as any).workspace_name || 'Unknown Workspace'
      };
    } catch {
      return { id: 'unknown', name: 'Unknown Workspace' };
    }
  }

  private async discoverUserDatabases(): Promise<void> {
    if (!this.notion || !this.connection) return;

    try {
      const searchResults = await this.notion.search({
        filter: { value: 'database', property: 'object' },
        page_size: 50
      });

      const databases: NotionDatabase[] = [];

      for (const result of searchResults.results) {
        if (result.object === 'database') {
          const database = result as any;
          const notionDb: NotionDatabase = {
            id: database.id,
            name: database.title?.[0]?.plain_text || 'Untitled Database',
            type: this.detectDatabaseType(database),
            properties: await this.extractDatabaseProperties(database),
            syncEnabled: false // User can enable later
          };
          
          databases.push(notionDb);
        }
      }

      this.connection.databases = databases;
      await this.saveUserConnection(this.connection);
    } catch (error) {
      console.warn('Failed to discover databases:', error);
    }
  }

  private detectDatabaseType(database: any): NotionDatabase['type'] {
    const title = database.title?.[0]?.plain_text?.toLowerCase() || '';
    
    if (title.includes('revenue') || title.includes('revenu') || title.includes('income')) return 'revenues';
    if (title.includes('expense') || title.includes('dépense') || title.includes('cost')) return 'expenses';
    if (title.includes('client') || title.includes('customer')) return 'clients';
    if (title.includes('note') || title.includes('fiscal')) return 'notes';
    if (title.includes('metric') || title.includes('kpi')) return 'metrics';
    
    return 'custom';
  }

  private async extractDatabaseProperties(database: any): Promise<Record<string, NotionProperty>> {
    const properties: Record<string, NotionProperty> = {};
    
    if (database.properties) {
      for (const [name, prop] of Object.entries(database.properties as any)) {
        const typedProp = prop as any;
        properties[name] = {
          id: typedProp.id,
          name,
          type: typedProp.type,
          options: typedProp.type === 'select' || typedProp.type === 'multi_select' 
            ? typedProp[typedProp.type]?.options?.map((opt: any) => opt.name) 
            : undefined
        };
      }
    }
    
    return properties;
  }

  private async syncRevenuesFromDatabase(databaseId: string): Promise<NotionRevenue[]> {
    if (!this.notion) return [];

    try {
      const response = await this.notion.databases.query({ database_id: databaseId });
      
      return response.results.map((page: any) => ({
        id: page.id,
        date: this.extractDateProperty(page.properties, ['Date', 'date']),
        amount: this.extractNumberProperty(page.properties, ['Montant', 'Amount', 'amount']),
        client: this.extractTextProperty(page.properties, ['Client', 'client', 'Name']),
        description: this.extractTextProperty(page.properties, ['Description', 'description']),
        invoiceNumber: this.extractTextProperty(page.properties, ['Facture N°', 'Invoice']),
        paymentStatus: this.extractSelectProperty(page.properties, ['Statut', 'Status']) as any || 'pending',
        source: 'notion'
      }));
    } catch (error) {
      console.error('Failed to sync revenues:', error);
      return [];
    }
  }

  private async syncExpensesFromDatabase(databaseId: string): Promise<NotionExpense[]> {
    if (!this.notion) return [];

    try {
      const response = await this.notion.databases.query({ database_id: databaseId });
      
      return response.results.map((page: any) => ({
        id: page.id,
        date: this.extractDateProperty(page.properties, ['Date', 'date']),
        amount: this.extractNumberProperty(page.properties, ['Montant', 'Amount', 'amount']),
        category: this.extractSelectProperty(page.properties, ['Catégorie', 'Category']) || 'Autre',
        description: this.extractTextProperty(page.properties, ['Description', 'description']),
        supplier: this.extractTextProperty(page.properties, ['Fournisseur', 'Supplier']),
        isDeductible: this.extractCheckboxProperty(page.properties, ['Déductible', 'Deductible']),
        source: 'notion'
      }));
    } catch (error) {
      console.error('Failed to sync expenses:', error);
      return [];
    }
  }

  private async syncClientsFromDatabase(databaseId: string): Promise<NotionClient[]> {
    if (!this.notion) return [];

    try {
      const response = await this.notion.databases.query({ database_id: databaseId });
      
      return response.results.map((page: any) => ({
        id: page.id,
        name: this.extractTextProperty(page.properties, ['Nom', 'Name', 'name']),
        email: this.extractEmailProperty(page.properties, ['Email', 'email']),
        phone: this.extractPhoneProperty(page.properties, ['Téléphone', 'Phone']),
        address: this.extractTextProperty(page.properties, ['Adresse', 'Address']),
        projects: this.extractMultiSelectProperty(page.properties, ['Projets', 'Projects']),
        totalRevenue: this.extractNumberProperty(page.properties, ['CA Total', 'Revenue']),
        source: 'notion'
      }));
    } catch (error) {
      console.error('Failed to sync clients:', error);
      return [];
    }
  }

  private async syncNotesFromDatabase(databaseId: string): Promise<NotionFiscalNote[]> {
    if (!this.notion) return [];

    try {
      const response = await this.notion.databases.query({ database_id: databaseId });
      
      return response.results.map((page: any) => ({
        id: page.id,
        date: this.extractDateProperty(page.properties, ['Date', 'date']),
        title: this.extractTextProperty(page.properties, ['Titre', 'Title', 'title']),
        content: this.extractTextProperty(page.properties, ['Contenu', 'Content', 'content']),
        category: this.extractSelectProperty(page.properties, ['Catégorie', 'Category']) as any || 'question',
        priority: this.extractSelectProperty(page.properties, ['Priorité', 'Priority']) as any || 'medium',
        tags: this.extractMultiSelectProperty(page.properties, ['Tags', 'tags']),
        source: 'notion'
      }));
    } catch (error) {
      console.error('Failed to sync notes:', error);
      return [];
    }
  }

  private async syncMetricsFromDatabase(databaseId: string): Promise<NotionBusinessMetric[]> {
    // Similar implementation for metrics
    return [];
  }

  // Property extraction helpers
  private extractTextProperty(properties: any, names: string[]): string {
    for (const name of names) {
      if (properties[name]) {
        const prop = properties[name];
        if (prop.type === 'title' && prop.title?.[0]) {
          return prop.title[0].plain_text || '';
        }
        if (prop.type === 'rich_text' && prop.rich_text?.[0]) {
          return prop.rich_text[0].plain_text || '';
        }
      }
    }
    return '';
  }

  private extractNumberProperty(properties: any, names: string[]): number {
    for (const name of names) {
      if (properties[name]?.type === 'number') {
        return properties[name].number || 0;
      }
    }
    return 0;
  }

  private extractDateProperty(properties: any, names: string[]): string {
    for (const name of names) {
      if (properties[name]?.type === 'date') {
        return properties[name].date?.start || '';
      }
    }
    return new Date().toISOString().split('T')[0];
  }

  private extractSelectProperty(properties: any, names: string[]): string | null {
    for (const name of names) {
      if (properties[name]?.type === 'select') {
        return properties[name].select?.name || null;
      }
    }
    return null;
  }

  private extractMultiSelectProperty(properties: any, names: string[]): string[] {
    for (const name of names) {
      if (properties[name]?.type === 'multi_select') {
        return properties[name].multi_select?.map((item: any) => item.name) || [];
      }
    }
    return [];
  }

  private extractCheckboxProperty(properties: any, names: string[]): boolean {
    for (const name of names) {
      if (properties[name]?.type === 'checkbox') {
        return properties[name].checkbox || false;
      }
    }
    return false;
  }

  private extractEmailProperty(properties: any, names: string[]): string | undefined {
    for (const name of names) {
      if (properties[name]?.type === 'email') {
        return properties[name].email || undefined;
      }
    }
    return undefined;
  }

  private extractPhoneProperty(properties: any, names: string[]): string | undefined {
    for (const name of names) {
      if (properties[name]?.type === 'phone_number') {
        return properties[name].phone_number || undefined;
      }
    }
    return undefined;
  }

  private extractPageTitle(page: any): string {
    if (page.properties) {
      for (const prop of Object.values(page.properties) as any[]) {
        if (prop.type === 'title' && prop.title?.[0]) {
          return prop.title[0].plain_text;
        }
      }
    }
    return 'Untitled';
  }

  private mapDataToNotionProperties(data: any, databaseProperties: Record<string, NotionProperty>, type: string): any {
    // Map Splitfact data to Notion properties format
    const properties: any = {};
    
    // This would be implemented based on specific data types and mappings
    // For now, return empty object
    
    return properties;
  }

  private convertTemplateToNotionProperties(template: any): any {
    // Convert template properties to Notion database creation format
    const properties: any = {};
    
    for (const [name, config] of Object.entries(template) as any[]) {
      properties[name] = {
        type: config.type,
        ...(config.type === 'select' && config.options ? {
          select: {
            options: config.options.map((opt: string) => ({ name: opt }))
          }
        } : {}),
        ...(config.type === 'multi_select' && config.options ? {
          multi_select: {
            options: config.options.map((opt: string) => ({ name: opt }))
          }
        } : {})
      };
    }
    
    return properties;
  }

  private async getOrCreateFiscalPage(): Promise<string> {
    // Find or create a page to house fiscal databases
    // For now, return a placeholder
    return 'placeholder-page-id';
  }
}

// Singleton factory
const notionServices = new Map<string, NotionIntegrationService>();

export const getNotionService = (userId: string): NotionIntegrationService => {
  if (!notionServices.has(userId)) {
    notionServices.set(userId, new NotionIntegrationService(userId));
  }
  return notionServices.get(userId)!;
};

export default NotionIntegrationService;