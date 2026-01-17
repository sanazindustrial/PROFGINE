// Types for Professor GENIE LMS Integration
export type PageKind = "discussion" | "submission" | "unknown";

export type LMSId = "canvas" | "moodle" | "d2l" | "blackboard" | "generic";

export type ExtractedPayload = {
  lms: LMSId;
  kind: "discussion" | "submission";
  url: string;

  prompt?: string;
  studentText?: string;
  student?: { name?: string; id?: string };
  files?: { name: string; url: string }[];
  rubric?: string;

  targets: {
    feedbackBox?: HTMLElement;      // textarea or rich editor container
    gradeInput?: HTMLInputElement;  // points input
    replyBox?: HTMLElement;         // discussion reply editor container
    submitButton?: HTMLElement;     // save/post button
  };
};

export type GradeRequest = {
  kind: "discussion" | "assignment";
  lms: string;
  url: string;
  prompt?: string;
  studentText?: string;
  rubric?: string;
  maxPoints?: number;
  tone?: "supportive" | "direct";
};

export type GradeResponse = {
  feedback: string;
  score?: number;
  confidence: number;
  rubricBreakdown?: Array<{ criterion: string; score: number; notes: string }>;
  flags?: string[];
};

export interface LMSAdapter {
  id: LMSId;
  matches(url: string, doc: Document): boolean;
  detectPageType(doc: Document): PageKind;
  
  extract(doc: Document, url: string): Promise<ExtractedPayload>;
  
  applyFeedback(target: HTMLElement, text: string): Promise<void>;
  applyGrade(target: HTMLInputElement, score: number): Promise<void>;
  submit(button: HTMLElement): Promise<void>;
  
  // Helper methods
  findButtonByText?(texts: string[]): HTMLElement | undefined;
  findTextareaByLabel?(label: string): HTMLTextAreaElement | undefined;
  queryByLabelText?(label: string): HTMLElement | undefined;
  findTextareaNearText?(text: string): HTMLTextAreaElement | undefined;
}

// Duplicate interface definitions have been consolidated above

export interface ExtensionConfig {
  apiBaseUrl: string;
  authToken?: string;
  preferences: {
    autoDetect: boolean;
    autoGenerate: boolean;
    defaultTone: "supportive" | "direct" | "detailed";
    confirmBeforeSubmit: boolean;
  };
}