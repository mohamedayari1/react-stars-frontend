import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import store from '../store';
import { handleFetchAnswerStreaming } from './conversationHandlers';
import { Answer, ConversationState, Query, Status } from './conversationModels';

const initialState: ConversationState = {
  queries: [],
  status: 'idle',
  conversationId: null,
};

// Global abort controller for request cancellation
let abortController: AbortController | null = null;

export function handleAbort() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

// Step 4: Redux Thunk - handles streaming API call
export const fetchAnswerStream = createAsyncThunk<
  Answer,
  { question: string }
>('fetchAnswerStream', async ({ question }, { dispatch, getState }) => {
  // Cancel any existing request
  if (abortController) abortController.abort();
  abortController = new AbortController();
  const { signal } = abortController;

  const state = getState() as RootState;

  try {
    // Call the streaming handler
    await handleFetchAnswerStreaming(
      question,
      signal,
      (event) => {
        const data = JSON.parse(event.data);
        const targetIndex = state.conversation.queries.length - 1;

        if (data.type === 'end') {
          // Stream ended
          dispatch(conversationSlice.actions.setStatus('idle'));
        } else if (data.type === 'error') {
          // Handle errors
          dispatch(conversationSlice.actions.setStatus('failed'));
          dispatch(
            conversationSlice.actions.raiseError({
              index: targetIndex,
              message: data.error,
            }),
          );
        } else {
          // Handle streaming response chunks
          dispatch(
            updateStreamingQuery({
              index: targetIndex,
              query: { response: data.answer },
            }),
          );
        }
      }
    );
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      dispatch(conversationSlice.actions.setStatus('failed'));
    }
  }

  return {
    conversationId: null,
    title: null,
    answer: '',
    query: question,
    result: '',
    thought: '',
    sources: [],
    tool_calls: [],
  };
});

export const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    addQuery(state, action: PayloadAction<Query>) {
      state.queries.push(action.payload);
    },
    updateStreamingQuery(
      state,
      action: PayloadAction<{
        index: number;
        query: Partial<Query>;
      }>,
    ) {
      const { index, query } = action.payload;
      
      // Append streaming response chunks
      if (query.response !== undefined) {
        const currentResponse = state.queries[index]?.response || '';
        state.queries[index].response = currentResponse + query.response;
      }
    },
    setStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    raiseError(
      state,
      action: PayloadAction<{
        index: number;
        message: string;
      }>,
    ) {
      const { index, message } = action.payload;
      state.queries[index].error = message;
    },
    resetConversation: (state) => {
      state.queries = initialState.queries;
      state.status = initialState.status;
      state.conversationId = initialState.conversationId;
      handleAbort();
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAnswerStream.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAnswerStream.rejected, (state, action) => {
        if (action.meta.aborted) {
          state.status = 'idle';
          return state;
        }
        state.status = 'failed';
        state.queries[state.queries.length - 1].error = 'Something went wrong';
      });
  },
});

type RootState = ReturnType<typeof store.getState>;

export const selectQueries = (state: RootState) => state.conversation.queries;
export const selectStatus = (state: RootState) => state.conversation.status;

export const {
  addQuery,
  updateStreamingQuery,
  setStatus,
  raiseError,
  resetConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;