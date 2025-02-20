/* eslint-disable @typescript-eslint/no-explicit-any */
import { connection, user as _user, account } from "@/db/schema";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { customSession } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { env } from "./env";
import { db } from "@/db";

// If there is no resend key, it might be a local dev environment
// In that case, we don't want to send emails and just log them
const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : { emails: { send: async (...args: any[]) => console.log(args) } };

const options = {
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  advanced: {
    ipAddress: {
      disableIpTracking: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  socialProviders: {
    google: {
      // Remove this before going to prod, it's to force to get `refresh_token` from google, some users don't have it yet.
      prompt: "consent",
      accessType: "offline",
      scope: ["https://mail.google.com/"],
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    microsoft: {
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      scope: ["User.Read", "Mail.ReadWrite", "Mail.Send", "offline_access"],
    },
  },
  emailAndPassword: {
    enabled: false,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "Mail0 <onboarding@mail0.io>",
        to: user.email,
        subject: "Reset your password",
        html: `
          <h2>Reset Your Password</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${url}">${url}</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      const verificationUrl = `${env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}&callbackURL=/connect-emails`;

      await resend.emails.send({
        from: "Mail0 <onboarding@mail0.io>",
        to: user.email,
        subject: "Verify your Mail0 account",
        html: `
          <h2>Verify Your Mail0 Account</h2>
          <p>Click the link below to verify your email:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
        `,
      });
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const [foundUser] = await db
        .select({
          activeConnectionId: _user.defaultConnectionId,
        })
        .from(_user)
        .where(eq(_user.id, user.id))
        .limit(1);
      if (!foundUser.activeConnectionId) {
        const [defaultConnection] = await db
          .select()
          .from(connection)
          .where(eq(connection.userId, user.id))
          .limit(1);
        if (!defaultConnection) {
          // find the user account the user has
          const [userAccount] = await db
            .select()
            .from(account)
            .where(eq(account.userId, user.id))
            .limit(1);
          if (userAccount) {
            // create a new connection
            const [newConnection] = await db.insert(connection).values({
              id: crypto.randomUUID(),
              userId: user.id,
              email: user.email,
              name: user.name,
              picture: user.image,
              accessToken: userAccount.accessToken,
              refreshToken: userAccount.refreshToken,
              scope: userAccount.scope,
              providerId: userAccount.providerId,
              expiresAt: new Date(
                Date.now() + (userAccount.accessTokenExpiresAt?.getTime() || 3600000),
              ),
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);
            // this type error is pissing me tf off
            if (newConnection) {
              console.log("Created new connection for user", newConnection);
            }
          }
        }
        return {
          connectionId: defaultConnection ? defaultConnection.id : null,
          user,
          session,
        };
      }
      return {
        connectionId: foundUser.activeConnectionId,
        user,
        session,
      };
    }),
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS ?? [],
});
