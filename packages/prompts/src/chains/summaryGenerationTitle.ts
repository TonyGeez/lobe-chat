import { ChatStreamPayload } from '@lobechat/types';

export const chainSummaryGenerationTitle = (
  prompts: string[],
  modal: 'image' | 'video',
  locale: string,
): Partial<ChatStreamPayload> => {
  // Format multiple prompts for better readability
  const formattedPrompts = prompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n');

  return {
    messages: [
      {
        content: `You are an experienced AI art creator and linguistic expert. Based on the user's AI ${modal} prompts, you must generate a concise title summarizing the core concept of the creation. The title must be within 10 characters, contain no punctuation, and be written in the target language: ${locale}. This title will be used for identifying and organizing the作品 series.`,
        role: 'system',
      },
      {
        content: `Prompts:\n${formattedPrompts}`,
        role: 'user',
      },
    ],
  };
};