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

const pendingReplies = new Map<string, NodeJS.Timeout>();
const pendingMessages = new Map<string, string[]>();

// NEEDED BY IG TO VERIFY THE WEBHOOK
// https://developers.facebook.com/docs/instagram-webhooks/getting-started#verify-your-webhook
// This is the GET request that Instagram will call to verify the webhook
// It should return the challenge parameter sent by Instagram

export async function GET(req: NextRequest) {
  const hub = req.nextUrl.searchParams.get("hub.challenge");
  return new NextResponse(hub);
}
// The POST request will handle the actual webhook events
// https://developers.facebook.com/docs/instagram-webhooks/getting-started#receive-webhook
// The POST request will handle the actual webhook events
// It should return a 200 OK response to acknowledge the event
// If you return a 400 or 500 error, Instagram will retry the request
// If you return a 400 or 500 error, Instagram will retry the request

export async function POST(req: NextRequest) {
  const webhook_payload = await req.json();
  let matcher;
  try {
    // Handle messaging events
    if (webhook_payload.entry[0].messaging) {
      const messagingEvent = webhook_payload.entry[0].messaging[0];
      // Check for no user text
      if (
        !messagingEvent.message ||
        typeof messagingEvent.message.text !== "string"
      ) {
        return NextResponse.json({ message: "No user text" }, { status: 200 });
      }
      // Ignore if sender is the same as the page/business itself
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
      if (pendingReplies.has(convoKey)) {
        pendingMessages.get(convoKey)?.push(messagingEvent.message.text);
        return NextResponse.json(
          { message: "Reply already scheduled" },
          { status: 200 }
        );
      }
      pendingMessages.set(convoKey, [messagingEvent.message?.text]);
      pendingReplies.set(
        convoKey,
        setTimeout(async () => {
          const allMessages = pendingMessages.get(convoKey)?.join("\n") || "";
          pendingMessages.delete(convoKey);
          pendingReplies.delete(convoKey);

          matcher = await matchKeyword(allMessages);

          if (matcher && matcher.automationId) {
            console.log("Matched");
            // We have a keyword matcher

            if (webhook_payload.entry[0].messaging) {
              const automation = await getKeywordAutomation(
                matcher.automationId,
                true
              );

              if (automation && automation.trigger) {
                if (
                  automation.listener &&
                  automation.listener.listener === "MESSAGE"
                ) {
                  const entryId = webhook_payload.entry[0].id;
                  const senderId =
                    webhook_payload.entry[0].messaging[0].sender.id;
                  const prompt = automation.listener?.prompt;
                  const token = automation.User?.integrations[0].token!;
                  const automationId = automation.id;

                  const direct_message = await sendDM(
                    entryId,
                    senderId,
                    prompt,
                    token
                  );

                  if (direct_message.status === 200) {
                    await trackResponses(automationId, "DM");
                  }
                }

                if (
                  automation.listener &&
                  automation.listener.listener === "SMARTAI" &&
                  automation.User?.subscription?.plan === "PRO"
                ) {
                  const smart_ai_message = await openai.chat.completions.create(
                    {
                      model: "gpt-4o",
                      messages: [
                        {
                          role: "assistant",
                          content: `${automation.listener?.prompt}: Keep responses under 2 sentences`,
                        },
                      ],
                    }
                  );

                  if (smart_ai_message.choices[0].message.content) {
                    const entryId = webhook_payload.entry[0].id;
                    const senderId =
                      webhook_payload.entry[0].messaging[0].sender.id;
                    const automationId = automation.id;
                    const token = automation.User?.integrations[0].token!;
                    const content = smart_ai_message.choices[0].message.content;
                    const userMessage = allMessages;

                    const reciever = createChatHistory(
                      automationId,
                      entryId,
                      senderId,
                      userMessage
                    );

                    const sender = createChatHistory(
                      automationId,
                      entryId,
                      senderId,
                      content
                    );

                    await client.$transaction([reciever, sender]);

                    const direct_message = await sendDM(
                      entryId,
                      senderId,
                      content,
                      token
                    );

                    if (direct_message.status === 200) {
                      await trackResponses(automationId, "DM");
                    }
                  }
                }
              }
            }
          }
        }, 60000)
      );
      return NextResponse.json({ message: "Reply scheduled" }, { status: 200 });
    }

    // Handle changes events
    if (webhook_payload.entry[0].changes) {
      const changeValue = webhook_payload.entry[0].changes[0].value;
      // Check for no user text
      if (!changeValue.text || typeof changeValue.text !== "string") {
        return NextResponse.json({ message: "No user text" }, { status: 200 });
      }
      // Ignore if comment is from the page/business itself
      if (
        changeValue.from?.id &&
        changeValue.from.id === webhook_payload.entry[0].id
      ) {
        return NextResponse.json(
          { message: "Own message ignored" },
          { status: 200 }
        );
      }
      // Duplicate comment/message check
      const messageId = changeValue.id;
      if (typeof messageId === "string") {
        if (processedMessageIds.has(messageId)) {
          return NextResponse.json(
            { message: "Duplicate ignored" },
            { status: 200 }
          );
        }
        processedMessageIds.add(messageId);
      }

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
          const allMessages = pendingMessages.get(convoKey)?.join("\n") || "";
          pendingMessages.delete(convoKey);
          pendingReplies.delete(convoKey);

          matcher = await matchKeyword(allMessages);

          if (matcher && matcher.automationId) {
            console.log("Matched");
            if (
              webhook_payload.entry[0].changes &&
              webhook_payload.entry[0].changes[0].field === "comments"
            ) {
              const automation = await getKeywordAutomation(
                matcher.automationId,
                false
              );

              console.log("geting the automations");

              const automations_post = await getKeywordPost(
                webhook_payload.entry[0].changes[0].value.media.id,
                automation?.id!
              );

              console.log("found keyword ", automations_post);

              if (automation && automations_post && automation.trigger) {
                console.log("first if");
                if (automation.listener) {
                  console.log("first if");
                  if (automation.listener.listener === "MESSAGE") {
                    console.log(
                      "SENDING DM, WEB HOOK PAYLOAD",
                      webhook_payload,
                      "changes",
                      webhook_payload.entry[0].changes[0].value.from
                    );

                    console.log(
                      "COMMENT VERSION:",
                      webhook_payload.entry[0].changes[0].value.from.id
                    );

                    const entryId = webhook_payload.entry[0].id;
                    const commentId =
                      webhook_payload.entry[0].changes[0].value.id;
                    const prompt = automation.listener?.prompt;
                    const token = automation.User?.integrations[0].token!;
                    const automationId = automation.id;

                    const direct_message = await sendPrivateMessage(
                      entryId,
                      commentId,
                      prompt,
                      token
                    );

                    if (direct_message.status === 200) {
                      await trackResponses(automationId, "COMMENT");
                    }
                  }
                  if (
                    automation.listener.listener === "SMARTAI" &&
                    automation.User?.subscription?.plan === "PRO"
                  ) {
                    const smart_ai_message =
                      await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [
                          {
                            role: "assistant",
                            content: `${automation.listener?.prompt}: keep responses under 2 sentences`,
                          },
                        ],
                      });
                    if (smart_ai_message.choices[0].message.content) {
                      const entryId = webhook_payload.entry[0].id;
                      const commentId =
                        webhook_payload.entry[0].changes[0].value.id;
                      const automationId = automation.id;
                      const token = automation.User?.integrations[0].token!;
                      const content =
                        smart_ai_message.choices[0].message.content;
                      const fromId =
                        webhook_payload.entry[0].changes[0].value.from.id;
                      const userText = allMessages;

                      const reciever = createChatHistory(
                        automationId,
                        entryId,
                        fromId,
                        userText
                      );

                      const sender = createChatHistory(
                        automationId,
                        entryId,
                        fromId,
                        content
                      );

                      await client.$transaction([reciever, sender]);

                      const direct_message = await sendPrivateMessage(
                        entryId,
                        commentId,
                        content,
                        token
                      );

                      if (direct_message.status === 200) {
                        await trackResponses(automationId, "COMMENT");
                      }
                    }
                  }
                }
              }
            }
          }
        }, 60000)
      );
      return NextResponse.json({ message: "Reply scheduled" }, { status: 200 });
    }

    if (!matcher) {
      const customer_history = await getChatHistory(
        webhook_payload.entry[0].messaging[0].recipient.id,
        webhook_payload.entry[0].messaging[0].sender.id
      );

      if (customer_history.history.length > 0) {
        const automation = await findAutomation(customer_history.automationId!);

        if (
          automation?.User?.subscription?.plan === "PRO" &&
          automation.listener?.listener === "SMARTAI"
        ) {
          const smart_ai_message = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "assistant",
                content: `${automation.listener?.prompt}: keep responses under 2 sentences`,
              },
              ...customer_history.history,
              {
                role: "user",
                content: webhook_payload.entry[0].messaging[0].message.text,
              },
            ],
          });

          if (smart_ai_message.choices[0].message.content) {
            const entryId = webhook_payload.entry[0].id;
            const senderId = webhook_payload.entry[0].messaging[0].sender.id;
            const automationId = automation.id;
            const token = automation.User?.integrations[0].token!;
            const content = smart_ai_message.choices[0].message.content;
            const userMessage =
              webhook_payload.entry[0].messaging[0].message.text;

            const reciever = createChatHistory(
              automationId,
              entryId,
              senderId,
              userMessage
            );

            const sender = createChatHistory(
              automationId,
              entryId,
              senderId,
              content
            );
            await client.$transaction([reciever, sender]);
            const direct_message = await sendDM(
              entryId,
              senderId,
              content,
              token
            );

            if (direct_message.status === 200) {
              // tracked inside delayed block if needed
              await trackResponses(automationId, "DM");
            }
            return NextResponse.json(
              {
                message: "Message sent",
              },
              { status: 200 }
            );
          }
        }
      }

      return NextResponse.json(
        {
          message: "No automation set",
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        message: "No automation set",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "No automation set",
      },
      { status: 200 }
    );
  }
}
