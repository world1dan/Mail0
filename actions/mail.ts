"use server";

import { createDriver } from "@/app/api/driver";
import { connection } from "@/db/schema";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";

export const getMail = async ({
  folder,
  q,
  max,
  labelIds,
}: {
  folder: string;
  q?: string;
  max?: number;
  labelIds?: string[];
}) => {
  if (!folder) {
    throw new Error("Missing required fields");
  }

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) {
    throw new Error("Unauthorized, reconnect");
  }

  // Updated to use googleConnection table
  const [_connection] = await db
    .select()
    .from(connection)
    .where(and(eq(connection.userId, session.user.id), eq(connection.id, session.connectionId)));

  if (!_connection?.accessToken || !_connection.refreshToken) {
    throw new Error("Unauthorized, reconnect");
  }

  const driver = await createDriver(_connection.providerId, {
    auth: {
      access_token: _connection.accessToken,
      refresh_token: _connection.refreshToken,
    },
  });

  return await driver.list(folder, q, max, labelIds);
};
