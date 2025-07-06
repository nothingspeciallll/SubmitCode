import { NextRequest, NextResponse } from "next/server";
import { sendFrameNotification } from "../../../lib/notifs";

export async function POST(request: NextRequest) {
  try {
    const { title, body, users } = await request.json();

    if (!title || !body || !users || !Array.isArray(users)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid required fields (title, body, users)",
        },
        { status: 400 }
      );
    }

    // Xử lý tất cả users trong payload mà không cần chia batch lại
    const batchPromises = users.map(async (user: any) => {
      const { fid, url, token } = user;
      if (!fid || !url || !token) {
        return { fid: null, result: { state: "error", error: "Missing FID, URL, or token" } };
      }
      const result = await sendFrameNotification({ fid, title, body });
      return { fid, result };
    });
    const results = await Promise.all(batchPromises);

    return NextResponse.json({
      success: true,
      message: "Notifications processed",
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process notifications",
        details: error instanceof Error ? { name: error.name, message: error.message } : error,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'edge'
export const preferredRegion = 'iad1'