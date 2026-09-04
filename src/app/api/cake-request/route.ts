import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "swasti_admin_session";

/* =========================================
   CREATE THE SAME SESSION TOKEN
   USED BY /api/admin/auth
========================================= */

function getExpectedSessionToken() {
  const secret = String(
    process.env.ADMIN_KEY ?? ""
  ).trim();

  return crypto
    .createHmac("sha256", secret)
    .update("swasti-bakery-admin")
    .digest("hex");
}

/* =========================================
   CHECK ADMIN COOKIE
========================================= */

function isAdminAuthenticated(
  request: Request
) {
  const adminKey = String(
    process.env.ADMIN_KEY ?? ""
  ).trim();

  if (!adminKey) {
    return false;
  }

  const cookieHeader =
    request.headers.get("cookie") || "";

  const cookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim());

  const adminCookie = cookies.find(
    (cookie) =>
      cookie.startsWith(
        `${COOKIE_NAME}=`
      )
  );

  if (!adminCookie) {
    return false;
  }

  const providedToken =
    adminCookie.substring(
      COOKIE_NAME.length + 1
    );

  const expectedToken =
    getExpectedSessionToken();

  return (
    providedToken === expectedToken
  );
}

/* =========================================
   CUSTOMER SUBMITS CAKE REQUEST
========================================= */

export async function POST(
  request: Request
) {
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

    /* REQUIRED FIELDS */

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
          message:
            "Please fill in all required fields.",
        },
        { status: 400 }
      );
    }

    /* SAVE REQUEST */

    const cakeRequest =
      await prisma.cakeRequest.create({
        data: {
          customerName: String(
            customerName
          ),

          phone: String(phone),

          email: String(email),

          cakeSize: String(
            cakeSize
          ),

          flavor: String(flavor),

          design: String(design),

          message: message
            ? String(message)
            : null,

          requiredDate: String(
            requiredDate
          ),

          preferredTime: String(
            preferredTime
          ),

          fulfillment: String(
            fulfillment
          ),

          deliveryAddress:
            fulfillment ===
              "delivery" &&
            deliveryAddress
              ? String(
                  deliveryAddress
                )
              : null,

          deliveryChargeApplicable:
            Boolean(
              deliveryChargeApplicable
            ),

          eggless: true,

          vegetarian: true,

          status: "NEW",

          userId: String(userId),
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Cake request submitted successfully.",
        requestId:
          cakeRequest.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Cake request API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to save cake request.",
      },
      { status: 500 }
    );
  }
}

/* =========================================
   ADMIN GETS ALL CAKE REQUESTS
========================================= */

export async function GET(
  request: Request
) {
  try {
    /* CHECK ADMIN LOGIN */

    if (
      !isAdminAuthenticated(request)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    /* GET REQUESTS */

    const requests =
      await prisma.cakeRequest.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error(
      "Get cake requests error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load cake requests.",
      },
      { status: 500 }
    );
  }
}