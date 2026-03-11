import { LeadContext, Disposition } from '../voiceAgent/types';

export interface CRMClient {
  getLeadByPhone(phone: string): Promise<LeadContext | null>;
  
  logCall(params: { 
    leadId: string; 
    disposition: Disposition; 
    summary: string; 
    rawTranscriptUrl?: string; 
  }): Promise<void>;
  
  updateLeadStatus(params: { 
    leadId: string; 
    status: string; 
  }): Promise<void>;
  
  createFollowUpTask(params: { 
    leadId: string; 
    dueAt: string; 
    type: "CALL" | "EMAIL"; 
    note: string; 
  }): Promise<void>;
}
