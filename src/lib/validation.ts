import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(80),
});

export const articleDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.any()).optional(),
});

export const articleSchema = z.object({
  title: z.string().min(8).max(140),
  categoryId: z.string().min(1),
  status: z.enum(["draft", "published"]),
  seoTitle: z.string().max(120).optional().or(z.literal("")),
  seoDescription: z.string().max(180).optional().or(z.literal("")),
  featuredImagePath: z.string().max(240).startsWith("/").optional().or(z.literal("")),
  tagCsv: z.string().max(300).optional().or(z.literal("")),
  contentJson: z.string().min(2),
  contentHtml: z.string().optional().or(z.literal("")),
  suggestionStateJson: z.string().optional().or(z.literal("")),
  pendingSuggestions: z.coerce.number().int().min(0).optional(),
});

export const contactSchema = z.object({
  email: z.string().email(),
  message: z.string().min(30).max(2000),
});

