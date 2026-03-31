import OpenAI from 'openai';
import { buildDigestPrompt, DIGEST_SYSTEM_PROMPT } from '../ai/prompts';
import { AI_MODEL } from '../constants';

const openai = new OpenAI();

interface DigestInput {
  title: string;
  blogName: string;
  summary: string;
  investmentRelevance: string;
  sentiment: string;
  topics: string[];
}

export async function buildDigest(
  summaries: DigestInput[],
  periodLabel: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: DIGEST_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildDigestPrompt(summaries, periodLabel),
      },
    ],
    temperature: 0.4,
    max_tokens: 3000,
  });

  return response.choices[0]?.message?.content || '';
}
