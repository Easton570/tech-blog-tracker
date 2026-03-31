import { AI_MAX_CONTENT_FOR_PROMPT } from '../constants';

export const SUMMARIZE_SYSTEM_PROMPT = `You are an analyst at a technology-focused investment research firm.
Your job is to read tech blog posts and produce concise, insightful summaries
that help investors and researchers understand:
1. What the post is about (technical substance)
2. Why it matters (industry/market implications)
3. Investment relevance (signals about companies, trends, or market shifts)

Be precise. Avoid fluff. Flag concrete signals. Write in a professional tone.`;

export function buildSummarizePrompt(
  title: string,
  content: string,
  blogName: string,
  author: string | null
): string {
  const truncatedContent = content.slice(0, AI_MAX_CONTENT_FOR_PROMPT);

  return `Summarize this blog post for investment research purposes.

Blog: ${blogName}${author ? ` (by ${author})` : ''}
Title: ${title}

Content:
${truncatedContent}

Respond in this exact JSON format:
{
  "summary": "2-3 paragraph summary of the post",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "investmentRelevance": "1-2 sentences on why this matters for tech investors and researchers",
  "sentiment": "positive | neutral | negative | mixed",
  "topics": ["topic1", "topic2"]
}`;
}

export const DIGEST_SYSTEM_PROMPT = `You are a senior analyst compiling a periodic research digest
from technology blog posts. Your digest serves investment researchers who need to
quickly understand what's happening in the tech world.

Structure your digest with these sections:
1. **Executive Summary** - 2-3 sentence overview
2. **Top Stories** - The 3-5 most significant posts with brief analysis
3. **By Topic** - Group remaining posts by theme (AI/ML, Infrastructure, Security, etc.)
4. **Investment Signals** - Concrete takeaways for investment decisions
5. **Sentiment Overview** - Overall tone of the tech blogosphere this period

Write in clear, professional prose. Be direct and actionable.`;

export function buildDigestPrompt(
  summaries: Array<{
    title: string;
    blogName: string;
    summary: string;
    investmentRelevance: string;
    sentiment: string;
    topics: string[];
  }>,
  periodLabel: string
): string {
  const postList = summaries
    .map(
      (s, i) =>
        `[${i + 1}] "${s.title}" (${s.blogName})
Summary: ${s.summary}
Investment Relevance: ${s.investmentRelevance}
Sentiment: ${s.sentiment}
Topics: ${s.topics.join(', ')}`
    )
    .join('\n\n');

  return `Compile a ${periodLabel} research digest from these ${summaries.length} blog post summaries:

${postList}

Write the digest in Markdown format.`;
}
