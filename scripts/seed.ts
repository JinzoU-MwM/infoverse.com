import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db/client";
import { ensureDbInitialized } from "../src/lib/db/init";
import { accounts, articleTags, articles, categories, tags, users } from "../src/lib/db/schema";
import { slugify } from "../src/lib/utils";

async function upsertCredentialAccount(userId: string, passwordHash: string) {
  const existing = db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
    .limit(1)
    .get();

  if (existing) {
    db.update(accounts)
      .set({
        accountId: userId,
        password: passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, existing.id))
      .run();
    return;
  }

  db.insert(accounts)
    .values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();
}

async function upsertUser(input: {
  email: string;
  name: string;
  role: "owner" | "editor";
  password: string;
}) {
  const normalizedEmail = input.email.toLowerCase();
  const existing = db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1).get();
  const passwordHash = await bcrypt.hash(input.password, 10);

  if (existing) {
    db.update(users)
      .set({
        name: input.name,
        role: input.role,
        passwordHash,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .run();

    await upsertCredentialAccount(existing.id, passwordHash);
    return existing.id;
  }

  const id = crypto.randomUUID();
  db.insert(users)
    .values({
      id,
      name: input.name,
      email: normalizedEmail,
      role: input.role,
      passwordHash,
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();

  await upsertCredentialAccount(id, passwordHash);
  return id;
}

function ensureCategory(name: string) {
  const slug = slugify(name);
  const existing = db.select().from(categories).where(eq(categories.slug, slug)).limit(1).get();
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  db.insert(categories).values({ id, name, slug, createdAt: Date.now() }).run();
  return id;
}

function ensureTag(name: string) {
  const slug = slugify(name);
  const existing = db.select().from(tags).where(eq(tags.slug, slug)).limit(1).get();
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  db.insert(tags).values({ id, name, slug }).run();
  return id;
}

function ensureArticle(input: {
  title: string;
  categoryId: string;
  authorId: string;
  contentHtml: string;
  seoDescription: string;
  featuredImagePath: string | null;
  tagNames: string[];
}) {
  const slug = slugify(input.title);
  const existing = db.select().from(articles).where(eq(articles.slug, slug)).limit(1).get();
  const now = Date.now();
  const articleId = existing?.id ?? crypto.randomUUID();

  if (existing) {
    db.update(articles)
      .set({
        title: input.title,
        contentHtml: input.contentHtml,
        seoTitle: input.title,
        seoDescription: input.seoDescription,
        featuredImagePath: input.featuredImagePath,
        categoryId: input.categoryId,
        authorId: input.authorId,
        status: "published",
        updatedAt: now,
        publishedAt: now,
      })
      .where(eq(articles.id, existing.id))
      .run();
  } else {
    db.insert(articles)
      .values({
        id: articleId,
        title: input.title,
        slug,
        contentHtml: input.contentHtml,
        seoTitle: input.title,
        seoDescription: input.seoDescription,
        featuredImagePath: input.featuredImagePath,
        status: "published",
        categoryId: input.categoryId,
        authorId: input.authorId,
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
      })
      .run();
  }

  db.delete(articleTags).where(eq(articleTags.articleId, articleId)).run();
  input.tagNames.forEach((name) => {
    const tagId = ensureTag(name);
    db.insert(articleTags).values({ articleId, tagId }).run();
  });
}

async function main() {
  ensureDbInitialized();

  const ownerEmail = process.env.AUTH_OWNER_EMAIL || "owner@infoverse.com";
  const ownerPassword = process.env.AUTH_OWNER_PASSWORD || "owner12345";
  const ownerName = process.env.AUTH_OWNER_NAME || "Owner";

  const editorEmail = process.env.AUTH_EDITOR_EMAIL || "editor@infoverse.com";
  const editorPassword = process.env.AUTH_EDITOR_PASSWORD || "editor12345";
  const editorName = process.env.AUTH_EDITOR_NAME || "Editor";

  const ownerId = await upsertUser({
    email: ownerEmail,
    name: ownerName,
    role: "owner",
    password: ownerPassword,
  });

  await upsertUser({
    email: editorEmail,
    name: editorName,
    role: "editor",
    password: editorPassword,
  });

  const techId = ensureCategory("Technology");
  const economyId = ensureCategory("Economy");
  const businessId = ensureCategory("Business");
  const worldId = ensureCategory("World News");

  ensureArticle({
    title: "AI Chips Enter Global Supply Recovery",
    categoryId: techId,
    authorId: ownerId,
    contentHtml:
      "<h2>Semiconductor Momentum</h2><p>AI hardware investment is accelerating supply-chain realignment across regions.</p><p>Enterprises are balancing cost, resilience, and speed as production expands.</p>",
    seoDescription: "Semiconductor momentum and how AI chips are reshaping global supply planning.",
    featuredImagePath: null,
    tagNames: ["AI", "Semiconductors", "Innovation"],
  });

  ensureArticle({
    title: "Markets Reset After Policy Signal Surprise",
    categoryId: economyId,
    authorId: ownerId,
    contentHtml:
      "<h2>Macro Update</h2><p>Policy guidance shifted risk appetite and repriced growth-sensitive sectors.</p><p>Investors are now focused on data-dependency over fixed-rate narratives.</p>",
    seoDescription: "Policy signal surprise triggers a broad market reset and sector repricing.",
    featuredImagePath: null,
    tagNames: ["Markets", "Policy", "Macro"],
  });

  ensureArticle({
    title: "Cloud Infra Race Drives New Enterprise Bets",
    categoryId: businessId,
    authorId: ownerId,
    contentHtml:
      "<h2>Enterprise Strategy</h2><p>Cloud providers are expanding service depth while enterprises re-evaluate architecture costs.</p><p>Hybrid resiliency and AI workloads define the next procurement cycle.</p>",
    seoDescription: "Cloud infrastructure competition reshapes enterprise strategy and spending.",
    featuredImagePath: null,
    tagNames: ["Cloud", "Enterprise", "AI"],
  });

  ensureArticle({
    title: "Energy Transition Capital Map for 2026",
    categoryId: worldId,
    authorId: ownerId,
    contentHtml:
      "<h2>Global Outlook</h2><p>Capital allocation in energy transition now reflects policy certainty and supply-chain maturity.</p><p>Cross-border financing remains the biggest unlock for scaled deployment.</p>",
    seoDescription: "How global capital flows are shaping the 2026 energy transition landscape.",
    featuredImagePath: null,
    tagNames: ["Energy", "World", "Investment"],
  });

  console.log("Seed complete.");
  console.log(`Owner login: ${ownerEmail} / ${ownerPassword}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
