// Cost monitoring utility for OpenAI usage
import { AI_CONFIG, isOpenAIMode } from './ai-config';

interface UsageStats {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  queriesCount: number;
  date: string;
}

class CostMonitor {
  private stats: UsageStats = {
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 0,
    queriesCount: 0,
    date: new Date().toISOString().split('T')[0]
  };

  // GPT-4o-mini pricing (per 1M tokens)
  private readonly PRICING = {
    'gpt-4o-mini': {
      input: 0.15, // $0.15 per 1M input tokens
      output: 0.60 // $0.60 per 1M output tokens
    },
    'gpt-3.5-turbo': {
      input: 0.50,
      output: 1.50
    }
  };

  /**
   * Estimate tokens for a text (rough approximation: 1 token ≈ 4 characters)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost for a query
   */
  private calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    const pricing = this.PRICING[model as keyof typeof this.PRICING];
    if (!pricing) return 0;

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Track a query (call this from AI service)
   */
  trackQuery(inputText: string, outputText: string, model: string = AI_CONFIG.OPENAI.MODEL): void {
    if (!isOpenAIMode()) return; // Only track OpenAI usage

    const inputTokens = this.estimateTokens(inputText);
    const outputTokens = this.estimateTokens(outputText);
    const cost = this.calculateCost(inputTokens, outputTokens, model);

    this.stats.inputTokens += inputTokens;
    this.stats.outputTokens += outputTokens;
    this.stats.totalTokens += inputTokens + outputTokens;
    this.stats.totalCost += cost;
    this.stats.queriesCount += 1;

    // Log if approaching budget limits
    if (this.stats.totalCost > 4.0) { // €4 out of €5 budget
      console.warn(`🚨 AI Budget Alert: €${this.stats.totalCost.toFixed(3)} spent (80% of budget)`);
    }
  }

  /**
   * Get current usage statistics
   */
  getStats(): UsageStats & { remainingBudget: number; averageCostPerQuery: number } {
    const budget = 5.0; // €5 budget
    const remainingBudget = budget - this.stats.totalCost;
    const averageCostPerQuery = this.stats.queriesCount > 0 ? this.stats.totalCost / this.stats.queriesCount : 0;

    return {
      ...this.stats,
      remainingBudget,
      averageCostPerQuery
    };
  }

  /**
   * Get formatted usage report
   */
  getUsageReport(): string {
    const stats = this.getStats();
    
    return `
📊 AI Usage Report (${stats.date})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Cost: €${stats.totalCost.toFixed(3)} / €5.00 budget
📈 Queries: ${stats.queriesCount}
🔤 Tokens: ${stats.totalTokens.toLocaleString()} total
   ├─ Input: ${stats.inputTokens.toLocaleString()}
   └─ Output: ${stats.outputTokens.toLocaleString()}
💡 Avg cost/query: €${stats.averageCostPerQuery.toFixed(4)}
💵 Remaining budget: €${stats.remainingBudget.toFixed(3)}
📊 Budget used: ${((stats.totalCost / 5.0) * 100).toFixed(1)}%
    `;
  }

  /**
   * Reset stats (for new day/month)
   */
  resetStats(): void {
    this.stats = {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
      queriesCount: 0,
      date: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Check if query would exceed budget
   */
  wouldExceedBudget(inputText: string, outputEstimate: string = '', model: string = AI_CONFIG.OPENAI.MODEL): boolean {
    const inputTokens = this.estimateTokens(inputText);
    const outputTokens = this.estimateTokens(outputEstimate || inputText); // Estimate if not provided
    const estimatedCost = this.calculateCost(inputTokens, outputTokens, model);
    
    return (this.stats.totalCost + estimatedCost) > 5.0;
  }
}

// Singleton instance
let costMonitorInstance: CostMonitor | null = null;

export const getCostMonitor = (): CostMonitor => {
  if (!costMonitorInstance) {
    costMonitorInstance = new CostMonitor();
  }
  return costMonitorInstance;
};

export default CostMonitor;