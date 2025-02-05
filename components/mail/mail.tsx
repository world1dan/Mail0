"use client";

import * as React from "react";
import {
  Search,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MailDisplay } from "@/components/mail/mail-display";
import { MailList } from "@/components/mail/mail-list";
import { type Mail } from "@/components/mail/data";
import { useMail } from "@/components/mail/use-mail";

interface MailProps {
  accounts: {
    label: string;
    email: string;
    icon: React.ReactNode;
  }[];
  mails: Mail[];
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function Mail({ mails }: MailProps) {
  const [mail] = useMail();
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-">
        {/* Left Sidebar */}
        {/* <div className={cn(
          "flex flex-col w-[240px] border-r",
          isCollapsed && "w-[50px] transition-all duration-300 ease-in-out"
        )}>
          <div className={cn(
            "flex h-[52px] mt-1 items-center justify-center",
            isCollapsed ? "h-[52px]" : "px-2"
          )}>
            <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
          </div>
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Inbox",
                label: "128",
                icon: Inbox,
                variant: "default",
              },
              {
                title: "Drafts",
                label: "9",
                icon: File,
                variant: "ghost",
              },
              {
                title: "Sent",
                label: "",
                icon: Send,
                variant: "ghost",
              },
              {
                title: "Junk",
                label: "23",
                icon: ArchiveX,
                variant: "ghost",
              },
              {
                title: "Trash",
                label: "",
                icon: Trash2,
                variant: "ghost",
              },
              {
                title: "Archive",
                label: "",
                icon: Archive,
                variant: "ghost",
              },
            ]}
          />
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Social",
                label: "972",
                icon: Users2,
                variant: "ghost",
              },
              {
                title: "Updates",
                label: "342",
                icon: AlertCircle,
                variant: "ghost",
              },
              {
                title: "Forums",
                label: "128",
                icon: MessagesSquare,
                variant: "ghost",
              },
              {
                title: "Shopping",
                label: "8",
                icon: ShoppingCart,
                variant: "ghost",
              },
              {
                title: "Promotions",
                label: "21",
                icon: Archive,
                variant: "ghost",
              },
            ]}
          />
          <div className="flex-1" />
          <div className="mt-auto flex flex-col justify-center items-center gap-4 mb-3">
            <Separator />
            <ModeToggle />
          </div>
        </div> */}

        {/* Middle Panel */}
        <div className="flex-1 border-r overflow-y-auto hide-scrollbar">
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">Inbox</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="all"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  All mail
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background p-4 backdrop-blur supports-[backdrop-filter]:bg-background">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <MailList items={mails} />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <MailList items={mails.filter((item) => !item.read)} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel */}
        <div className="flex-1 overflow-y-auto">
          <MailDisplay
            mail={mails.find((item) => item.id === mail.selected) || null}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
