"use client";
import { $fetch, useSession } from "@/lib/auth-client";
import { InitialThread, ParsedMessage } from "@/types";
import { BASE_URL } from "@/lib/constants";
import { getMail } from "@/actions/mail";
import useSWR, { preload } from "swr";

export const preloadThread = (userId: string, threadId: string, connectionId: string) => {
  console.log(`🔄 Prefetching email ${threadId}...`);
  preload([userId, threadId, connectionId], fetchThread);
};

// TODO: improve the filters
const fetchEmails = async (args: any[]) => {
  const [_, folder, query, max, labelIds] = args;

  const searchParams = new URLSearchParams();
  if (max) searchParams.set("max", max.toString());
  if (query) searchParams.set("q", query);
  if (folder) searchParams.set("folder", folder.toString());
  if (labelIds) searchParams.set("labelIds", labelIds.join(","));

  const data = await getMail({ folder, q: query, max, labelIds });

  return data;
};

const fetchThread = async (args: any[]): Promise<ParsedMessage[]> => {
  const [_, id] = args;
  return await $fetch(`/api/v1/mail/${id}/`, {
    baseURL: BASE_URL,
  }).then((e) => e.data as ParsedMessage[]);
};

// Based on gmail
interface RawResponse {
  nextPageToken: number;
  threads: InitialThread[];
  resultSizeEstimate: number;
}

export const useThreads = (folder: string, labelIds?: string[], query?: string, max?: number) => {
  const { data: session } = useSession();
  const { data, isLoading, error, isValidating } = useSWR<RawResponse>(
    session?.user.id
      ? [session?.user.id, folder, query, max, labelIds, session.connectionId]
      : null,
    fetchEmails,
  );

  return {
    data: data,
    isLoading: isLoading,
    isValidating: isValidating,
    error,
  };
};

export const useThread = (id: string) => {
  const { data: session } = useSession();

  const { data, isLoading, error } = useSWR<ParsedMessage[]>(
    session?.user.id ? [session.user.id, id, session.connectionId] : null,
    fetchThread,
  );

  return { data, isLoading, error };
};

export const useMarkAsRead = () => {
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/mail/${id}/read`, {
        method: "POST",
      });

      return response.ok;
    } catch (error) {
      console.error("Error marking email as read:", error);
      return false;
    }
  };

  return { markAsRead };
};
