import { AgentInput, AgentOutput } from '../types';
import { getAgentTurn } from './groqClient';

/**
 * Agent loop to handle a single conversation turn.
 * Now uses Groq LLM for dynamic responses.
 */
export async function handleTurn(input: AgentInput): Promise<AgentOutput> {
  return await getAgentTurn(input);
}
