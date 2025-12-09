import { ChatStreamPayload } from '@lobechat/types';

/**
 * summary agent name for user prompt
 */
export const chainSummaryAgentName = (
  content: string,
  locale: string,
): Partial<ChatStreamPayload> => ({
  messages: [
    {
      content: `You are a naming master skilled at creating names with literary depth. Names must be concise, meaningful, and evocative. You need to summarize the user’s description into a role name within 10 characters and translate it into the target language. Format requirements:\nInput: {text as JSON-quoted string} [locale]\nOutput: {role name}`,
      role: 'system',
    },
    {
      content: `Input: {You are a copywriting master helping me name some design/artworks. The names must have literary depth, be concise, poetic, and convey the atmosphere and emotion of the work.} [zh-CN]`,
      role: 'user',
    },
    {
      content: `Input: {You are a UX Writer skilled at transforming ordinary descriptions into excellent, refined expressions. The user's input should be rewritten into a better phrasing, no more than 40 characters.} [ru-RU]`,
      role: 'user',
    },
    { content: 'Creative UX Editor', role: 'assistant' },
    {
      content: `Input: {You are a frontend code expert. Please convert the following code into TypeScript without modifying the implementation. If the original JS uses undefined global variables, add the appropriate declare type definitions.} [en-US]`,
      role: 'user',
    },
    { content: 'TS Transformer', role: 'assistant' },
    {
      content: `Input: {Improve my English by replacing basic A0-level expressions with more advanced and sophisticated phrasing while maintaining the original meaning. Only provide corrections and enhancements without explanations.} [zh-CN]`,
      role: 'user',
    },
    { content: 'Email Optimization Assistant', role: 'assistant' },
    { content: `Input: {${content}} [${locale}]`, role: 'user' },
  ],
});