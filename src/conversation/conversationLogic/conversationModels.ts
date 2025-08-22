// export interface Query {
//     prompt: string;
//     response?: string;
//     error?: string;
//     sources?: any[];
//     thought?: string;
//     attachments?: any[];
//     feedback?: FEEDBACK;
//     tool_calls?: any[];
//   }
  
//   export interface ConversationState {
//     queries: Query[];
//     status: Status;
//     conversationId: string | null;
//   }
  
//   export interface Answer {
//     conversationId: string | null;
//     title: string | null;
//     answer: string;
//     query: string;
//     result: string;
//     thought: string;
//     sources: any[];
//     tool_calls: any[];
//   }
  
//   export type Status = 'idle' | 'loading' | 'failed';
  
//   export enum FEEDBACK {
//     POSITIVE = 'POSITIVE',
//     NEGATIVE = 'NEGATIVE',
//   }