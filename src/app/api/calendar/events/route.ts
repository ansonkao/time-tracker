import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get the access token from cookies
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get timeMin and timeMax from URL parameters
    const url = new URL(request.url);
    const timeMin = url.searchParams.get("timeMin") || new Date().toISOString();
    const timeMax = url.searchParams.get("timeMax");

    // Get all calendars first to fetch events from all of them
    const calendarsResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!calendarsResponse.ok) {
      if (calendarsResponse.status === 401) {
        return NextResponse.json({ error: "Token expired" }, { status: 401 });
      }
      return NextResponse.json(
        { error: "Failed to fetch calendars" },
        { status: calendarsResponse.status },
      );
    }

    const calendarsData = await calendarsResponse.json();
    const calendars = calendarsData.items || [];

    // Extract relevant calendar information to return to the client
    const calendarsList = calendars.map((calendar: any) => ({
      id: calendar.id,
      summary: calendar.summary,
      backgroundColor: calendar.backgroundColor,
      foregroundColor: calendar.foregroundColor,
      selected: calendar.selected,
      primary: calendar.primary || false,
      accessRole: calendar.accessRole,
    }));

    // Collect all events from all calendars
    let allEvents: any[] = [];

    // Function to fetch events with pagination
    const fetchEventsWithPagination = async (
      calendarId: string,
      pageToken = null,
    ) => {
      // Build the API URL with the provided parameters
      let apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=250&orderBy=startTime&singleEvents=true&timeMin=${timeMin}`;

      // Add timeMax if provided
      if (timeMax) {
        apiUrl += `&timeMax=${timeMax}`;
      }

      // Add page token if provided
      if (pageToken) {
        apiUrl += `&pageToken=${pageToken}`;
      }

      // Add timeZone parameter to ensure consistent time handling
      apiUrl += `&timeZone=UTC`;

      // Fetch calendar events from Google Calendar API
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events for calendar ${calendarId}`);
      }

      const data = await response.json();

      // Add calendar ID to each event for identification
      const eventsWithCalendarId = (data.items || []).map((event: any) => ({
        ...event,
        calendarId,
      }));

      // Add events to the collection
      allEvents = [...allEvents, ...eventsWithCalendarId];

      // If there's a next page token, fetch the next page
      if (data.nextPageToken) {
        await fetchEventsWithPagination(calendarId, data.nextPageToken);
      }
    };

    // Fetch events from all calendars
    await Promise.all(
      calendars.map((calendar: any) => fetchEventsWithPagination(calendar.id)),
    );

    return NextResponse.json({
      items: allEvents,
      calendars: calendarsList,
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
