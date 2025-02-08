"use client";

import { ModeToggle } from "@/components/theme/mode-toggle";
import { LogOut, Settings, User } from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function NavUser() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isMobile } = useSidebar();

  return (
    <DropdownMenu>
      <SidebarMenu>
        <SidebarMenuItem>
          {session && (
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Image
                  src={session.user.image || "/placeholder.svg"}
                  alt={session.user.name}
                  className="size-8 shrink-0 rounded-lg"
                  width={32}
                  height={32}
                />
                <div className="ml-1 flex min-w-0 flex-col gap-1 leading-none">
                  <span className="font-semibold">{session.user.name}</span>
                  <span className="truncate">{session.user.email}</span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-64"
        align="end"
        side={isMobile ? "bottom" : "right"}
        sideOffset={4}
      >
        <DropdownMenuItem>
          <User className="mr-2 size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center justify-between focus:bg-inherit"
          onSelect={(e) => {
            e.preventDefault();
          }}
        >
          Theme
          <ModeToggle />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <button
            onClick={async () => {
              await signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/");
                  },
                },
              });
            }}
            className="flex items-center"
          >
            <LogOut className="mr-2 size-4" />
            Log out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
