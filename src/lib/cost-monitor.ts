// Enhanced Cost monitoring utility for AI usage with analytics and budgeting
import { AI_CONFIG, isOpenAIMode } from './ai-config';

interface UsageStats {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  queriesCount: number;
  date: string;
}

interface CostMetric {
  timestamp: Date;
  userId: string;
  queryType: string;
  route: string;
  actualCost: number;
  estimatedCost: number;
  tokensUsed?: number;
  processingTime: number;
  success: boolean;
}

interface UserBudget {
  userId: string;
  dailyLimit: number;
  monthlyLimit: number;
  currentDailySpend: number;
  currentMonthlySpend: number;
  alertThresholds: {
    daily: number[];
    monthly: number[];
  };
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

  // Enhanced tracking
  private costMetrics: Map<string, CostMetric[]> = new Map();
  private userBudgets: Map<string, UserBudget> = new Map();
  
  // Default budget settings
  private readonly DEFAULT_DAILY_LIMIT = 0.50;  // €0.50 per day
  private readonly DEFAULT_MONTHLY_LIMIT = 5.00; // €5.00 per month

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
   * Enhanced tracking for smart routing system
   */
  async trackQueryCost(
    userId: string,
    queryType: string,
    route: string,
    estimatedCost: number,
    actualCost: number,
    processingTime: number,
    success: boolean,
    tokensUsed?: number
  ): Promise<void> {
    const metric: CostMetric = {
      timestamp: new Date(),
      userId,
      queryType,
      route,
      actualCost,
      estimatedCost,
      tokensUsed,
      processingTime,
      success
    };

    // Store metric
    const userMetrics = this.costMetrics.get(userId) || [];
    userMetrics.push(metric);
    this.costMetrics.set(userId, userMetrics);

    // Update user budget tracking
    await this.updateUserSpend(userId, actualCost);

    // Update global stats for backward compatibility
    this.stats.totalCost += actualCost;
    this.stats.queriesCount += 1;
    if (tokensUsed) {
      this.stats.totalTokens += tokensUsed;
    }

    // Check for budget alerts
    await this.checkBudgetAlerts(userId, actualCost);
  }

