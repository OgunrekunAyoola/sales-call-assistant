import Groq from "groq-sdk";
import { AgentInput, AgentOutput } from "../types";
import { buildSystemPrompt } from "./prompts";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Handles communication with the Groq LLM to generate the agent's response and state.
 */
export async function getAgentTurn(input: AgentInput): Promise<AgentOutput> {
  const { transcript, lead, state } = input;
  const systemPrompt = buildSystemPrompt();

  const userPrompt = `
LEAD CONTEXT:
${JSON.stringify(lead, null, 2)}

CURRENT STATE:
${JSON.stringify(state, null, 2)}

LAST USER TRANSCRIPT:
"${transcript}"

Provide your response in the required JSON format.
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from Groq");
    }

    return JSON.parse(content) as AgentOutput;
  } catch (error) {
    console.error("Error calling Groq:", error);
    
    // Fallback response to avoid crashing the call
    return {
      reply: "I'm sorry, I seem to be having a technical issue. I'll have a human follow up with you.",
      thinking: "Groq API call failed. Returning fallback response.",
      state: {
        ...state,
        disposition: "UNDECIDED",
        nextStep: "FOLLOW_UP_LATER"
      }
    };
  }
}
