/* eslint-disable @typescript-eslint/no-explicit-any */
import { MailManager, IConfig, UserInfo } from "../types";
import { env } from "@/lib/env";
import * as he from "he";

const outlookDriver = async (config: IConfig): Promise<MailManager> => {
  const scope = () =>
    "https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access";

  // Helper function to make requests to Microsoft Graph API.
  const graphRequest = async (endpoint: string, method: string = "GET", body?: any) => {
    const url = `https://graph.microsoft.com/v1.0${endpoint}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${config.auth?.access_token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Graph API error: ${errorText}`);
    }
    return res.json();
  };

  return {
    markAsRead: async (id: string) => {
      await graphRequest(`/me/messages/${id}`, "PATCH", { isRead: true });
    },
    getScope: scope,
    getUserInfo: async (tokens: { access_token: string; refresh_token: string }) => {
      config.auth = tokens;
      try {
        const outlookPayload = await graphRequest("/me", "GET");

        const userInfo: UserInfo = {
          email: outlookPayload.mail || outlookPayload.userPrincipalName,
          name: outlookPayload.displayName,
          picture: null,
        };

        return userInfo;
      } catch (error: any) {
        console.error("Error fetching user info from Outlook:", error);
        throw new Error(`Failed to get user info from Outlook: ${error.message}`);
      }
    },
    getTokens: async <T>(code: string) => {
      const params = new URLSearchParams();
      params.append("client_id", env.MICROSOFT_CLIENT_ID as string);
      params.append("client_secret", env.MICROSOFT_CLIENT_SECRET as string);
      params.append("code", code);
      params.append("redirect_uri", env.MICROSOFT_REDIRECT_URI as string);
      params.append("grant_type", "authorization_code");

      const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }
      const tokenData = await tokenRes.json();
      return { tokens: tokenData } as T;
    },
    generateConnectionAuthUrl: (userId: string) => {
      const params = new URLSearchParams({
        client_id: env.MICROSOFT_CLIENT_ID as string,
        response_type: "code",
        redirect_uri: env.MICROSOFT_REDIRECT_URI as string,
        response_mode: "query",
        scope: scope(),
        state: userId,
      });

      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    },
    count: async () => {
      // For demonstration, count messages in the Inbox and JunkEmail folders.
      const inbox = await graphRequest("/me/mailFolders/Inbox", "GET");
      const junk = await graphRequest("/me/mailFolders/JunkEmail", "GET");
      return [inbox.totalItemCount, junk.totalItemCount];
    },
    list: async (folder, q, maxResults = 10, _labelIds: string[] = []) => {
      // Map common folder names to Outlook folder names.
      let mailFolder = "Inbox";
      switch (folder.toLowerCase()) {
        case "trash":
          mailFolder = "DeletedItems";
          break;
        case "spam":
          mailFolder = "JunkEmail";
          break;
        case "sent":
          mailFolder = "SentItems";
          break;
        default:
          mailFolder = "Inbox";
      }

      // TODO: Fetch threads using conversationId filter:
      // https://stackoverflow.com/questions/63569882/microsoft-graph-invalid-filter-clause-conversationid/63570384#63570384
      let url = `/me/mailFolders/${mailFolder}/messages?$top=${maxResults}`;
      if (q) {
        url += `&$search="${q}"`;
      }
      const data = await graphRequest(url, "GET");
      const threads = await Promise.all(
        (data.value || []).map(async (message: any) => {
          const sender = message.from?.emailAddress;
          const senderName = sender?.name || "Unknown";
          const senderEmail = `<${sender?.address}>`;

          return {
            id: message.id,
            title: message.subject || "",
            tags: [],
            sender: {
              name: senderName,
              email: senderEmail,
            },
            unread: message.isRead === false,
            receivedOn: message.receivedDateTime,
            subject: message.subject,
            body: "",
            processedHtml: "",
            blobUrl: "",
            totalReplies: 1,
          };
        }),
      );
      return { threads, ...data };
    },
    get: async (id: string) => {
      const message = await graphRequest(`/me/messages/${id}`, "GET");
      const bodyContent = message.body?.content || "";
      const decodedBody = he.decode(bodyContent);
      const sender = message.from?.emailAddress;
      const senderName = sender?.name || "Unknown";
      const senderEmail = `<${sender?.address}>`;
      const parsedData = {
        id: message.id,
        title: message.subject || "",
        tags: [],
        sender: {
          name: senderName,
          email: senderEmail,
        },
        unread: message.isRead === false,
        receivedOn: message.receivedDateTime,
        subject: message.subject,
      };
      const fullEmailData = {
        ...parsedData,
        body: message.body?.content || "",
        processedHtml: "",
        blobUrl: "",
        decodedBody,
        totalReplies: 1,
      };
      return [fullEmailData];
    },
    create: async (data: any) => {
      const res = await graphRequest("/me/sendMail", "POST", {
        message: data,
        saveToSentItems: true,
      });
      return res;
    },
    delete: async (id: string) => {
      await graphRequest(`/me/messages/${id}`, "DELETE");
      return { success: true };
    },
  };
};

export default outlookDriver;
