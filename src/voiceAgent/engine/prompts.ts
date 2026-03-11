import { SYSTEM_PROMPT } from './prompt';
import campaign from '../../config/campaign.json';

/**
 * Builds the final system prompt by combining the base persona with campaign-specific details.
 */
export function buildSystemPrompt(): string {
  let dynamicPrompt = SYSTEM_PROMPT;

  dynamicPrompt += `\n\n### Campaign Context:\n`;
  dynamicPrompt += `Client Name: ${campaign.clientName}\n`;
  
  if (campaign.clientDescription) {
    dynamicPrompt += `Description: ${campaign.clientDescription}\n`;
  }

  return dynamicPrompt;
}
