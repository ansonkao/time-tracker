import { NextResponse } from "next/server";

export async function POST() {
  // Create a response that redirects to the home page
  const response = NextResponse.json({ success: true });

  // Clear the authentication cookies
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");

  return response;
}
