import { z } from "zod";

export const postSchema = z
  .object({
    tags: z.array(z.string()),
    title: z.string().nullable(),
    body: z.string().nullable(),
    isDraft: z.boolean().default(true),
    createdAt: z.number().optional(),
    entry: z
      .object({
        year: z.string(),
        month: z.string(),
        day: z.string(),
      })
      .strict()
      .optional(),
    updatedAt: z.number().optional().nullable().default(null),
  })
  .strict();

export const tagSchema = z
  .object({
    relatedTags: z.array(z.string()),
    createdAt: z.number().optional(),
    updatedAt: z.number().optional().nullable().default(null),
  })
  .strict();