  /**
   * Check if user can afford a query
   */
  async canAffordQuery(
    userId: string,
    estimatedCost: number
  ): Promise<{ allowed: boolean; reason?: string; remainingBudget: number }> {
    const budget = await this.getUserBudget(userId);

    // Check daily limit
    if (budget.currentDailySpend + estimatedCost > budget.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit exceeded. Current: €${budget.currentDailySpend.toFixed(3)}, Limit: €${budget.dailyLimit}`,
        remainingBudget: Math.max(0, budget.dailyLimit - budget.currentDailySpend)
      };
    }

    // Check monthly limit
    if (budget.currentMonthlySpend + estimatedCost > budget.monthlyLimit) {
      return {
        allowed: false,
        reason: `Monthly limit exceeded. Current: €${budget.currentMonthlySpend.toFixed(3)}, Limit: €${budget.monthlyLimit}`,
        remainingBudget: Math.max(0, budget.monthlyLimit - budget.currentMonthlySpend)
      };
    }

    return {
      allowed: true,
      remainingBudget: Math.min(
        budget.dailyLimit - budget.currentDailySpend,
        budget.monthlyLimit - budget.currentMonthlySpend
      )
    };
  }

  /**
   * Get cost analytics for a user
   */
  getCostAnalytics(userId: string, days: number = 30): {
    totalCost: number;
    avgCostPerQuery: number;
    costByRoute: Record<string, number>;
    savings: { amount: number; percentage: number };
    efficiency: { successRate: number; avgProcessingTime: number };
  } {
    const userMetrics = this.costMetrics.get(userId) || [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentMetrics = userMetrics.filter(m => m.timestamp >= cutoffDate);

    const totalCost = recentMetrics.reduce((sum, m) => sum + m.actualCost, 0);
    const avgCostPerQuery = recentMetrics.length > 0 ? totalCost / recentMetrics.length : 0;

    // Cost by route
    const costByRoute: Record<string, number> = {};
    recentMetrics.forEach(m => {
      costByRoute[m.route] = (costByRoute[m.route] || 0) + m.actualCost;
    });

    // Calculate savings compared to all-complex approach
    const complexCost = 0.025; // Average cost of complex route
    const wouldBeCost = recentMetrics.length * complexCost;
    const savings = {
      amount: Math.max(0, wouldBeCost - totalCost),
      percentage: wouldBeCost > 0 ? ((wouldBeCost - totalCost) / wouldBeCost) * 100 : 0
    };

    // Efficiency metrics
    const successfulQueries = recentMetrics.filter(m => m.success);
    const efficiency = {
      successRate: recentMetrics.length > 0 ? successfulQueries.length / recentMetrics.length : 1,
      avgProcessingTime: recentMetrics.length > 0 ? 
        recentMetrics.reduce((sum, m) => sum + m.processingTime, 0) / recentMetrics.length : 0
    };

    return {
      totalCost,
      avgCostPerQuery,
      costByRoute,
      savings,
      efficiency
    };
  }

  /**
   * Set user budget limits
   */
  async setUserBudget(
    userId: string,
    dailyLimit?: number,
    monthlyLimit?: number
  ): Promise<void> {
    const currentBudget = await this.getUserBudget(userId);
    
    const updatedBudget: UserBudget = {
      ...currentBudget,
      dailyLimit: dailyLimit ?? currentBudget.dailyLimit,
      monthlyLimit: monthlyLimit ?? currentBudget.monthlyLimit
    };

    this.userBudgets.set(userId, updatedBudget);
  }

  // Private helper methods

  private async getUserBudget(userId: string): Promise<UserBudget> {
    let budget = this.userBudgets.get(userId);
    
    if (!budget) {
      budget = {
        userId,
        dailyLimit: this.DEFAULT_DAILY_LIMIT,
        monthlyLimit: this.DEFAULT_MONTHLY_LIMIT,
        currentDailySpend: 0,
        currentMonthlySpend: 0,
        alertThresholds: {
          daily: [0.5, 0.8, 0.95],
          monthly: [0.7, 0.9, 0.95]
        }
      };
      
      await this.loadUserSpending(budget);
      this.userBudgets.set(userId, budget);
    }
    
    return budget;
  }

  private async updateUserSpend(userId: string, cost: number): Promise<void> {
    const budget = await this.getUserBudget(userId);
    budget.currentDailySpend += cost;
    budget.currentMonthlySpend += cost;
    this.userBudgets.set(userId, budget);
  }

  private async loadUserSpending(budget: UserBudget): Promise<void> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const userMetrics = this.costMetrics.get(budget.userId) || [];
    
    budget.currentDailySpend = userMetrics
      .filter(m => m.timestamp >= startOfDay)
      .reduce((sum, m) => sum + m.actualCost, 0);

    budget.currentMonthlySpend = userMetrics
      .filter(m => m.timestamp >= startOfMonth)
      .reduce((sum, m) => sum + m.actualCost, 0);
  }

  private async checkBudgetAlerts(userId: string, cost: number): Promise<void> {
    const budget = await this.getUserBudget(userId);

    // Check daily thresholds
    const dailyPercentage = budget.currentDailySpend / budget.dailyLimit;
    for (const threshold of budget.alertThresholds.daily) {
      if (dailyPercentage >= threshold && dailyPercentage - (cost / budget.dailyLimit) < threshold) {
        console.warn(`🚨 Daily Budget Alert for ${userId}: ${(threshold * 100).toFixed(0)}% reached (€${budget.currentDailySpend.toFixed(3)}/€${budget.dailyLimit})`);
      }
    }

    // Check monthly thresholds
    const monthlyPercentage = budget.currentMonthlySpend / budget.monthlyLimit;
    for (const threshold of budget.alertThresholds.monthly) {
      if (monthlyPercentage >= threshold && monthlyPercentage - (cost / budget.monthlyLimit) < threshold) {
        console.warn(`🚨 Monthly Budget Alert for ${userId}: ${(threshold * 100).toFixed(0)}% reached (€${budget.currentMonthlySpend.toFixed(3)}/€${budget.monthlyLimit})`);
      }
    }
  }

  /**
   * Reset daily costs for all users (call via cron job)
   */
  resetDailyCosts(): void {
    for (const [userId, budget] of this.userBudgets.entries()) {
      budget.currentDailySpend = 0;
      this.userBudgets.set(userId, budget);
    }
  }

  /**
   * Reset monthly costs for all users (call via cron job)
   */
  resetMonthlyCosts(): void {
    for (const [userId, budget] of this.userBudgets.entries()) {
      budget.currentMonthlySpend = 0;
      this.userBudgets.set(userId, budget);
    }
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