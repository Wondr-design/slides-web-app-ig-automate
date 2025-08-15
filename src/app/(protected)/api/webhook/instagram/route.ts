import { findAutomation } from "@/actions/automations/queries";
import {
  createChatHistory,
  getChatHistory,
  getKeywordAutomation,
  getKeywordPost,
  matchKeyword,
  trackResponses,
} from "@/actions/webhook/queries";
import { sendDM, sendPrivateMessage } from "@/lib/fetch";
import { openai } from "@/lib/openai";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// In-memory cache for processed message IDs to prevent duplicates
const processedMessageIds = new Set<string>();

// Keep track of active timers and queued messages per conversation
const pendingReplies = new Map<string, NodeJS.Timeout>();
const pendingMessages = new Map<string, string[]>();

export async function GET(req: NextRequest) {
  const hub = req.nextUrl.searchParams.get("hub.challenge");
  return new NextResponse(hub);
}

export async function POST(req: NextRequest) {
  const webhook_payload = await req.json();
  console.log("Webhook payload:", JSON.stringify(webhook_payload, null, 2));

  try {
    // --- Handle MESSAGING events ---
    if (webhook_payload.entry[0].messaging) {
      const messagingEvent = webhook_payload.entry[0].messaging[0];

      if (
        !messagingEvent.message ||
        typeof messagingEvent.message.text !== "string"
      ) {
        return NextResponse.json({ message: "No user text" }, { status: 200 });
      }

      // Ignore if sender is the page itself
      if (messagingEvent.sender?.id === webhook_payload.entry[0].id) {
        return NextResponse.json(
          { message: "Own message ignored" },
          { status: 200 }
        );
      }

      // Duplicate message check
      const messageId = messagingEvent.message?.mid;
      if (typeof messageId === "string") {
        if (processedMessageIds.has(messageId)) {
          return NextResponse.json(
            { message: "Duplicate ignored" },
            { status: 200 }
          );
        }
        processedMessageIds.add(messageId);
      }

      const convoKey = `${messagingEvent.sender.id}-${webhook_payload.entry[0].id}`;

      // If a reply is already pending, just queue the message
      if (pendingReplies.has(convoKey)) {
        pendingMessages.get(convoKey)?.push(messagingEvent.message.text);
        return NextResponse.json(
          { message: "Reply already scheduled" },
          { status: 200 }
        );
      }

      // Start a new queue
      pendingMessages.set(convoKey, [messagingEvent.message.text]);

      // Set a 60-second delay before responding
      pendingReplies.set(
        convoKey,
        setTimeout(async () => {
          try {
            const allMessages = pendingMessages.get(convoKey)?.join("\n") || "";
            pendingMessages.delete(convoKey);
            pendingReplies.delete(convoKey);

            const matcher = await matchKeyword(allMessages);
            if (!matcher?.automationId) {
              console.log("No matcher found for delayed messaging batch.");
              return;
            }

            const automation = await getKeywordAutomation(
              matcher.automationId,
              true
            );
            if (!automation?.trigger) return;

            // Handle MESSAGE listener
            if (automation.listener?.listener === "MESSAGE") {
              const direct_message = await sendDM(
                webhook_payload.entry[0].id,
                messagingEvent.sender.id,
                automation.listener?.prompt,
                automation.User?.integrations[0].token!
              );

              if (direct_message.status !== 200) {
                console.error(
                  "DM send failed:",
                  await safeText(direct_message)
                );
              } else {
                await trackResponses(automation.id, "DM");
              }
            }

            // Handle SMARTAI listener
            if (
              automation.listener?.listener === "SMARTAI" &&
              automation.User?.subscription?.plan === "PRO"
            ) {
              const smart_ai_message = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                  {
                    role: "assistant",
                    content: `${automation.listener?.prompt}: Keep responses under 2 sentences`,
                  },
                ],
              });

              const content = smart_ai_message.choices[0]?.message?.content;
              if (content) {
                const reciever = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  messagingEvent.sender.id,
                  allMessages
                );
                const sender = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  messagingEvent.sender.id,
                  content
                );
                await client.$transaction([reciever, sender]);

                const direct_message = await sendDM(
                  webhook_payload.entry[0].id,
                  messagingEvent.sender.id,
                  content,
                  automation.User?.integrations[0].token!
                );

                if (direct_message.status !== 200) {
                  console.error(
                    "DM send failed:",
                    await safeText(direct_message)
                  );
                } else {
                  await trackResponses(automation.id, "DM");
                }
              }
            }
          } catch (err) {
            console.error("Error in delayed reply:", err);
          }
        }, 60000)
      );

      return NextResponse.json({ message: "Reply scheduled" }, { status: 200 });
    }

    // --- Handle CHANGES events (comments) ---
    if (webhook_payload.entry[0].changes) {
      const changeValue = webhook_payload.entry[0].changes[0].value;

      if (!changeValue.text || typeof changeValue.text !== "string") {
        return NextResponse.json({ message: "No user text" }, { status: 200 });
      }

      // Ignore if own comment
      if (changeValue.from?.id === webhook_payload.entry[0].id) {
        return NextResponse.json(
          { message: "Own message ignored" },
          { status: 200 }
        );
      }

      // Duplicate check
      if (processedMessageIds.has(changeValue.id)) {
        return NextResponse.json(
          { message: "Duplicate ignored" },
          { status: 200 }
        );
      }
      processedMessageIds.add(changeValue.id);

      const convoKey = `${changeValue.from.id}-${webhook_payload.entry[0].id}`;

      if (pendingReplies.has(convoKey)) {
        pendingMessages.get(convoKey)?.push(changeValue.text);
        return NextResponse.json(
          { message: "Reply already scheduled" },
          { status: 200 }
        );
      }

      pendingMessages.set(convoKey, [changeValue.text]);

      pendingReplies.set(
        convoKey,
        setTimeout(async () => {
          try {
            const allMessages = pendingMessages.get(convoKey)?.join("\n") || "";
            pendingMessages.delete(convoKey);
            pendingReplies.delete(convoKey);

            const matcher = await matchKeyword(allMessages);
            if (!matcher?.automationId) {
              console.log("No matcher found for delayed changes batch.");
              return;
            }

            const automation = await getKeywordAutomation(
              matcher.automationId,
              false
            );
            if (!automation?.trigger) return;

            if (automation.listener?.listener === "MESSAGE") {
              const direct_message = await sendPrivateMessage(
                webhook_payload.entry[0].id,
                changeValue.id,
                automation.listener?.prompt,
                automation.User?.integrations[0].token!
              );

              if (direct_message.status !== 200) {
                console.error(
                  "DM send failed:",
                  await safeText(direct_message)
                );
              } else {
                await trackResponses(automation.id, "COMMENT");
              }
            }

            if (
              automation.listener?.listener === "SMARTAI" &&
              automation.User?.subscription?.plan === "PRO"
            ) {
              const smart_ai_message = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                  {
                    role: "assistant",
                    content: `${automation.listener?.prompt}: Keep responses under 2 sentences`,
                  },
                ],
              });

              const content = smart_ai_message.choices[0]?.message?.content;
              if (content) {
                const reciever = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  changeValue.from.id,
                  allMessages
                );
                const sender = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  changeValue.from.id,
                  content
                );
                await client.$transaction([reciever, sender]);

                const direct_message = await sendPrivateMessage(
                  webhook_payload.entry[0].id,
                  changeValue.id,
                  content,
                  automation.User?.integrations[0].token!
                );

                if (direct_message.status !== 200) {
                  console.error(
                    "DM send failed:",
                    await safeText(direct_message)
                  );
                } else {
                  await trackResponses(automation.id, "COMMENT");
                }
              }
            }
          } catch (err) {
            console.error("Error in delayed reply:", err);
          }
        }, 60000)
      );

      return NextResponse.json({ message: "Reply scheduled" }, { status: 200 });
    }

    return NextResponse.json({ message: "No automation set" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

// Helper to safely read text from Response or AxiosResponse without breaking
async function safeText(res: Response | any) {
  try {
    if (res.text && typeof res.text === "function") {
      return await res.text();
    }
    // Handle AxiosResponse
    if (res.data) {
      return JSON.stringify(res.data);
    }
    return "<no body>";
  } catch {
    return "<no body>";
  }
}
