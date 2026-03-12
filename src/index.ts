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
    const { call_id, phone_number, transcript_summary, disposition } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: 'Missing phone_number' });
    }

    // 1. Find lead in Close CRM
    const lead = await closeClient.getLeadByPhone(phone_number);
    if (!lead) {
      console.warn(`Lead not found for phone number: ${phone_number}`);
      return res.status(404).json({ error: 'Lead not found in CRM' });
    }

    // 2. Log Call Activity
    const summary = transcript_summary || 'No summary provided';
    const outcome = disposition || 'unknown';
    await closeClient.logCall({
      leadId: lead.id,
      disposition: outcome,
      summary,
    });

    // 3. Update Lead Status
    const statusMap: Record<string, string> = {
      'qualified': 'Qualified',
      'not_interested': 'Not Interested',
      'callback': 'Working',
      'wrong_number': 'Bad Fit'
    };
    
    const mappedStatus = statusMap[outcome.toLowerCase()];
    if (mappedStatus) {
      await closeClient.updateLeadStatus({ leadId: lead.id, status: mappedStatus });
    }

    // 4. Create Follow-up Task for 'callback'
    if (outcome.toLowerCase() === 'callback') {
      // Set to tomorrow at noon? Or just leaving without a specific date right now 
      // Close API accepts specific formats, we'll try a generic +1 day logic or skip if not strict
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isoDate = tomorrow.toISOString().split('T')[0]; // simple YYYY-MM-DD
      
      await closeClient.createFollowUpTask({
        leadId: lead.id,
        dueAt: isoDate,
        type: 'CALL',
        note: 'Follow up after AI call'
      });
    }

    console.log(`Successfully processed webhook for call ${call_id || 'unknown'} on lead ${lead.id}`);
    res.json({ success: true, lead_id: lead.id });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
