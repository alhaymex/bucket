import { z } from "zod";
import { urlSchema } from "./linkSchema";

export const ExtractorResponseStatusSchema = z.enum([
  "ok",
  "blocked",
  "unreadable",
  "error",
]);

export const ExtractArticleRequestSchema = z.object({
  url: urlSchema,
  timeoutMs: z.number().int().positive().optional(),
});

export const ExtractArticleResponseSchema = z.object({
  status: ExtractorResponseStatusSchema,
  finalUrl: z.string().optional(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  byline: z.string().optional(),
  siteName: z.string().optional(),
  lang: z.string().optional(),
  textContent: z.string().optional(),
  htmlFragment: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type ExtractorResponseStatus = z.infer<
  typeof ExtractorResponseStatusSchema
>;
export type ExtractArticleRequest = z.infer<typeof ExtractArticleRequestSchema>;
export type ExtractArticleResponse = z.infer<
  typeof ExtractArticleResponseSchema
>;
