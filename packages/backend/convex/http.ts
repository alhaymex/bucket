import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { env } from "../env";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import {
  getDisplayName,
  getPrimaryEmail,
  isClerkUserWebhookEvent,
} from "./utils/clerk";

const http = httpRouter();

export const clerkWebhook = httpAction(async (ctx, request) => {
  const signingSecret = env.CLERK_WEBHOOK_SIGNING_SECRET;
  const requestUrl = new URL(request.url);

  logClerkWebhook("request_received", {
    hasSignature: Boolean(request.headers.get("svix-signature")),
    hasSvixId: Boolean(request.headers.get("svix-id")),
    hasTimestamp: Boolean(request.headers.get("svix-timestamp")),
    method: request.method,
    pathname: requestUrl.pathname,
    secretConfigured: Boolean(signingSecret),
  });

  if (!signingSecret) {
    logClerkWebhook("missing_signing_secret", {
      pathname: requestUrl.pathname,
    });

    return new Response("Missing CLERK_WEBHOOK_SIGNING_SECRET", {
      status: 500,
    });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    logClerkWebhook("missing_svix_headers", {
      svixId,
      svixSignaturePresent: Boolean(svixSignature),
      svixTimestamp,
    });

    return new Response("Missing Svix headers", { status: 400 });
  }

  const payload = await request.text();

  let event: unknown;

  try {
    event = new Webhook(signingSecret).verify(payload, {
      "svix-id": svixId,
      "svix-signature": svixSignature,
      "svix-timestamp": svixTimestamp,
    });
  } catch (error) {
    console.error("Invalid Clerk webhook signature", error);
    logClerkWebhook("signature_verification_failed", {
      error: error instanceof Error ? error.message : "unknown_error",
      svixId,
    });

    return new Response("Invalid signature", { status: 400 });
  }

  if (!isClerkUserWebhookEvent(event)) {
    logClerkWebhook("event_skipped", {
      eventType:
        event && typeof event === "object" && "type" in event
          ? event.type
          : "unknown",
      svixId,
    });

    return Response.json({ ok: true, skipped: true });
  }

  logClerkWebhook("signature_verified", {
    clerkUserId: event.data.id,
    eventType: event.type,
    svixId,
  });

  if (event.type === "user.deleted") {
    logClerkWebhook("deleting_user", {
      clerkUserId: event.data.id,
      eventType: event.type,
      svixId,
    });

    try {
      await ctx.runMutation(internal.users.deleteFromClerk, {
        clerkId: event.data.id,
      });

      logClerkWebhook("user_deleted", {
        clerkUserId: event.data.id,
        svixId,
      });
    } catch (error) {
      console.error("Failed to delete Clerk user", error);
      logClerkWebhook("user_delete_failed", {
        clerkUserId: event.data.id,
        error: error instanceof Error ? error.message : "unknown_error",
        svixId,
      });

      return new Response("Failed to delete user", {
        status: 500,
      });
    }

    return Response.json({ ok: true });
  }

  const userData = event.data;
  const email = getPrimaryEmail(userData);

  if (!email) {
    logClerkWebhook("missing_email", {
      clerkUserId: event.data.id,
      emailAddressCount: userData.email_addresses.length,
      primaryEmailAddressId: userData.primary_email_address_id,
      svixId,
    });

    return new Response("Missing user email in Clerk payload", {
      status: 400,
    });
  }

  const name = getDisplayName(userData, email);

  logClerkWebhook("upserting_user", {
    clerkUserId: event.data.id,
    email,
    eventType: event.type,
    name,
    svixId,
  });

  try {
    const result = await ctx.runMutation(internal.users.upsertFromClerk, {
      clerkId: event.data.id,
      email,
      name,
      avatar: userData.image_url ?? undefined,
    });

    logClerkWebhook("user_upserted", {
      action: result.action,
      duplicateCountRemoved: result.duplicateCountRemoved,
      svixId,
      userId: result.userId,
    });
  } catch (error) {
    console.error("Failed to upsert Clerk user", error);
    logClerkWebhook("user_upsert_failed", {
      clerkUserId: event.data.id,
      error: error instanceof Error ? error.message : "unknown_error",
      svixId,
    });

    return new Response("Failed to upsert user", {
      status: 500,
    });
  }

  return Response.json({ ok: true });
});

function logClerkWebhook(stage: string, details: Record<string, unknown>) {
  console.log(`[clerk-webhook] ${stage} ${JSON.stringify(details, null, 2)}`);
}

http.route({
  path: "/clerk/webhook",
  method: "POST",
  handler: clerkWebhook,
});

export default http;
