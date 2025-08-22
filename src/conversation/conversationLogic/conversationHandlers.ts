// /projects/resources/DocsGPT/frontend/src/conversation/conversationHandlers.ts
// import conversationService from '../api/services/conversationService';
// import { Answer } from './conversationModels';

// // Step 5: Streaming handler - processes the stream
// export function handleFetchAnswerStreaming(
//   question: string,
//   signal: AbortSignal,
//   onEvent: (event: MessageEvent) => void,
// ): Promise<Answer> {
  
//   const payload = {
//     question: question,
//     // Simplified payload - add other fields as needed
//     history: JSON.stringify([]),
//     conversation_id: null,
//     chunks: '3',
//     token_limit: 2000,
//     isNoneDoc: true,
//     save_conversation: false,
//   };

//   return new Promise<Answer>((resolve, reject) => {
//     conversationService
//       .answerStream(payload, null, signal) // Step 6: Call API service
//       .then((response) => {
//         if (!response.body) throw Error('No response body');

//         let buffer = '';
//         const reader = response.body.getReader();
//         const decoder = new TextDecoder('utf-8');

//         const processStream = ({
//           done,
//           value,
//         }: ReadableStreamReadResult<Uint8Array>) => {
//           if (done) {
//             resolve({
//               conversationId: null,
//               title: null,
//               answer: '',
//               query: question,
//               result: '',
//               thought: '',
//               sources: [],
//               tool_calls: [],
//             });
//             return;
//           }

//           const chunk = decoder.decode(value);
//           buffer += chunk;

//           // Split by double newlines (SSE format)
//           const events = buffer.split('\n\n');
//           buffer = events.pop() ?? '';

//           for (const event of events) {
//             if (event.trim().startsWith('data:')) {
//               const dataLine: string = event
//                 .split('\n')
//                 .map((line: string) => line.replace(/^data:\s?/, ''))
//                 .join('');

//               const messageEvent = new MessageEvent('message', {
//                 data: dataLine.trim(),
//               });

//               onEvent(messageEvent); // Send back to Redux
//             }
//           }

//           reader.read().then(processStream).catch(reject);
//         };

//         reader.read().then(processStream).catch(reject);
//       })
//       .catch((error) => {
//         console.error('Connection failed:', error);
//         reject(error);
//       });
//   });
// }