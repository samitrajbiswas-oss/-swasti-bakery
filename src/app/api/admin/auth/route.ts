import { NextResponse } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "swasti_admin_session";

function createSessionToken() {
  const adminKey = process.env.ADMIN_KEY || "";

  return crypto
    .createHmac("sha256", adminKey)
    .update("swasti-bakery-admin")
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const enteredKey = String(
      body.key ?? ""
    ).trim();

    const adminKey = String(
      process.env.ADMIN_KEY ?? ""
    ).trim();

    if (!adminKey) {
      console.error(
        "ADMIN_KEY is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Admin authentication is not configured.",
        },
        { status: 500 }
      );
    }

    if (enteredKey !== adminKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid admin key.",
        },
        { status: 401 }
      );
    }

    // Correct key:
    // create a secure server-side session
    const sessionToken =
      createSessionToken();

    const response = NextResponse.json({
      success: true,
      message:
        "Admin authentication successful.",
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error(
      "Admin authentication error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify admin key.",
      },
      { status: 500 }
    );
  }
}

/* =========================================
   ADMIN LOGOUT
========================================= */

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
