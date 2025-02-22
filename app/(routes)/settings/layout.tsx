// app/layout.tsx

import { CommandPaletteProvider } from "@/components/ui/command-palette";
import "./globals.css";

export const metadata = {
  title: "Mail0",
  description: "Open Source Email App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CommandPaletteProvider>{children}</CommandPaletteProvider>
      </body>
    </html>
  );
}
