import { NextResponse } from "next/server";
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { HumanMessage } from "@langchain/core/messages";
import { getOllamaService } from "@/lib/ollama-service";

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { fiscalRegime, revenue, tvaApplicable } = await request.json();

    // Production: Use Google Gemini
    // const model = new ChatGoogleGenerativeAI({
    //   model: "gemini-1.5-flash",
    //   apiKey: process.env.GEMINI_API_KEY,
    // });
    
    // Development: Use local Ollama
    const ollamaService = getOllamaService();

    const prompt = `As a fiscal assistant for freelancers in France, provide advice based on the following. Respond in French.
    Current Fiscal Regime: ${fiscalRegime || 'Not specified'}
    Estimated Annual Revenue: ${revenue ? `${revenue}€` : 'Not specified'}
    Subject to TVA: ${tvaApplicable ? 'Yes' : 'No'}

    Please provide:
    1. A suggestion for the most suitable tax regime (Micro-BIC, BNC, SASU, EI, Other) if the current one is not specified or seems suboptimal for the given revenue.
    2. Relevant URSSAF thresholds for the specified or suggested regime.
    3. An estimate of net revenue after typical social contributions and taxes for the specified or suggested regime.
    4. General fiscal advice relevant to the inputs.

    Format your response as a JSON object with keys: taxRegimeSuggestion, urssafThresholds, netRevenueEstimate, generalAdvice.`;

    // const result = await model.invoke([new HumanMessage(prompt)]);
    // const text = result.content;
    
    // Use Ollama for development
    const text = await ollamaService.generate(prompt, { temperature: 0.2 });

    // Attempt to parse the response as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", text, parseError);
      // If parsing fails, return the raw text in a general advice field
      return NextResponse.json({ generalAdvice: text }, { status: 200 });
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error generating AI fiscal suggestions:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
