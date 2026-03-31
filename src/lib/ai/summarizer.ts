import OpenAI from 'openai';
import { buildSummarizePrompt, SUMMARIZE_SYSTEM_PROMPT } from './prompts';
import { AI_MODEL } from '../constants';

const openai = new OpenAI();

export interface SummaryResult {
  summary: string;
  keyInsights: string[];
  investmentRelevance: string;
  sentiment: string;
  topics: string[];
  promptTokens: number;
  completionTokens: number;
}

export async function summarizePost(
  title: string,
  content: string,
  blogName: string,
  author: string | null
): Promise<SummaryResult> {
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SUMMARIZE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildSummarizePrompt(title, content, blogName, author),
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const raw = response.choices[0]?.message?.content || '{}';
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { summary: raw };
  }

  return {
    summary: (parsed.summary as string) || '',
    keyInsights: (parsed.keyInsights as string[]) || [],
    investmentRelevance: (parsed.investmentRelevance as string) || '',
    sentiment: (parsed.sentiment as string) || 'neutral',
    topics: (parsed.topics as string[]) || [],
    promptTokens: response.usage?.prompt_tokens || 0,
    completionTokens: response.usage?.completion_tokens || 0,
  };
}
