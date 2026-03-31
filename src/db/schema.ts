import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  serial,
  varchar,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ─── BLOGS ───────────────────────────────────────────────
export const blogs = pgTable(
  'blogs',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 500 }).notNull(),
    domain: varchar('domain', { length: 500 }).notNull(),
    author: varchar('author', { length: 500 }),
    bio: text('bio'),
    topics: jsonb('topics').$type<string[]>().default([]),
    rssUrl: varchar('rss_url', { length: 1000 }),
    rssStatus: varchar('rss_status', { length: 50 }).default('pending'),
    rssLastCheckedAt: timestamp('rss_last_checked_at'),
    rssLastSuccessAt: timestamp('rss_last_success_at'),
    rssErrorCount: integer('rss_error_count').default(0),
    rssLastError: text('rss_last_error'),
    isActive: boolean('is_active').default(true),
    hnRank: integer('hn_rank'),
    hnTotalScore: integer('hn_total_score'),
    hnStories: integer('hn_stories'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    domainIdx: index('blogs_domain_idx').on(table.domain),
    rssStatusIdx: index('blogs_rss_status_idx').on(table.rssStatus),
  })
);

// ─── POSTS ───────────────────────────────────────────────
export const posts = pgTable(
  'posts',
  {
    id: serial('id').primaryKey(),
    blogId: integer('blog_id')
      .notNull()
      .references(() => blogs.id),
    guid: varchar('guid', { length: 1000 }).notNull(),
    url: varchar('url', { length: 2000 }).notNull(),
    title: varchar('title', { length: 1000 }).notNull(),
    author: varchar('author', { length: 500 }),
    contentSnippet: text('content_snippet'),
    publishedAt: timestamp('published_at'),
    discoveredAt: timestamp('discovered_at').defaultNow(),
    summarizationStatus: varchar('summarization_status', { length: 50 }).default('pending'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    guidUniqueIdx: uniqueIndex('posts_guid_unique_idx').on(table.blogId, table.guid),
    blogIdIdx: index('posts_blog_id_idx').on(table.blogId),
    publishedAtIdx: index('posts_published_at_idx').on(table.publishedAt),
    statusIdx: index('posts_summarization_status_idx').on(table.summarizationStatus),
  })
);

// ─── SUMMARIES ───────────────────────────────────────────
export const summaries = pgTable(
  'summaries',
  {
    id: serial('id').primaryKey(),
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id)
      .unique(),
    summary: text('summary').notNull(),
    keyInsights: jsonb('key_insights').$type<string[]>(),
    investmentRelevance: text('investment_relevance'),
    sentiment: varchar('sentiment', { length: 50 }),
    topics: jsonb('topics').$type<string[]>(),
    model: varchar('model', { length: 100 }),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    postIdIdx: index('summaries_post_id_idx').on(table.postId),
  })
);

// ─── DIGESTS ─────────────────────────────────────────────
export const digests = pgTable('digests', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  content: text('content').notNull(),
  postCount: integer('post_count').default(0),
  metadata: jsonb('metadata').$type<{
    topTopics: string[];
    topBlogs: string[];
    sentimentBreakdown: Record<string, number>;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── FEED CHECK LOG ──────────────────────────────────────
export const feedCheckLogs = pgTable(
  'feed_check_logs',
  {
    id: serial('id').primaryKey(),
    blogId: integer('blog_id')
      .notNull()
      .references(() => blogs.id),
    status: varchar('status', { length: 50 }).notNull(),
    newPostsFound: integer('new_posts_found').default(0),
    durationMs: integer('duration_ms'),
    error: text('error'),
    checkedAt: timestamp('checked_at').defaultNow(),
  },
  (table) => ({
    blogIdIdx: index('feed_check_logs_blog_id_idx').on(table.blogId),
    checkedAtIdx: index('feed_check_logs_checked_at_idx').on(table.checkedAt),
  })
);
