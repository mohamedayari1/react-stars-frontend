// filepath: /home/o__bit__o/projects/resources/DocsGPT/frontend/src/api/services/conversationService.ts
import apiClient from '../client';
import endpoints from '../endpoints';

const conversationService = {
  // Step 7: API call to streaming endpoint
  answerStream: (
    data: any,
    token: string | null,
    signal: AbortSignal,
  ): Promise<any> =>
    apiClient.post(
      endpoints.CONVERSATION.ANSWER_STREAMING,
      data,
      token,
      {},
      signal,
    ),
};

export default conversationService;