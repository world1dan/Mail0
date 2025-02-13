import { NextRequest, NextResponse } from "next/server";
import { earlyAccess } from "@/db/schema";
import { randomUUID } from "node:crypto";
import { db } from "@/db";

type PostgresError = {
  code: string;
  message: string;
};

export async function POST(req: NextRequest) {
  try {
    // Log the incoming request
    console.log("Received early access request");

    // Validate request body
    const body = await req.json();
    console.log("Request body:", body);

    const { email } = body;

    if (!email) {
      console.log("Email missing from request");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const now = new Date();

    try {
      // Log the attempted insert
      console.log("Attempting to insert email:", email);

      const result = await db.insert(earlyAccess).values({
        id: randomUUID(),
        email,
        createdAt: now,
        updatedAt: now,
      });

      console.log("Insert successful:", result);
    } catch (err) {
      const pgError = err as PostgresError;
      console.error("Database error:", {
        code: pgError.code,
        message: pgError.message,
        fullError: err,
      });

      // Handle duplicate emails more explicitly
      if (pgError.code === "23505") {
        return NextResponse.json(
          { message: "Email already registered for early access" },
          { status: 200 },
        );
      }

      throw err;
    }

    return NextResponse.json({ message: "Successfully joined early access" }, { status: 201 });
  } catch (error) {
    console.error("Early access registration error:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return more detailed error in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        {
          error: "Internal server error",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
