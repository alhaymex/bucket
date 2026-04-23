import { formatDistanceToNow } from "date-fns";

export const timeAgo = (timestamp: number) => {
  return formatDistanceToNow(timestamp, {
    addSuffix: true,
  });
};
