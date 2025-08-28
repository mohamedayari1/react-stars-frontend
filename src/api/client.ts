export const createSSEClient = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  return {
    async streamChat(
      message: string, 
      onChunk: (chunk: any) => void, 
      onComplete: () => void, 
      onError: (error: string) => void
    ) {
      try {
        const response = await fetch(`${baseURL}/gemini`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            message: {
              role: 'user',
              parts: [{ type: 'text', text: message }],
              id: crypto.randomUUID(),
            },
            selectedChatModel: 'gemini-pro',
            selectedVisibilityType: 'public',
            numResults: 5,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                onComplete();
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                onChunk(parsed);
              } catch (e) {
                console.warn('Failed to parse SSE data:', data);
              }
            }
          }
        }
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  };
};