import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

async function getCustomerUid(request: Request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authorization.substring("Bearer ".length).trim();

  if (!idToken) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const uid = await getCustomerUid(request);

    if (!uid) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const conversations = await prisma.chatConversation.findMany({
      where: {
        userId: uid,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        cakeRequest: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    const chats = conversations.map((conversation) => {
      const latestMessage = conversation.messages[0] ?? null;

      const unread =
        latestMessage?.senderType === "ADMIN" &&
        (!conversation.customerLastReadAt ||
          new Date(latestMessage.createdAt) >
            new Date(conversation.customerLastReadAt));

      return {
        conversationId: conversation.id,
        requestId: conversation.cakeRequestId,

        customerName: conversation.cakeRequest.customerName,

        cakeSize: conversation.cakeRequest.cakeSize,
        flavor: conversation.cakeRequest.flavor,
        design: conversation.cakeRequest.design,

        requiredDate: conversation.cakeRequest.requiredDate,
        preferredTime: conversation.cakeRequest.preferredTime,

        fulfillment: conversation.cakeRequest.fulfillment,

        status: conversation.cakeRequest.status,

        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              senderType: latestMessage.senderType,
              message: latestMessage.message,
              createdAt: latestMessage.createdAt,
            }
          : null,

        unread,

        updatedAt: conversation.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("My chats API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load your chats.",
      },
      { status: 500 }
    );
  }
}