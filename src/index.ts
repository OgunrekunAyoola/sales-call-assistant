import 'dotenv/config';
import express, { Request, Response } from 'express';
import { registerTelephonyRoutes } from './voiceAgent/telephony/webhooks';
import { handleMockTurn } from './voiceAgent/orchestrator';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

/**
 * Manual test route for simulating a voice call turn.
 */
app.post('/test/mock-call', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, transcript } = req.body;
    const output = await handleMockTurn({ phoneNumber, transcript });
    res.json(output);
  } catch (error) {
    console.error("Error in test route:", error);
    res.status(500).json({ error: "internal_error" });
  }
});

registerTelephonyRoutes(app);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
