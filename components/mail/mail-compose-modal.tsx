"use client";

import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/responsive-modal";
import { useOpenComposeModal } from "@/hooks/use-open-compose-modal";
import { MailCompose } from "./mail-compose";
import { X } from "lucide-react";

export default function MailComposeModal() {
  const { isOpen, setIsOpen, close } = useOpenComposeModal();

  return (
    <Credenza open={isOpen} onOpenChange={setIsOpen}>
      <CredenzaContent className="bg-card p-0 md:min-w-[500px]">
        <CredenzaHeader>
          <CredenzaTitle className="flex items-center justify-between gap-2 p-6">
            <p>New Message</p>
            <CredenzaClose className="hidden md:block" asChild>
              <X className="size-5 cursor-pointer transition-colors hover:text-muted-foreground" />
            </CredenzaClose>
          </CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <MailCompose onClose={close} />
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
