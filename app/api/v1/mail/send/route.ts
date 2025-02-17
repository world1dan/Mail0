import { NextRequest, NextResponse } from "next/server";
import { createDriver } from "@/app/api/driver";
import { connection } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, message, attachments } = await req.json();

    if (!to || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    if (!session.connectionId) return new Response("Unauthorized", { status: 401 });

    // Get the user's Google connection
    const [_connection] = await db
      .select()
      .from(connection)
      .where(and(eq(connection.userId, session.user.id), eq(connection.id, session.connectionId)));

    if (!_connection?.accessToken || !_connection.refreshToken) {
      return new Response("Unauthorized, reconnect", { status: 401 });
    }

    // Create the driver with the user's credentials
    const driver = await createDriver(_connection.providerId, {
      auth: {
        access_token: _connection.accessToken,
        refresh_token: _connection.refreshToken,
      },
    });

    // Create the email message in RFC 5322 format
    const emailContent = [
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `To: ${to}`,
      `Subject: ${subject}`,
      "",
      message,
    ].join("\r\n");

    // Convert the message to base64 format
    const encodedMessage = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await driver.create({
      raw: encodedMessage,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
