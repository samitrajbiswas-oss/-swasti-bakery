import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

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
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  const adminCookie = cookies.find((cookie) =>
    cookie.startsWith(`${COOKIE_NAME}=`)
  );

  if (!adminCookie) return false;

  const providedToken = adminCookie.substring(COOKIE_NAME.length + 1);

  return providedToken === getExpectedSessionToken();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      phone,
      email,
      cakeSize,
      flavor,
      design,
      message,
      requiredDate,
      preferredTime,
      fulfillment,
      deliveryAddress,
      deliveryChargeApplicable,
      userId,
    } = body;

    if (
      !customerName ||
      !phone ||
      !email ||
      !cakeSize ||
      !flavor ||
      !design ||
      !requiredDate ||
      !preferredTime ||
      !fulfillment ||
      !userId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill in all required fields.",
        },
        { status: 400 }
      );
    }

    /*
     * Create the cake request and its chat conversation together.
     *
     * Every submitted cake request automatically gets one
     * private chat conversation for the customer and baker.
     */
    const cakeRequest = await prisma.cakeRequest.create({
      data: {
        customerName: String(customerName),
        phone: String(phone),
        email: String(email),
        cakeSize: String(cakeSize),
        flavor: String(flavor),
        design: String(design),
        message: message ? String(message) : null,
        requiredDate: String(requiredDate),
        preferredTime: String(preferredTime),
        fulfillment: String(fulfillment),
        deliveryAddress:
          fulfillment === "delivery" && deliveryAddress
            ? String(deliveryAddress)
            : null,
        deliveryChargeApplicable: Boolean(deliveryChargeApplicable),
        eggless: true,
        vegetarian: true,
        status: "NEW",
        userId: String(userId),

        /*
         * Automatically create the chat belonging to this
         * cake request.
         */
        chatConversation: {
          create: {
            userId: String(userId),
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Cake request submitted successfully.",
        requestId: cakeRequest.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Cake request API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save cake request.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const requests = await prisma.cakeRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get cake requests error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load cake requests.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Request ID is required.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.cakeRequest.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Cake request not found.",
        },
        { status: 404 }
      );
    }

    await prisma.cakeRequest.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cake request deleted successfully.",
    });
  } catch (error) {
    console.error("Delete cake request error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete cake request.",
      },
      { status: 500 }
    );
  }
}