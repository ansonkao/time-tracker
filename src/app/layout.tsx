import type { Metadata } from "next";
import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from "@mantine/core";
import { GoogleOAuthProvider } from "@react-oauth/google";
import theme from "./theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Time Tracker",
  description: "Time Tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body className="antialiased">
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}
        >
          <MantineProvider theme={theme}>{children}</MantineProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
