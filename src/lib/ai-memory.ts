// Advanced AI Memory Management System
// Persistent conversation memory with semantic search and user preference learning

import { ChatOpenAI } from "@langchain/openai";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface ConversationMemory {
  userId: string;
  conversationId: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  context: any; // Fiscal context at time of conversation
  topics: string[]; // Extracted topics/themes
  sentiment: 'positive' | 'neutral' | 'negative';
  importance: number; // 1-10 importance score
}

export interface UserPreferences {
  userId: string;
  communicationStyle: 'detailed' | 'concise' | 'technical';
  preferredTopics: string[];
  frequentQuestions: string[];
  languagePreference: 'formal' | 'informal';
  responseLength: 'short' | 'medium' | 'long';
  lastUpdated: Date;
}

export class AIMemoryService {
  private vectorStore: MemoryVectorStore;
  private embeddings: OpenAIEmbeddings;
  private llm: ChatOpenAI;
  private memory: ConversationSummaryBufferMemory;

  constructor() {
    // Initialize OpenAI embeddings (fallback to free alternative if needed)
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-local',
      modelName: "text-embedding-3-small", // More cost-effective
    });

    // Initialize LLM for memory summarization
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-local',
      modelName: "gpt-3.5-turbo", // Cost-effective for summarization
      temperature: 0.1,
    });

    // Initialize vector store for semantic memory search
    this.vectorStore = new MemoryVectorStore(this.embeddings);

    // Initialize conversation memory
    this.memory = new ConversationSummaryBufferMemory({
      llm: this.llm,
      maxTokenLimit: 2000,
      returnMessages: true,
    });
  }

  /**
   * Store a conversation in memory with semantic indexing
   */
  async storeConversation(
    userId: string, 
    userMessage: string, 
    aiResponse: string, 
    fiscalContext: any,
    conversationId?: string
  ): Promise<string> {
    try {
      const id = conversationId || uuidv4();
      const timestamp = new Date();

      // Extract topics and sentiment
      const topics = await this.extractTopics(userMessage);
      const sentiment = await this.analyzeSentiment(userMessage);
      const importance = await this.calculateImportance(userMessage, topics);

      // Store in database
      await this.storeInDatabase({
        userId,
        conversationId: id,
        timestamp,
        userMessage,
        aiResponse,
        context: fiscalContext,
        topics,
        sentiment,
        importance
      });

      // Store in vector database for semantic search
      await this.storeInVectorDB(id, userMessage, aiResponse, topics, userId);

      // Update user preferences
      await this.updateUserPreferences(userId, userMessage, topics);

      // Add to LangChain memory
      await this.memory.saveContext(
        { input: userMessage },
        { output: aiResponse }
      );

      return id;
    } catch (error) {
      console.error('Error storing conversation:', error);
      throw error;
    }
  }

  /**
   * Retrieve relevant past conversations for context
   */
  async getRelevantMemories(
    userId: string, 
    currentQuery: string, 
    limit: number = 5
  ): Promise<ConversationMemory[]> {
    try {
      // Semantic search in vector store
      const similarDocs = await this.vectorStore.similaritySearch(currentQuery, limit);
      
      // Get full conversation records
      const conversationIds = similarDocs
        .map(doc => doc.metadata.conversationId)
        .filter(id => id);

      if (conversationIds.length === 0) {
        return [];
      }

      // Fetch from database
      const conversations = await this.getConversationsFromDB(userId, conversationIds);
      
      // Sort by relevance and importance
      return conversations.sort((a, b) => b.importance - a.importance);
    } catch (error) {
      console.error('Error retrieving memories:', error);
      return [];
    }
  }

  /**
   * Get conversation summary for context
   */
  async getConversationSummary(userId: string): Promise<string> {
    try {
      const buffer = await this.memory.loadMemoryVariables({});
      return buffer.history || "Aucun historique de conversation disponible.";
    } catch (error) {
      console.error('Error getting conversation summary:', error);
      return "Erreur lors de la récupération de l'historique.";
    }
  }

  /**
   * Get user preferences for personalized responses
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      // For now, store in a simple JSON structure
      // In production, this would be in a proper database table
      const prefsData = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          // Assuming we add a preferences JSON field to User model
          name: true 
        }
      });

      // Return default preferences for now
      // This would be enhanced with actual stored preferences
      return {
        userId,
        communicationStyle: 'detailed',
        preferredTopics: ['fiscalité', 'micro-entrepreneur', 'URSSAF'],
        frequentQuestions: [],
        languagePreference: 'formal',
        responseLength: 'medium',
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Generate memory-aware context for AI
   */
  async generateMemoryContext(userId: string, currentQuery: string): Promise<string> {
    try {
      const [relevantMemories, preferences, summary] = await Promise.all([
        this.getRelevantMemories(userId, currentQuery, 3),
        this.getUserPreferences(userId),
        this.getConversationSummary(userId)
      ]);

      let memoryContext = "";

      // Add conversation history
      if (relevantMemories.length > 0) {
        memoryContext += "\n🧠 HISTORIQUE PERTINENT :\n";
        relevantMemories.forEach((memory, index) => {
          memoryContext += `${index + 1}. [${memory.timestamp.toLocaleDateString('fr-FR')}] `;
          memoryContext += `Question: "${memory.userMessage.substring(0, 100)}..." `;
          memoryContext += `Sujets: ${memory.topics.join(', ')}\n`;
        });
      }

      // Add user preferences
      if (preferences) {
        memoryContext += "\n👤 PRÉFÉRENCES UTILISATEUR :\n";
        memoryContext += `- Style de communication: ${preferences.communicationStyle}\n`;
        memoryContext += `- Sujets fréquents: ${preferences.preferredTopics.join(', ')}\n`;
        memoryContext += `- Longueur de réponse: ${preferences.responseLength}\n`;
      }

      // Add conversation summary if available
      if (summary && summary !== "Aucun historique de conversation disponible.") {
        memoryContext += "\n📝 RÉSUMÉ DES CONVERSATIONS RÉCENTES :\n";
        memoryContext += summary.substring(0, 500) + "...\n";
      }

      return memoryContext;
    } catch (error) {
      console.error('Error generating memory context:', error);
      return "";
    }
  }

  // Private helper methods

  private async extractTopics(message: string): Promise<string[]> {
    // Simple keyword extraction - could be enhanced with NLP
    const fiscalKeywords = [
      'urssaf', 'tva', 'seuil', 'micro-entrepreneur', 'bic', 'bnc',
      'cotisation', 'déclaration', 'facture', 'client', 'paiement',
      'chiffre affaires', 'revenus', 'optimisation', 'fiscalité'
    ];

    const topics = fiscalKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    return topics.length > 0 ? topics : ['général'];
  }

  private async analyzeSentiment(message: string): Promise<'positive' | 'neutral' | 'negative'> {
    // Simple sentiment analysis - could be enhanced with proper NLP
    const positiveWords = ['merci', 'parfait', 'excellent', 'bien', 'super'];
    const negativeWords = ['problème', 'erreur', 'difficile', 'inquiet', 'confusion'];

    const lowerMessage = message.toLowerCase();
    const hasPositive = positiveWords.some(word => lowerMessage.includes(word));
    const hasNegative = negativeWords.some(word => lowerMessage.includes(word));

    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    return 'neutral';
  }

  private async calculateImportance(message: string, topics: string[]): Promise<number> {
    let importance = 5; // Base importance

    // Increase importance for specific fiscal topics
    const highImportanceTopics = ['seuil', 'tva', 'urssaf', 'déclaration'];
    if (topics.some(topic => highImportanceTopics.includes(topic))) {
      importance += 2;
    }

    // Increase importance for urgent words
    const urgentWords = ['urgent', 'problème', 'aide', 'rapidement'];
    if (urgentWords.some(word => message.toLowerCase().includes(word))) {
      importance += 1;
    }

    return Math.min(importance, 10);
  }

  private async storeInDatabase(memory: ConversationMemory): Promise<void> {
    // For now, we'll store in a simple format
    // In production, create proper ConversationMemory table
    try {
      // This is a simplified storage - would need proper schema
      console.log('Storing conversation memory:', {
        userId: memory.userId,
        conversationId: memory.conversationId,
        topics: memory.topics,
        importance: memory.importance
      });
    } catch (error) {
      console.error('Database storage error:', error);
    }
  }

  private async storeInVectorDB(
    conversationId: string,
    userMessage: string,
    aiResponse: string,
    topics: string[],
    userId: string
  ): Promise<void> {
    try {
      const documents = [
        new Document({
          pageContent: `Question: ${userMessage}\nRéponse: ${aiResponse}`,
          metadata: {
            conversationId,
            userId,
            topics: topics.join(','),
            timestamp: new Date().toISOString()
          }
        })
      ];

      await this.vectorStore.addDocuments(documents);
    } catch (error) {
      console.error('Vector storage error:', error);
    }
  }

  private async getConversationsFromDB(
    userId: string, 
    conversationIds: string[]
  ): Promise<ConversationMemory[]> {
    // Simplified return for now - would query actual database
    return [];
  }

  private async updateUserPreferences(
    userId: string, 
    message: string, 
    topics: string[]
  ): Promise<void> {
    // Update user preferences based on conversation patterns
    // This would analyze communication style, preferred topics, etc.
    try {
      console.log('Updating preferences for user:', userId, 'with topics:', topics);
    } catch (error) {
      console.error('Preference update error:', error);
    }
  }
}

// Singleton instance
let memoryServiceInstance: AIMemoryService | null = null;

export const getMemoryService = (): AIMemoryService => {
  if (!memoryServiceInstance) {
    memoryServiceInstance = new AIMemoryService();
  }
  return memoryServiceInstance;
};

export default AIMemoryService;