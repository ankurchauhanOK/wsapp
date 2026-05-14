import { NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/bot";

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

/**
 * GET /api/webhook
 * Meta WhatsApp Cloud API webhook verification.
 * Meta sends a GET with hub.challenge — we echo it back.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Webhook] Verified with Meta");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Verification failed", { status: 403 });
}

/**
 * POST /api/webhook
 * Receive incoming messages from Meta WhatsApp Cloud API.
 *
 * Currently in simulation mode — processes messages locally.
 * When Meta webhook is configured, this receives actual message payloads.
 *
 * Expected Meta payload structure:
 * {
 *   entry: [{
 *     changes: [{
 *       value: {
 *         messages: [{
 *           from: "919XXXXXXXXX",
 *           text: { body: "hi" },
 *           timestamp: "1234567890"
 *         }]
 *       }
 *     }]
 *   }]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Meta payload parsing
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        const from = msg.from;
        const text = msg.text?.body || "";
        const timestamp = msg.timestamp
          ? parseInt(msg.timestamp, 10) * 1000
          : undefined;

        const response = handleIncomingMessage({
          from,
          text,
          timestamp,
        });

        if (response) {
          // In production: send response via Meta WhatsApp API
          // await sendWhatsAppMessage(from, response.text);
          console.log(`[Webhook] Reply to ${from}: ${response.text}`);
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error processing message:", error);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
