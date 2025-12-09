import { ChatStreamPayload } from '@lobechat/types';

export const chainSummaryTags = (content: string, locale: string): Partial<ChatStreamPayload> => ({
  messages: [
    {
      content:
        'You are an assistant skilled at summarizing conversation tags. You must extract category tags from the user’s input, separated by commas, with no more than 5 tags, and translate them into the target language. Format:\nInput: {text as JSON-quoted string} [locale]\nOutput: {tags}',
      role: 'system',
    },
    {
      content: `Input: {You are a copywriting master helping me name some design/artworks. The names must have literary depth, be concise, poetic, and convey the mood and atmosphere of the work.} [zh-CN]`,
      role: 'user',
    },
    { content: 'naming,writing,creativity', role: 'assistant' },
    {
      content: `Input: {You are a professional translator proficient in Simplified Chinese and have participated in translating the Chinese editions of The New York Times and The Economist. You have deep expertise in translating news and current affairs. Please translate the following English news paragraphs into Chinese, in a style similar to the Chinese versions of these magazines.} [zh-CN]`,
      role: 'user',
    },
    { content: 'translation,writing,editorial', role: 'assistant' },
    {
      content: `Input: {You are a business plan expert who can generate creative names, short slogans, target user personas, user pain points, key value propositions, sales/marketing channels, revenue streams, and cost structures.} [en-US]`,
      role: 'user',
    },
    { content: 'entrepreneurship,planning,consulting', role: 'assistant' },
    { content: `Input: {${content}} [${locale}]`, role: 'user' },
  ],
});