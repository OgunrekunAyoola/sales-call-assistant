import 'dotenv/config';
import express, { Request, Response } from 'express';
import { CloseCRMClient } from './crm/CloseCRMClient';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const closeClient = new CloseCRMClient(process.env.CLOSE_API_KEY || '');

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// ElevenLabs Post-call Webhook
app.post('/webhooks/elevenlabs/call-finished', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    // We only care about transcription webhooks for CRM sync
    if (type !== 'post_call_transcription') {
      return res.json({ received: true, note: 'ignored_type' });
    }

    const { conversation_id, metadata, analysis, call_id } = data;

    // ElevenLabs metadata usually contains the phone number or custom identifiers
    // If the user uploads a CSV, they can map columns to these metadata keys
    const phone_number = metadata?.phone_number || metadata?.phone || data?.phone_number;
    const lead_id_from_metadata = metadata?.lead_id;

    if (!phone_number && !lead_id_from_metadata) {
      console.warn('Missing identification (phone/lead_id) in ElevenLabs webhook');
      return res.status(400).json({ error: 'Missing phone_number or lead_id in metadata' });
    }

    // 1. Find or Use Lead
    let lead;
    if (lead_id_from_metadata) {
      // If we have a direct ID, we could use it, but for safety let's verify or stick to phone-based lookup
      // since the current client is phone-centric. For now, we'll favor phone lookup if available.
      lead = { id: lead_id_from_metadata };
    }

    if (!lead && phone_number) {
      lead = await closeClient.getLeadByPhone(phone_number);
    }

    if (!lead) {
      console.warn(`Lead not found for: ${phone_number || lead_id_from_metadata}`);
      return res.status(404).json({ error: 'Lead not found in CRM' });
    }

    // 2. Log Call Activity
    // Analysis results usually contains 'summary' and 'data_collection_results' (dispositions)
    const summary = analysis?.summary || 'No summary provided';
    
    // Disposition mapping (ElevenLabs 'data_collection_results' or custom analysis)
    // For now, looking for a common key or default to 'unknown'
    const outcome = analysis?.data_collection_results?.outcome || analysis?.transcript_summary || 'unknown';
    
    await closeClient.logCall({
      leadId: lead.id,
      disposition: String(outcome),
      summary,
      rawTranscriptUrl: `https://elevenlabs.io/app/conversational-ai/${data.agent_id}/conversations/${conversation_id}`
    });

    // 3. Update Lead Status
    const statusMap: Record<string, string> = {
      'qualified': 'Qualified',
      'not_interested': 'Not Interested',
      'callback': 'Working',
      'wrong_number': 'Bad Fit'
    };
    
    const mappedStatus = statusMap[String(outcome).toLowerCase()];
    if (mappedStatus) {
      await closeClient.updateLeadStatus({ leadId: lead.id, status: mappedStatus });
    }

    // 4. Create Follow-up Task for 'callback'
    if (String(outcome).toLowerCase() === 'callback') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isoDate = tomorrow.toISOString().split('T')[0];
      
      await closeClient.createFollowUpTask({
        leadId: lead.id,
        dueAt: isoDate,
        type: 'CALL',
        note: `Follow up after AI call (${conversation_id})`
      });
    }

    console.log(`Successfully processed ElevenLabs webhook for conversation ${conversation_id} on lead ${lead.id}`);
    res.json({ success: true, lead_id: lead.id });
  } catch (error) {
    console.error('Error processing ElevenLabs webhook:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
