import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";

// Initialize Redis connection with Upstash
const redis = new Redis({
  url: process.env.KV_REST_API_URL, // Upstash Redis URL from environment variables
  token: process.env.KV_REST_API_TOKEN, // Authentication token from environment variables
});

/**
 * Create a unique Redis key for user details based on fid
 * @param fid User's ID
 * @returns Key string, e.g., "frames-v2-demo:user:123"
 */
function getUserNotificationDetailsKey(fid: number): string {
  return `frames-v2-demo:user:${fid}`;
}

/**
 * Get user notification details from Redis
 * @param fid User's ID
 * @returns Details or null if not found
 */
export async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  try {
    return await redis.get<FrameNotificationDetails>(
      getUserNotificationDetailsKey(fid)
    );
  } catch (error) {
    console.error(`Error getting notification details for FID ${fid}:`, error);
    throw error;
  }
}

/**
 * Save user notification details to Redis
 * @param fid User's ID
 * @param notificationDetails Notification details
 */
export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  try {
    await redis.set(getUserNotificationDetailsKey(fid), notificationDetails);
  } catch (error) {
    console.error(`Error saving notification details for FID ${fid}:`, error);
    throw error;
  }
}

/**
 * Delete user notification details from Redis
 * @param fid User's ID
 */
export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  try {
    await redis.del(getUserNotificationDetailsKey(fid));
  } catch (error) {
    console.error(`Error deleting notification details for FID ${fid}:`, error);
    throw error;
  }
}

/**
 * Check Redis connection
 * @returns true if connection is successful, false otherwise
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch (error) {
    console.error("Failed to connect to Upstash Redis:", error);
    return false;
  }
}

/**
 * Get notification details for all users
 * @param offset Starting position (default is 0)
 * @param limit Maximum number of items to retrieve (default is 1000)
 * @returns Array containing user fids and their details
 */
export async function getAllUserNotificationDetails(
  offset: number = 0,
  limit: number = 1000
): Promise<{ fid: number; details: FrameNotificationDetails }[]> {
  const results: { fid: number; details: FrameNotificationDetails }[] = [];
  const allKeys: string[] = [];
  let cursor = 0;

  try {
    // Step 1: Collect all keys using SCAN command
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: "frames-v2-demo:user:*",
        count: 1000,
      });
      allKeys.push(...keys);
      cursor = parseInt(nextCursor, 10);
    } while (cursor !== 0);

    // Step 2: Slice the key list based on offset and limit
    const selectedKeys = allKeys.slice(offset, offset + limit);

    // Step 3: Get data for selected keys using MGET
    if (selectedKeys.length === 0) {
      return results;
    }

    const detailsArray = await redis.mget<FrameNotificationDetails[]>(...selectedKeys);

    // Step 4: Process data and create results
    for (let i = 0; i < selectedKeys.length; i++) {
      const key = selectedKeys[i];
      const details = detailsArray[i];
      if (details) {
        const fid = parseInt(key.split(":").pop() || "0", 10);
        results.push({ fid, details });
      }
    }

    return results;
  } catch (error) {
    console.error("Error getting user notification details:", error);
    throw error;
  }
}