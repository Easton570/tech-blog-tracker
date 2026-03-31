import { db } from '../db';
import { blogs } from '../db/schema';
import seedData from '../data/blogs-seed.json';

async function seed() {
  console.log('Seeding database with 100 blogs...');

  for (const blog of seedData) {
    await db.insert(blogs).values({
      slug: blog.slug,
      name: blog.name,
      domain: blog.domain,
      author: blog.author,
      bio: blog.bio,
      topics: blog.topics,
      hnRank: blog.rank,
      hnTotalScore: blog.totalScore,
      hnStories: blog.stories,
      rssStatus: 'pending',
      isActive: true,
    }).onConflictDoNothing();
  }

  console.log(`Seeded ${seedData.length} blogs successfully.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
