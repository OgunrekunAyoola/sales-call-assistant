import express, { Request, Response } from 'express';
import { handleMockTurn } from '../orchestrator';

export function registerTelephonyRoutes(app: express.Application) {
  /**
   * Mock webhook for receiving telephony events (e.g., transcripts).
   * Now wired into the agent orchestrator.
   */
  app.post("/webhooks/telephony/mock", async (req: Request, res: Response) => {
    try {
      const { phoneNumber, transcript } = req.body;
      
      console.log("Processing telephony webhook for:", phoneNumber);

      const agentOutput = await handleMockTurn({
        phoneNumber,
        transcript
      });

      res.json(agentOutput);
    } catch (error) {
      console.error("Error in telephony webhook:", error);
      res.status(500).json({ error: "internal_error" });
    }
  });
}
