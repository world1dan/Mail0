"use client";
import { dexieStorageProvider } from "@/lib/idb";
import { SWRConfig } from "swr";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <SWRConfig
        value={{
          provider: dexieStorageProvider,
          keepPreviousData: true,
          revalidateOnFocus: false,
        }}
      >
        {children}
      </SWRConfig>
    </div>
  );
}
