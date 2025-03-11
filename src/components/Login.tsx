"use client";

import { Button } from "@mantine/core";
import { useGoogleLogin } from "@react-oauth/google";
import { IconBrandGoogleFilled } from "@tabler/icons-react";

export default function Login() {
  const login = useGoogleLogin({
    flow: "auth-code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    ux_mode: "redirect",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    onError: (errorResponse) => {
      console.error("Google login error:", errorResponse);
    },
  });

  return (
    <Button
      onClick={() => login()}
      size="lg"
      leftSection={<IconBrandGoogleFilled />}
    >
      Login to Google Calendar
    </Button>
  );
}
