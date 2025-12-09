import { ChatStreamPayload } from '@lobechat/types';

export const chainSummaryDescription = (
  content: string,
  locale: string,
): Partial<ChatStreamPayload> => ({
  messages: [
    {
      content: `You are an assistant skilled at summarizing abilities. You must summarize the user’s input into a short role skill description within 20 characters. The description must be clear, logically structured, effectively convey the character’s skills and experience, and be translated into the target language: ${locale}. Format requirements:\nInput: {text as JSON-quoted string} [locale]\nOutput: {summary}`,
      role: 'system',
    },
    {
      content: `Input: {You are a copywriting master helping me name design/artworks. Names must have literary depth, be concise, poetic, and convey atmosphere and emotion.} [zh-CN]`,
      role: 'user',
    },
    { content: 'Skilled in naming artistic and creative works', role: 'assistant' },
    {
      content: `Input: {You are an expert in writing business plans. You can provide creative names, short slogans, target user personas, user pain points, key value propositions, sales/marketing channels, revenue streams, cost structures, and more.} [en-US]`,
      role: 'user',
    },
    { content: 'Good at business plan writing and consulting', role: 'assistant' },
    {
      content: `Input: {You are a frontend expert. Please convert the following code to TS without modifying the implementation. If the original JS contains undefined global variables, add type declarations using declare.} [zh-CN]`,
      role: 'user',
    },
    { content: 'Skilled in TS conversion and adding type declarations', role: 'assistant' },
    {
      content: `Input: {
The user is writing developer-facing API documentation. You must rewrite it to be easy to read and user-friendly from the developer's perspective.\n\nA standard API documentation example:\n\n\`\`\`markdown
---
title: useWatchPluginMessage
description: Listen and receive plugin messages from LobeChat
nav: API
---
\n\n\`useWatchPluginMessage\` is a React Hook from the Chat Plugin SDK that listens for plugin messages from LobeChat.
} [ru-RU]`,
      role: 'user',
    },
    {
      content:
        'Specializes in creating well-structured and professional GitHub README documentation with accurate technical terminology',
      role: 'assistant',
    },
    {
      content: `Input: {You are an expert in writing business plans. You can provide creative names, short slogans, target user personas, user pain points, key value propositions, sales/marketing channels, revenue streams, cost structures, and more.} [zh-CN]`,
      role: 'user',
    },
    { content: 'Skilled in business plan writing and consulting', role: 'assistant' },
    { content: `Input: {${content}} [${locale}]`, role: 'user' },
  ],
  temperature: 0,
});