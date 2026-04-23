import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";

const SYSTEM_COLLECTIONS: Partial<Doc<"collections">>[] = [
  {
    name: "Inbox",
    slug: "inbox",
    description: "Quickly save links to sort later",
    icon: "Inbox",
    color: "blue",
    sortOrder: 0,
    type: "system",
  },
  {
    name: "Read Later",
    slug: "read-later",
    description: "Articles and content to revisit",
    icon: "Bookmark",
    color: "amber",
    sortOrder: 1,
    type: "system",
  },
  {
    name: "Favorites",
    slug: "favorites",
    description: "Your most important links",
    icon: "Star",
    color: "yellow",
    sortOrder: 2,
    type: "system",
  },
  {
    name: "Archive",
    slug: "archive",
    description: "Saved but not actively used",
    icon: "Archive",
    color: "gray",
    sortOrder: 3,
    type: "system",
  },
];

export const ensureSystemCollections = async (
  ctx: MutationCtx,
  userId: Id<"users">,
) => {
  const existingCollections = await ctx.db
    .query("collections")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const collectionsBySlug = new Map(
    existingCollections.map((collection) => [collection.slug, collection]),
  );

  for (const collection of SYSTEM_COLLECTIONS) {
    const existingCollection = collectionsBySlug.get(collection.slug!);

    if (!existingCollection) {
      await ctx.db.insert("collections", {
        userId,
        name: collection.name!,
        slug: collection.slug!,
        description: collection.description,
        icon: collection.icon,
        color: collection.color,
        sortOrder: collection.sortOrder!,
        type: "system",
      });
      continue;
    }

    if (existingCollection.type !== "system") {
      continue;
    }

    await ctx.db.patch("collections", existingCollection._id, {
      name: collection.name!,
      description: collection.description,
      icon: collection.icon,
      color: collection.color,
      sortOrder: collection.sortOrder!,
      type: "system",
    });
  }
};
