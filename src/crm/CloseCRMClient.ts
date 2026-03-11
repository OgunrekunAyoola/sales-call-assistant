import axios from 'axios';
import { CRMClient } from './CRMClient';
import { LeadContext, Disposition } from '../voiceAgent/types';

/**
 * Implementation of the CRMClient interface for Close CRM.
 */
export class CloseCRMClient implements CRMClient {
  private apiKey: string;
  private baseUrl = 'https://api.close.com/api/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Close API Key is required');
    }
    this.apiKey = apiKey;
  }

  private get authHeader() {
    return {
      Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
    };
  }

  async getLeadByPhone(phone: string): Promise<LeadContext | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/lead/`, {
        params: { query: `phone:"${phone}"` },
        headers: this.authHeader,
      });

      const lead = response.data.data[0];
      if (!lead) return null;

      return {
        id: lead.id,
        fullName: lead.display_name,
        company: lead.name,
        phone: phone,
        email: lead.contacts?.[0]?.emails?.[0]?.email,
        tags: lead.status_label ? [lead.status_label] : [],
        notes: lead.description,
      };
    } catch (error) {
      console.error('Error fetching lead from Close:', error);
      return null;
    }
  }

  async logCall(params: { 
    leadId: string; 
    disposition: Disposition; 
    summary: string; 
    rawTranscriptUrl?: string; 
  }): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/activity/call/`, {
        lead_id: params.leadId,
        note: `AI Call Outcome: ${params.disposition}\nSummary: ${params.summary}\nTranscript: ${params.rawTranscriptUrl || 'N/A'}`,
        status: 'completed',
        direction: 'outbound',
      }, {
        headers: this.authHeader,
      });
    } catch (error) {
      console.error('Error logging call in Close:', error);
    }
  }

  async updateLeadStatus(params: { leadId: string; status: string }): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/lead/${params.leadId}/`, {
        status: params.status,
      }, {
        headers: this.authHeader,
      });
    } catch (error) {
      console.error('Error updating lead status in Close:', error);
    }
  }

  async createFollowUpTask(params: { 
    leadId: string; 
    dueAt: string; 
    type: "CALL" | "EMAIL"; 
    note: string; 
  }): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/task/`, {
        lead_id: params.leadId,
        text: `AI Follow-up: ${params.note}`,
        date: params.dueAt,
        is_complete: false,
      }, {
        headers: this.authHeader,
      });
    } catch (error) {
      console.error('Error creating task in Close:', error);
    }
  }
}
