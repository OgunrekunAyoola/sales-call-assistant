import { handleTurn } from './engine/agentLoop';
import { AgentOutput, AgentState, LeadContext } from './types';
import { CloseCRMClient } from '../crm/CloseCRMClient';

const crm = new CloseCRMClient(process.env.CLOSE_API_KEY || "");

/**
 * Orchestrates a single turn of the conversation.
 * Now attempts to use Close CRM for lead data if available.
 */
export async function handleMockTurn(params: { 
  phoneNumber: string; 
  transcript: string; 
}): Promise<AgentOutput> {
  const { phoneNumber, transcript } = params;

  // Attempt to fetch real lead data from Close
  let lead: LeadContext | null = await crm.getLeadByPhone(phoneNumber);

  if (!lead) {
    // Fallback to mock lead if not found in CRM
    lead = {
      id: "mock-lead-123",
      fullName: "Test Lead",
      phone: phoneNumber,
      tags: ["MOCK_TEST"],
      notes: "Initialized via mock orchestrator"
    };
  }

  // Initialize a fresh AgentState starting at INTRO
  // In a real app, this state might be persisted in a DB using callId
  const state: AgentState = {
    stage: "INTRO",
    notes: "",
    disposition: "UNDECIDED",
    nextStep: "NONE"
  };

  // Call the agent loop to handle the turn
  const result = await handleTurn({
    transcript,
    lead,
    state
  });

  return result;
}
