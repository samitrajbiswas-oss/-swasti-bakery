import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";

const COOKIE_NAME = "swasti_admin_session";

function getExpectedSessionToken() {
  const secret = String(process.env.ADMIN_KEY ?? "").trim();

  return crypto
    .createHmac("sha256", secret)
    .update("swasti-bakery-admin")
    .digest("hex");
}

function isAdminAuthenticated(request: Request) {
  const adminKey = String(process.env.ADMIN_KEY ?? "").trim();

  if (!adminKey) return false;

  const cookieHeader = request.headers.get("cookie") || "";

  const cookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim());

  const adminCookie = cookies.find((cookie) =>
    cookie.startsWith(`${COOKIE_NAME}=`)
  );

  if (!adminCookie) return false;

  const providedToken = adminCookie.substring(
    COOKIE_NAME.length + 1
  );

  return providedToken === getExpectedSessionToken();
}

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

async function getAuthorizedUser(request: Request) {
  /*
   * IMPORTANT:
   *
   * Prefer a valid Firebase customer token when one is supplied.
   *
   * This matters when the same browser has previously logged into
   * the Baker/admin dashboard and therefore still has the admin
   * cookie. A customer request also sends a Firebase Bearer token,
   * and that token must determine the sender as CUSTOMER.
   */
  const authorization = request.headers.get("authorization") || "";

  if (authorization.startsWith("Bearer ")) {
    const uid = await getCustomerUid(request);

    if (!uid) {
      return null;
    }

    return {
      type: "CUSTOMER" as const,
      uid,
    };
  }

  if (isAdminAuthenticated(request)) {
    return {
      type: "ADMIN" as const,
      uid: null,
    };
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthorizedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestId = String(
      searchParams.get("requestId") ?? ""
    ).trim();

    if (!requestId) {
      return NextResponse.json(
        {
          success: false,
          message: "Request ID is required.",
        },
        { status: 400 }
      );
    }

    const cakeRequest = await prisma.cakeRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!cakeRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Cake request not found.",
        },
        { status: 404 }
      );
    }

    /*
     * CUSTOMER SECURITY:
     *
     * The customer can ONLY access a cake request belonging
     * to the Firebase UID contained in their verified token.
     *
     * We do NOT trust a userId supplied by the browser.
     */
    if (
      user.type === "CUSTOMER" &&
      cakeRequest.userId !== user.uid
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have access to this chat.",
        },
        { status: 403 }
      );
    }

    /*
     * Create the conversation if this is an older cake request
     * that was created before automatic chat creation was added.
     */
    const conversation = await prisma.chatConversation.upsert({
      where: {
        cakeRequestId: cakeRequest.id,
      },
      update: {},
      create: {
        cakeRequestId: cakeRequest.id,
        userId: cakeRequest.userId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    /*
     * CUSTOMER READ TRACKING:
     *
     * When a customer opens their own chat, mark the newest
     * Baker message currently visible as read.
     *
     * We use the newest Baker message timestamp rather than
     * the current server time so a message arriving after
     * this request was read is not incorrectly marked as read.
     */
    if (user.type === "CUSTOMER") {
      const adminMessages = conversation.messages.filter(
        (message) => message.senderType === "ADMIN"
      );

      const latestAdminMessage =
        adminMessages[adminMessages.length - 1];

      if (latestAdminMessage) {
        await prisma.chatConversation.update({
          where: {
            id: conversation.id,
          },
          data: {
            customerLastReadAt: latestAdminMessage.createdAt,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      request: {
        id: cakeRequest.id,
        customerName: cakeRequest.customerName,
        phone: cakeRequest.phone,
        email: cakeRequest.email,
        cakeSize: cakeRequest.cakeSize,
        flavor: cakeRequest.flavor,
        design: cakeRequest.design,
        message: cakeRequest.message,
        requiredDate: cakeRequest.requiredDate,
        preferredTime: cakeRequest.preferredTime,
        fulfillment: cakeRequest.fulfillment,
        deliveryAddress: cakeRequest.deliveryAddress,
        deliveryChargeApplicable:
          cakeRequest.deliveryChargeApplicable,
        eggless: cakeRequest.eggless,
        vegetarian: cakeRequest.vegetarian,
        status: cakeRequest.status,
        userId: cakeRequest.userId,
        createdAt: cakeRequest.createdAt,
      },
      conversation: {
        id: conversation.id,
        messages: conversation.messages,
      },
    });
  } catch (error) {
    console.error("Get chat error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load chat.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthorizedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const requestId = String(body.requestId ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!requestId) {
      return NextResponse.json(
        {
          success: false,
          message: "Request ID is required.",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: "Message cannot be empty.",
        },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: "Message is too long.",
        },
        { status: 400 }
      );
    }

    const cakeRequest = await prisma.cakeRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!cakeRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Cake request not found.",
        },
        { status: 404 }
      );
    }

    /*
     * CUSTOMER SECURITY:
     *
     * A customer may NEVER access another customer's request,
     * even if they manually change requestId in the URL or API.
     */
    if (
      user.type === "CUSTOMER" &&
      cakeRequest.userId !== user.uid
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have access to this chat.",
        },
        { status: 403 }
      );
    }

    const conversation = await prisma.chatConversation.upsert({
      where: {
        cakeRequestId: cakeRequest.id,
      },
      update: {},
      create: {
        cakeRequestId: cakeRequest.id,
        userId: cakeRequest.userId,
      },
    });

    const chatMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: user.type,
        senderUserId: user.type === "CUSTOMER" ? user.uid : null,
        message,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: chatMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send chat message error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to send message.",
      },
      { status: 500 }
    );
  }
}
