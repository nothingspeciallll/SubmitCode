import { NextRequest } from "next/server";
import {
  deleteUserNotificationDetails,
  setUserNotificationDetails,
} from "@/lib/kv";
import { sendFrameNotification } from "@/lib/notifs";

export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  try {
    const { header, payload } = requestJson;
    const decodedHeader = JSON.parse(Buffer.from(header, "base64").toString());
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64").toString());
    const fid = decodedHeader.fid; 
    const event = decodedPayload.event;
    const notificationDetails = decodedPayload.notificationDetails;
    const randomBodies = [
  "Welcome to Farcoins! 🚀 Ready to create, trade, and claim your daily crypto rewards?",
  "You’ve just unlocked the Farcoins experience! 🎉 Create your own coin or join airdrops for exclusive rewards! 💎",
  "Farcoins is live on Farcaster! 🪙 Start your journey and discover new community coins today! ✨",
  "Claim your daily Farcoins and join the next big airdrop! 🌟 Thanks for being part of the Farcaster community!",
  "Crypto luck is on your side! 🍀 Claim, trade, and grow your Farcoins collection! 💰",
  "You’re officially a Farcoins creator! 🛠️ Launch your coin and invite friends to join your community! 🎁",
  "Welcome aboard the Farcoins journey! 🚀 Collect, create, and enjoy the Web3 vibes! 🌐",
  "Let’s get started! 🎉 Thanks for joining Farcoins – your crypto adventure awaits! 💸",
  "Farcaster + Farcoins = community power! 🤝 Claim, create, and share your coins now! 🪙",
  "You’re in! 🎊 Explore the Farcoins marketplace and let fortune favor the bold! 🦾"
];

    const getRandomBody = () =>
      randomBodies[Math.floor(Math.random() * randomBodies.length)];

    switch (event) {
      case "frame_added":
        if (notificationDetails) {
          await setUserNotificationDetails(fid, notificationDetails);
          await sendFrameNotification({
            fid,
            title: "🚀 Wellcome to Farcoins",
            body: getRandomBody(),  
          });
        } else {
          await deleteUserNotificationDetails(fid);
        }
        break;


      case "notifications_enabled":
        await setUserNotificationDetails(fid, notificationDetails);
        await sendFrameNotification({
          fid,
          title: "Farcoins! notifications enabled 🎉",
          body: getRandomBody(),
        });
        break;
      default:
        return Response.json(
          { success: false, error: "Unknown event type" },
          { status: 400 }
        );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error during processing:", error);
    return Response.json(
      { success: false, error: "Invalid data: " },
      { status: 400 }
    );
  }
}