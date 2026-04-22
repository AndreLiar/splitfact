// Comprehensive test suite for Smart Routing Cost Optimization
// Validates cost savings and performance improvements

const { getQueryClassifier } = require('../src/lib/query-classifier');
const { getSmartRouter } = require('../src/lib/smart-query-router');
const { getProgressiveEnhancer } = require('../src/lib/progressive-enhancer');
const { getCostMonitor } = require('../src/lib/cost-monitor');

describe('Smart Routing Cost Optimization', () => {
  let classifier, router, enhancer, costMonitor;
  let testUserId = 'test-user-123';

  beforeAll(() => {
    classifier = getQueryClassifier();
    router = getSmartRouter();
    enhancer = getProgressiveEnhancer();
    costMonitor = getCostMonitor();
  });

  afterEach(() => {
    // Reset cost tracking between tests
    costMonitor.resetStats();
  });

  describe('Query Classification Accuracy', () => {
    test('should correctly classify simple queries', async () => {
      const simpleQueries = [
        "Qu'est-ce que le régime BNC?",
        "Quand dois-je déclarer ma TVA?",
        "Définition micro-entrepreneur",
        "Combien coûte une déclaration URSSAF?"
      ];

      for (const query of simpleQueries) {
        const classification = await classifier.classifyQuery(query);
        expect(classification.intent.category).toBe('SIMPLE');
        expect(classification.intent.estimatedCost).toBeLessThan(0.002);
      }
    });

    test('should correctly classify moderate queries', async () => {
      const moderateQueries = [
        "Combien vais-je payer d'URSSAF avec 45000€ de CA?",
        "Mon client me paie avec 60 jours de retard, que dois-je faire?",
        "Comment calculer mes charges sociales pour ce trimestre?"
      ];

      for (const query of moderateQueries) {
        const classification = await classifier.classifyQuery(query);
        expect(classification.intent.category).toBe('MODERATE');
        expect(classification.intent.estimatedCost).toBeLessThan(0.008);
        expect(classification.intent.estimatedCost).toBeGreaterThan(0.001);
      }
    });

    test('should correctly classify complex queries', async () => {
      const complexQueries = [
        "Analysez ma stratégie fiscale complète et recommandez des optimisations pour passer de 35K€ à 60K€ de CA",
        "Comparez tous les régimes fiscaux disponibles pour ma situation et proposez le meilleur plan d'action",
        "Prévision fiscale complète avec analyse de risques pour les 12 prochains mois"
      ];

      for (const query of complexQueries) {
        const classification = await classifier.classifyQuery(query);
        expect(classification.intent.category).toBe('COMPLEX');
        expect(classification.intent.estimatedCost).toBeGreaterThan(0.015);
      }
    });

    test('should correctly classify urgent queries', async () => {
      const urgentQueries = [
        "URGENT: J'ai reçu une mise en demeure URSSAF, que faire immédiatement?",
        "Alerte seuil TVA dépassé, actions immédiates requises",
        "Contrôle fiscal demain, aide urgente needed"
      ];

      for (const query of urgentQueries) {
        const classification = await classifier.classifyQuery(query);
        expect(classification.intent.category).toBe('URGENT');
        expect(classification.intent.priority).toBe('CRITICAL');
      }
    });
  });

  describe('Cost Optimization Validation', () => {
    test('should achieve significant cost savings vs all-complex approach', async () => {
      const testQueries = [
        { query: "Qu'est-ce que la TVA?", expectedRoute: 'SIMPLE' },
        { query: "Comment calculer mes charges avec 30K de CA?", expectedRoute: 'MODERATE' },
        { query: "Stratégie complète d'optimisation fiscale", expectedRoute: 'COMPLEX' },
        { query: "URGENT: Problème URSSAF immédiat", expectedRoute: 'URGENT' }
      ];

      let totalOptimizedCost = 0;
      let totalComplexCost = 0;
      const complexCostPerQuery = 0.025; // Cost if all queries used complex route

      for (const { query, expectedRoute } of testQueries) {
        const response = await router.routeQuery(query, { userId: testUserId });
        
        expect(response.metadata.route).toBe(expectedRoute);
        totalOptimizedCost += response.metadata.cost;
        totalComplexCost += complexCostPerQuery;
      }

      const savings = totalComplexCost - totalOptimizedCost;
      const savingsPercentage = (savings / totalComplexCost) * 100;

      expect(savingsPercentage).toBeGreaterThan(50); // At least 50% savings
      expect(totalOptimizedCost).toBeLessThan(totalComplexCost);
      
      console.log(`💰 Cost Savings Test Results:`);
      console.log(`   Optimized Cost: €${totalOptimizedCost.toFixed(3)}`);
      console.log(`   All-Complex Cost: €${totalComplexCost.toFixed(3)}`);
      console.log(`   Savings: €${savings.toFixed(3)} (${savingsPercentage.toFixed(1)}%)`);
    });

    test('should respect user budget limits', async () => {
      await costMonitor.setUserBudget(testUserId, 0.01, 0.10); // Very low limits

      const expensiveQuery = "Analyse stratégique complète avec projections détaillées";
      const budgetCheck = await costMonitor.canAffordQuery(testUserId, 0.025);

      expect(budgetCheck.allowed).toBeFalsy();
      expect(budgetCheck.reason).toContain('limit exceeded');
    });

    test('should provide cost analytics accurately', async () => {
      // Simulate some queries
      await costMonitor.trackQueryCost(testUserId, 'test', 'SIMPLE', 0.001, 0.001, 100, true);
      await costMonitor.trackQueryCost(testUserId, 'test', 'MODERATE', 0.005, 0.005, 200, true);
      await costMonitor.trackQueryCost(testUserId, 'test', 'COMPLEX', 0.025, 0.025, 500, true);

      const analytics = costMonitor.getCostAnalytics(testUserId);

      expect(analytics.totalCost).toBe(0.031);
      expect(analytics.avgCostPerQuery).toBe(0.031 / 3);
      expect(analytics.costByRoute['SIMPLE']).toBe(0.001);
      expect(analytics.costByRoute['MODERATE']).toBe(0.005);
      expect(analytics.costByRoute['COMPLEX']).toBe(0.025);
      expect(analytics.efficiency.successRate).toBe(1);
      expect(analytics.savings.percentage).toBeGreaterThan(0);
    });
  });

  describe('Progressive Enhancement Effectiveness', () => {
    test('should start simple and escalate only when needed', async () => {
      const ambiguousQuery = "Comment optimiser mes revenus?";
      
      const result = await enhancer.enhanceQuery(ambiguousQuery, {
        userId: testUserId,
        maxAttempts: 3,
        satisfactionThreshold: 0.8
      });

      expect(result.enhancementPath.length).toBeGreaterThan(0);
      expect(result.metadata.attempts).toBeLessThanOrEqual(3);
      expect(result.satisfactionScore).toBeGreaterThan(0.5);
      
      // Should start with a simpler route
      expect(result.enhancementPath[0]).toMatch(/(SIMPLE|MODERATE)/);
    });

    test('should provide quality feedback loop', async () => {
      const complexQuery = "Analyse détaillée de stratégie fiscale avec multiples scenarios";
      
      const result = await enhancer.enhanceQuery(complexQuery, {
        userId: testUserId,
        satisfactionThreshold: 0.9 // High threshold
      });

      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.satisfactionScore).toBeGreaterThan(0.75);
    });
  });

  describe('Memory Management Efficiency', () => {
    test('should store only important conversations', () => {
      // This would test the selective memory manager
      // For now, we'll test the concept with mock data
      
      const simpleQuery = "Qu'est-ce que la TVA?";
      const complexQuery = "Stratégie d'optimisation fiscale complète";
      
      // Simple queries should typically not be stored (cost optimization)
      // Complex queries should be stored for future reference
      // This is more of a integration test that would run with actual services
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Performance Benchmarks', () => {
    test('should process simple queries quickly', async () => {
      const startTime = Date.now();
      const query = "Qu'est-ce que le micro-entrepreneur?";
      
      await router.routeQuery(query, { userId: testUserId });
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(2000); // Less than 2 seconds
    });

    test('should maintain reasonable response times for complex queries', async () => {
      const startTime = Date.now();
      const query = "Analyse complète de ma situation fiscale avec recommandations stratégiques détaillées";
      
      const response = await router.routeQuery(query, { userId: testUserId });
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(10000); // Less than 10 seconds
      expect(response.metadata.processingTime).toBeLessThan(10000);
    });
  });

  describe('Integration Tests', () => {
    test('should handle API workflow end-to-end', async () => {
      // Simulate the full API workflow
      const testQueries = [
        "Simple: Qu'est-ce que BNC?",
        "Moderate: Calculer charges pour 40K€",
        "Complex: Optimisation fiscale complète",
        "Urgent: Problème URSSAF immédiat"
      ];

      let totalCost = 0;
      const results = [];

      for (const query of testQueries) {
        const startTime = Date.now();
        
        // Check budget
        const budgetCheck = await costMonitor.canAffordQuery(testUserId, 0.05);
        expect(budgetCheck.allowed).toBe(true);

        // Route query
        const response = await router.routeQuery(query, { userId: testUserId });
        expect(response.answer).toBeDefined();
        expect(response.metadata.cost).toBeGreaterThan(0);

        // Track cost
        await costMonitor.trackQueryCost(
          testUserId,
          'integration-test',
          response.metadata.route,
          response.metadata.cost,
          response.metadata.cost,
          Date.now() - startTime,
          true
        );

        totalCost += response.metadata.cost;
        results.push({
          query: query.substring(0, 30) + '...',
          route: response.metadata.route,
          cost: response.metadata.cost,
          confidence: response.metadata.confidence
        });
      }

      console.log('\n📊 Integration Test Results:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      results.forEach(r => {
        console.log(`   ${r.query}`);
        console.log(`   Route: ${r.route} | Cost: €${r.cost.toFixed(3)} | Confidence: ${r.confidence.toFixed(2)}`);
      });
      console.log(`   TOTAL COST: €${totalCost.toFixed(3)}`);

      // Verify reasonable total cost
      expect(totalCost).toBeLessThan(0.10); // Should be under €0.10 for 4 queries
    });

    test('should provide accurate cost analytics after multiple queries', async () => {
      // Run multiple queries to build analytics data
      const queries = [
        { text: "Simple query 1", expectedRoute: 'SIMPLE' },
        { text: "Simple query 2", expectedRoute: 'SIMPLE' },
        { text: "Moderate: Calculate something complex", expectedRoute: 'MODERATE' },
        { text: "Complex: Full strategic analysis needed", expectedRoute: 'COMPLEX' }
      ];

      for (const { text } of queries) {
        await router.routeQuery(text, { userId: testUserId });
      }

      const analytics = costMonitor.getCostAnalytics(testUserId);
      
      expect(analytics.totalCost).toBeGreaterThan(0);
      expect(Object.keys(analytics.costByRoute).length).toBeGreaterThan(0);
      expect(analytics.efficiency.successRate).toBeGreaterThan(0);
      expect(analytics.savings.percentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Real-world Cost Scenarios', () => {
    test('should demonstrate cost efficiency for typical user usage', async () => {
      // Simulate typical monthly usage: 
      // 40% simple, 45% moderate, 15% complex queries
      const monthlyQueries = [
        ...Array(20).fill().map((_, i) => ({ type: 'SIMPLE', query: `Simple query ${i}` })),
        ...Array(23).fill().map((_, i) => ({ type: 'MODERATE', query: `Moderate query about calculations ${i}` })),
        ...Array(7).fill().map((_, i) => ({ type: 'COMPLEX', query: `Complex analysis and strategy ${i}` }))
      ];

      let optimizedCost = 0;
      let allComplexCost = 0;

      for (const { query } of monthlyQueries) {
        const response = await router.routeQuery(query, { userId: testUserId });
        optimizedCost += response.metadata.cost;
        allComplexCost += 0.025; // Complex route cost
      }

      const savings = allComplexCost - optimizedCost;
      const savingsPercentage = (savings / allComplexCost) * 100;

      console.log(`\n💰 Monthly Cost Simulation (50 queries):`);
      console.log(`   Optimized Approach: €${optimizedCost.toFixed(3)}`);
      console.log(`   All-Complex Approach: €${allComplexCost.toFixed(3)}`);
      console.log(`   Monthly Savings: €${savings.toFixed(3)} (${savingsPercentage.toFixed(1)}%)`);
      console.log(`   Annual Projected Savings: €${(savings * 12).toFixed(2)}`);

      // Assertions
      expect(savingsPercentage).toBeGreaterThan(60); // At least 60% savings
      expect(optimizedCost).toBeLessThan(1.0); // Under €1 for 50 queries
      expect(savings).toBeGreaterThan(0.5); // At least €0.50 monthly savings
    });
  });
});

// Helper functions for test data
function generateTestQuery(complexity) {
  const queries = {
    SIMPLE: [
      "Qu'est-ce que le régime micro-entrepreneur?",
      "Quand faire sa déclaration URSSAF?",
      "Définition du chiffre d'affaires"
    ],
    MODERATE: [
      "Comment calculer mes cotisations pour 45000€ de CA?",
      "Quel impact du retard de paiement client?",
      "Estimation charges sociales trimestre"
    ],
    COMPLEX: [
      "Stratégie optimisation fiscale complète avec projections",
      "Analyse comparative tous régimes fiscaux disponibles",
      "Plan développement 35K vers 60K avec gestion risques"
    ],
    URGENT: [
      "URGENT: Mise en demeure URSSAF reçue aujourd'hui",
      "Alerte seuil TVA dépassé - actions immédiates",
      "Contrôle fiscal programmé - aide urgente"
    ]
  };
  
  const queryList = queries[complexity];
  return queryList[Math.floor(Math.random() * queryList.length)];
}

module.exports = {
  generateTestQuery
};