// LangGraph Multi-Agent System for French Micro-Entrepreneur Fiscal Expertise
// Specialized agents working together for comprehensive fiscal advice

// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getOllamaService, OllamaLangChainLLM } from "./ollama-service";
import { END, START, StateGraph } from "@langchain/langgraph";
import { getMemoryService } from "./ai-memory";
import { UserFiscalProfile } from "./fiscal-context";

// State interface for agent communication
export interface FiscalAgentState {
  query: string;
  fiscalProfile: UserFiscalProfile;
  memoryContext: string;
  
  // Agent outputs
  analysisResult?: string;
  expertAdvice?: string;
  riskAssessment?: string;
  finalResponse?: string;
  
  // Workflow control
  nextAgent?: string;
  completed: boolean;
}

// Base Agent class
abstract class FiscalAgent {
  // protected llm: ChatGoogleGenerativeAI; // Commented for production use
  protected llm: OllamaLangChainLLM;
  protected name: string;

  constructor(name: string) {
    this.name = name;
    // Production: Use Google Gemini
    // this.llm = new ChatGoogleGenerativeAI({
    //   model: "gemini-2.5-flash",
    //   apiKey: process.env.GEMINI_API_KEY,
    //   temperature: 0.1,
    // });
    
    // Development: Use local Ollama
    this.llm = new OllamaLangChainLLM('deepseek-coder-v2:latest', { temperature: 0.1 });
  }

  abstract process(state: FiscalAgentState): Promise<FiscalAgentState>;
  
  protected async callLLM(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const result = await this.llm.invoke([
        new SystemMessage({ content: systemPrompt }) as any,
        new HumanMessage({ content: userMessage }) as any
      ]);
      return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
    } catch (error) {
      console.error(`Error in ${this.name}:`, error);
      return `Erreur lors du traitement par ${this.name}`;
    }
  }
}

// 1. Fiscal Analyst Agent - Analyzes user data and identifies key insights
class FiscalAnalystAgent extends FiscalAgent {
  constructor() {
    super("Analyste Fiscal");
  }

  async process(state: FiscalAgentState): Promise<FiscalAgentState> {
    const systemPrompt = `Tu es un ANALYSTE FISCAL EXPERT spécialisé dans l'analyse de données micro-entrepreneur.

🎯 TON RÔLE :
- Analyser les données financières et fiscales de l'utilisateur
- Identifier les tendances, opportunités et points d'attention
- Préparer un rapport d'analyse structuré pour les autres agents
- Détecter les risques fiscaux potentiels

📊 ANALYSE REQUISE :
- Progression vers les seuils fiscaux (BNC/BIC)
- Évolution du chiffre d'affaires
- Performance clients et facturation
- Respect des obligations fiscales
- Opportunités d'optimisation

💡 FORMAT DE SORTIE :
Produis une analyse structurée en français avec :
- État financier actuel
- Tendances observées
- Points d'attention identifiés
- Recommandations préliminaires`;

    const analysisQuery = `
DONNÉES UTILISATEUR À ANALYSER :
${JSON.stringify(state.fiscalProfile, null, 2)}

CONTEXTE MÉMOIRE :
${state.memoryContext}

QUESTION UTILISATEUR :
${state.query}

Produis une analyse complète de la situation fiscale.`;

    const analysisResult = await this.callLLM(systemPrompt, analysisQuery);

    return {
      ...state,
      analysisResult,
      nextAgent: this.determineNextAgent(state.query, analysisResult)
    };
  }

  private determineNextAgent(query: string, analysis: string): string {
    // Simple routing logic - could be enhanced with ML
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('risque') || queryLower.includes('problème') || analysis.includes('ATTENTION')) {
      return 'risk';
    } else if (queryLower.includes('optimis') || queryLower.includes('conseil') || queryLower.includes('stratégie')) {
      return 'expert';
    } else {
      return 'expert'; // Default to expert
    }
  }
}

// 2. Risk Assessment Agent - Specialized in identifying and mitigating fiscal risks
class RiskAssessmentAgent extends FiscalAgent {
  constructor() {
    super("Évaluateur de Risques");
  }

  async process(state: FiscalAgentState): Promise<FiscalAgentState> {
    const systemPrompt = `Tu es un ÉVALUATEUR DE RISQUES FISCAUX spécialisé micro-entrepreneur.

🎯 TON RÔLE :
- Identifier tous les risques fiscaux potentiels
- Évaluer la gravité et probabilité de chaque risque
- Proposer des stratégies de mitigation
- Alerter sur les actions urgentes nécessaires

⚠️ RISQUES À ÉVALUER :
- Dépassement de seuils (TVA, URSSAF)
- Retards de paiement clients
- Non-conformité déclarative
- Risques de redressement
- Dépendance client excessive

🚨 FORMAT D'ALERTE :
- URGENT (action immédiate requise)
- ATTENTION (à surveiller)
- PRÉVENTIF (bonnes pratiques)`;

    const riskQuery = `
ANALYSE PRÉLIMINAIRE :
${state.analysisResult}

DONNÉES UTILISATEUR :
${JSON.stringify(state.fiscalProfile, null, 2)}

QUESTION :
${state.query}

Évalue tous les risques fiscaux et propose des solutions.`;

    const riskAssessment = await this.callLLM(systemPrompt, riskQuery);

    return {
      ...state,
      riskAssessment,
      nextAgent: 'expert'
    };
  }
}

