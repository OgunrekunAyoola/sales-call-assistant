export type CallStage = 
  | "INTRO" 
  | "PERMISSION" 
  | "PITCH" 
  | "QUALIFYING" 
  | "HANDLING_OBJECTION" 
  | "SCHEDULING" 
  | "WRAP_UP";

export type Disposition = 
  | "UNDECIDED" 
  | "QUALIFIED" 
  | "NOT_INTERESTED" 
  | "CALLBACK" 
  | "WRONG_NUMBER";

export type NextStep = 
  | "NONE" 
  | "SCHEDULE_MEETING" 
  | "SEND_INFO" 
  | "FOLLOW_UP_LATER";

export interface LeadContext {
  id: string;
  fullName: string;
  company?: string;
  jobTitle?: string;
  phone: string;
  email?: string;
  tags: string[];
  lastContactedAt?: string;
  notes?: string;
}

export interface AgentState {
  stage: CallStage;
  notes: string;
  disposition: Disposition;
  nextStep: NextStep;
}

export interface AgentInput {
  transcript: string;
  lead: LeadContext;
  state: AgentState;
}

export interface AgentOutput {
  reply: string;
  thinking: string;
  state: AgentState;
}
