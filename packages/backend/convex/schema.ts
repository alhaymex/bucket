import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  collections: defineTable({
    userId: v.id("users"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    sortOrder: v.number(),
    type: v.union(v.literal("system"), v.literal("user")),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_slug", ["userId", "slug"]),

  links: defineTable({
    userId: v.id("users"),
    collectionId: v.optional(v.id("collections")),

    url: v.string(),
    canonicalUrl: v.string(),
    sourceHost: v.string(),

    platform: v.string(),

    externalId: v.optional(v.string()),
    embedUrl: v.optional(v.string()),

    note: v.optional(v.string()),

    contentType: v.union(
      v.literal("video"),
      v.literal("social"),
      v.literal("article"),
      v.literal("product"),
      v.literal("document"),
      v.literal("generic"),
    ),

    renderType: v.union(
      v.literal("embed"),
      v.literal("reader"),
      v.literal("pdf"),
    ),

    // Open Graph
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),

    tags: v.array(v.string()),
    isPinned: v.boolean(),
    isArchived: v.boolean(),

    status: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("error"),
    ),

    lastViewedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_collection", ["userId", "collectionId"])
    .index("by_user_type", ["userId", "contentType"])
    .index("by_user_last_viewed", ["userId", "lastViewedAt"])
    .index("by_user_url", ["userId", "canonicalUrl"])
    .searchIndex("search_links", {
      searchField: "title",
      filterFields: ["userId", "contentType", "tags"],
    }),

  // Links Previews
  link_metadata: defineTable({
    linkId: v.id("links"),

    author: v.optional(v.string()),
    siteName: v.optional(v.string()),
    publisherLogoUrl: v.optional(v.string()),

    html: v.optional(v.string()),
    markdown: v.optional(v.string()),
    text: v.optional(v.string()),

    readingTime: v.optional(v.number()),
    language: v.optional(v.string()),
    publishedAt: v.optional(v.number()),

    embedHtml: v.optional(v.string()),

    images: v.array(v.string()),

    stats: v.optional(
      v.object({
        viewCount: v.optional(v.number()),
        likeCount: v.optional(v.number()),
        commentCount: v.optional(v.number()),
        shareCount: v.optional(v.number()),
      }),
    ),

    fetchedAt: v.optional(v.number()),
  }).index("by_link", ["linkId"]),

  link_check_jobs: defineTable({
    linkId: v.id("links"),
    status: v.union(
      v.literal("queued"),
      v.literal("alive"),
      v.literal("dead"),
      v.literal("redirect"),
    ),
    httpStatus: v.optional(v.number()),
    isAlive: v.optional(v.boolean()),
    checkedAt: v.optional(v.number()),
    nextCheckAt: v.number(),
  })
    .index("by_link", ["linkId"])
    .index("by_next_check", ["nextCheckAt"]),

  waitlist: defineTable({
    email: v.string(),
    source: v.optional(v.string()),
  }).index("by_email", ["email"]),
});