// 3. Fiscal Expert Agent - Provides comprehensive advice and recommendations
class FiscalExpertAgent extends FiscalAgent {
  constructor() {
    super("Expert Fiscal");
  }

  async process(state: FiscalAgentState): Promise<FiscalAgentState> {
    const systemPrompt = `Tu es l'EXPERT-COMPTABLE CONSEIL FINAL spécialisé micro-entrepreneur.

🎯 TON RÔLE :
- Synthétiser toutes les analyses précédentes
- Fournir des conseils fiscaux personnalisés et actionnables
- Proposer un plan d'action concret
- Répondre directement à la question de l'utilisateur

💡 TON STYLE :
- Pédagogique et rassurant
- Exemples concrets avec chiffres
- Actionnable avec étapes claires
- Émojis et structure claire
- Mention des échéances importantes

📋 STRUCTURE RECOMMANDÉE :
1. Réponse directe à la question
2. Analyse de la situation
3. Recommandations spécifiques
4. Plan d'action
5. Points de vigilance`;

    const expertQuery = `
ANALYSE COMPLÈTE :
${state.analysisResult}

${state.riskAssessment ? `ÉVALUATION DES RISQUES :\n${state.riskAssessment}` : ''}

CONTEXTE MÉMOIRE :
${state.memoryContext}

DONNÉES UTILISATEUR :
- CA Encaissé 2025 : ${state.fiscalProfile.revenue.totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
- Progression seuil BNC : ${state.fiscalProfile.compliance.bncThresholdProgress.toFixed(1)}%
- Nombre de clients : ${state.fiscalProfile.clients.total}
- Délai de paiement moyen : ${state.fiscalProfile.clients.averagePaymentDelay.toFixed(0)} jours

QUESTION UTILISATEUR :
${state.query}

Fournis une réponse experte complète et personnalisée.`;

    const expertAdvice = await this.callLLM(systemPrompt, expertQuery);

    return {
      ...state,
      expertAdvice,
      finalResponse: expertAdvice,
      completed: true
    };
  }
}

// Agent Router - Determines which agent should handle the request
function routeAgent(state: FiscalAgentState): string {
  if (!state.analysisResult) {
    return 'analyst';
  } else if (state.nextAgent === 'risk' && !state.riskAssessment) {
    return 'risk';
  } else if (!state.expertAdvice) {
    return 'expert';
  } else {
    return END;
  }
}

// Multi-Agent Workflow Orchestrator
export class FiscalAgentOrchestrator {
  private workflow: StateGraph<FiscalAgentState>;
  private agents: Map<string, FiscalAgent>;

  constructor() {
    // Initialize agents
    this.agents = new Map([
      ['analyst', new FiscalAnalystAgent()],
      ['risk', new RiskAssessmentAgent()],
      ['expert', new FiscalExpertAgent()]
    ]);

    // Build workflow graph
    this.workflow = new StateGraph<FiscalAgentState>({
      channels: {
        query: null,
        fiscalProfile: null,
        memoryContext: null,
        analysisResult: null,
        expertAdvice: null,
        riskAssessment: null,
        finalResponse: null,
        nextAgent: null,
        completed: null
      }
    });

    // Add nodes
    this.workflow.addNode('analyst', (state) => this.agents.get('analyst')!.process(state));
    this.workflow.addNode('risk', (state) => this.agents.get('risk')!.process(state));
    this.workflow.addNode('expert', (state) => this.agents.get('expert')!.process(state));

    // Add edges
    this.workflow.addEdge(START as any, 'analyst' as any);
    this.workflow.addConditionalEdges('analyst' as any, routeAgent, {
      'risk': 'risk',
      'expert': 'expert',
      [END]: END
    } as any);
    this.workflow.addEdge('risk' as any, 'expert' as any);
    this.workflow.addEdge('expert' as any, END as any);
  }

  async processQuery(
    query: string, 
    fiscalProfile: UserFiscalProfile, 
    memoryContext: string
  ): Promise<string> {
    try {
      const initialState: FiscalAgentState = {
        query,
        fiscalProfile,
        memoryContext,
        completed: false
      };

      // Compile and run the workflow
      const app = this.workflow.compile();
      const result = await app.invoke(initialState as any);

      return (result as any).finalResponse || "Désolé, je n'ai pas pu traiter votre demande.";
    } catch (error) {
      console.error('Error in agent orchestration:', error);
      return "❌ **Erreur système** : Impossible de traiter la demande avec les agents spécialisés.";
    }
  }

  // Advanced routing with machine learning potential
  async intelligentRouting(query: string, fiscalProfile: UserFiscalProfile): Promise<string[]> {
    // This could be enhanced with ML models for better agent selection
    const queryLower = query.toLowerCase();
    const agents = ['analyst']; // Always start with analysis

    // Add specialized agents based on query intent
    if (queryLower.includes('risque') || queryLower.includes('problème') || 
        fiscalProfile.compliance.bncThresholdProgress > 80) {
      agents.push('risk');
    }

    agents.push('expert'); // Always end with expert advice
    return agents;
  }
}

// Singleton instance
let orchestratorInstance: FiscalAgentOrchestrator | null = null;

export const getFiscalOrchestrator = (): FiscalAgentOrchestrator => {
  if (!orchestratorInstance) {
    orchestratorInstance = new FiscalAgentOrchestrator();
  }
  return orchestratorInstance;
};

export default FiscalAgentOrchestrator;