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
    parentId: v.optional(v.id("collections")),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_user", ["userId"]),

  links: defineTable({
    userId: v.id("users"),
    collectionId: v.optional(v.id("collections")),
    url: v.string(),

    contentType: v.union(
      v.literal("youtube"),
      v.literal("article"),
      v.literal("product"),
      v.literal("tweet"),
      v.literal("github"),
      v.literal("generic"),
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
    .index("by_collection", ["collectionId"])
    .index("by_user_type", ["userId", "contentType"])
    .searchIndex("search_bookmarks", {
      searchField: "title",
      filterFields: ["userId", "contentType", "tags"],
    }),

  // Links Previews
  youtube_previews: defineTable({
    bookmarkId: v.id("links"),
    videoId: v.string(),
    channelId: v.string(),
    channelName: v.string(),
    channelAvatarUrl: v.optional(v.string()),
    duration: v.number(), // in seconds
    description: v.optional(v.string()),
    viewCount: v.optional(v.number()),
    likeCount: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  }).index("by_bookmark", ["bookmarkId"]),

  article_previews: defineTable({
    bookmarkId: v.id("links"),
    author: v.optional(v.string()),
    siteName: v.optional(v.string()),
    publisherLogoUrl: v.optional(v.string()),
    readingTime: v.optional(v.number()), // in minutes
    shortDescription: v.optional(v.string()),
    fullText: v.optional(v.string()),
    articlePublishedAt: v.optional(v.number()),
    language: v.optional(v.string()),
    images: v.array(v.string()),
  }).index("by_bookmark", ["bookmarkId"]),

  // Products from platforms like Amazon, Etsy, etc.
  product_previews: defineTable({
    bookmarkId: v.id("links"),
    storeName: v.string(),
    storeLogoUrl: v.optional(v.string()),
    productId: v.string(),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    availability: v.optional(
      v.union(
        v.literal("in_stock"),
        v.literal("out_of_stock"),
        v.literal("preorder"),
      ),
    ),
    rating: v.optional(v.number()),
    ratingCount: v.optional(v.number()),
    brand: v.optional(v.string()),
    images: v.array(v.string()),
  }).index("by_bookmark", ["bookmarkId"]),

  // X is a wierd variable name
  tweet_previews: defineTable({
    bookmarkId: v.id("bookmarks"),
    tweetId: v.string(),
    tweetText: v.string(),
    embedHtml: v.optional(v.string()),
    authorName: v.string(),
    authorUsername: v.string(),
    tweetedAt: v.number(),
  }).index("by_bookmark", ["bookmarkId"]),

  github_previews: defineTable({
    bookmarkId: v.id("bookmarks"),
    repoOwner: v.string(),
    repoName: v.string(),
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    stars: v.number(),
    forks: v.number(),
    openIssues: v.number(),
    isArchived: v.boolean(),
    license: v.optional(v.string()),
    topics: v.array(v.string()),
    lastCommitAt: v.optional(v.number()),
  }).index("by_bookmark", ["bookmarkId"]),

  link_check_jobs: defineTable({
    bookmarkId: v.id("bookmarks"),
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
    .index("by_bookmark", ["bookmarkId"])
    .index("by_next_check", ["nextCheckAt"]),
});
