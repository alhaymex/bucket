export type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

export type ClerkUserWebhookData = {
  id: string;
  email_addresses: ClerkEmailAddress[];
  first_name: string | null;
  image_url?: string | null;
  last_name: string | null;
  primary_email_address_id: string | null;
  username?: string | null;
};

export type ClerkDeletedUserWebhookData = {
  id: string;
  deleted: boolean;
  object: "user";
};

export type ClerkUserCreatedWebhookEvent = {
  type: "user.created";
  data: ClerkUserWebhookData;
};

export type ClerkUserUpdatedWebhookEvent = {
  type: "user.updated";
  data: ClerkUserWebhookData;
};

export type ClerkUserDeletedWebhookEvent = {
  type: "user.deleted";
  data: ClerkDeletedUserWebhookData;
};

export type ClerkUserWebhookEvent =
  | ClerkUserCreatedWebhookEvent
  | ClerkUserUpdatedWebhookEvent
  | ClerkUserDeletedWebhookEvent;

export function isClerkUserWebhookEvent(
  value: unknown,
): value is ClerkUserWebhookEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as {
    type?: unknown;
    data?: { id?: unknown };
  };

  return (
    (event.type === "user.created" ||
      event.type === "user.updated" ||
      event.type === "user.deleted") &&
    typeof event.data?.id === "string"
  );
}

export function getPrimaryEmail(user: ClerkUserWebhookData): string | null {
  const primaryEmail = user.email_addresses.find(
    (email) => email.id === user.primary_email_address_id,
  );

  return (
    primaryEmail?.email_address ??
    user.email_addresses[0]?.email_address ??
    null
  );
}

export function getDisplayName(
  user: ClerkUserWebhookData,
  email: string,
): string {
  const fullName = [user.first_name, user.last_name]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  const username = user.username?.trim();
  if (username) {
    return username;
  }

  return email.split("@")[0] ?? "User";
}
