import { NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

const API_KEY = process.env.NOTIFICATION_API_KEY!;

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== API_KEY) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const requestJson = await request.json();
  const { title, body, users } = requestJson;

  if (!title || !body) {
    return NextResponse.json(
      { success: false, error: "Title and body are required" },
      { status: 400 }
    );
  }

  if (!users || !Array.isArray(users) || users.length === 0) {
    return NextResponse.json(
      { success: false, error: "No users provided in request" },
      { status: 400 }
    );
  }

  const publishBatchSize = 200;
  const publishPromises = [];
  for (let i = 0; i < users.length; i += publishBatchSize) {
    const batch = users.slice(i, i + publishBatchSize);
    const promise = qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_URL}/api/send-notification-worker`,
      body: {
        title,
        body,
        users: batch.map((u) => ({
          fid: u.fid,
          token: u.token,
          url: u.url,
        })),
      },
      delay: 0,
    }).catch((error) => {
    });
    publishPromises.push(promise);
  }

  await Promise.all(publishPromises);

  return NextResponse.json({
    success: true,
    message: "Notifications queued for sending",
    totalUsers: users.length,
    totalBatches: Math.ceil(users.length / publishBatchSize),
  });
}