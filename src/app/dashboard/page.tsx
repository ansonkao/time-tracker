"use client";

import { useEffect, useState } from "react";
import {
  AppShell,
  AppShellMain,
  Box,
  Button,
  Loader,
  Text,
  Title,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";
import WeekView from "@/components/WeekView";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  startOfDay,
  endOfDay,
} from "date-fns";

// Define a type for calendar information
interface Calendar {
  id: string;
  summary: string;
  backgroundColor: string;
  foregroundColor: string;
  selected: boolean;
  primary: boolean;
  accessRole: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Get the start of the current week (Monday)
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  useEffect(() => {
    console.log("currentWeekStart", currentWeekStart);
    // Fetch calendar events for the current week
    fetchEventsForWeek(currentWeekStart);
  }, [currentWeekStart, router]);

  // Fetch calendar events using the access token from cookies
  const fetchEventsForWeek = async (weekStart: Date) => {
    setLoading(true);
    setDebugInfo(null);
    try {
      // Format dates for API request in UTC
      const timeMin = format(startOfDay(weekStart), "yyyy-MM-dd'T'00:00:00'Z'");

      // Calculate the end of the week (Sunday)
      const weekEnd = addDays(weekStart, 6);
      const timeMax = format(endOfDay(weekEnd), "yyyy-MM-dd'T'23:59:59'Z'");

      setDebugInfo(`Fetching events from ${timeMin} to ${timeMax}`);

      // Fetch events for the specified time range
      const response = await fetch(
        `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized, redirect to login
          router.push("/");
          return;
        }
        throw new Error(
          `Failed to fetch events: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      setEvents(data.items || []);
      setCalendars(data.calendars || []);
      setDebugInfo(
        `Received ${data.items?.length || 0} events from ${data.calendars?.length || 0} calendars for week of ${format(weekStart, "yyyy-MM-dd")}`,
      );
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError(`Failed to load calendar events: ${err.message}`);
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Handle week navigation
  const handleWeekChange = (newWeekStart: Date) => {
    setCurrentWeekStart(newWeekStart);
  };

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShellMain className="pt-1">
        <Box className="flex justify-between items-center mb-1">
          <Title>
            <Text
              inherit
              variant="gradient"
              component="span"
              gradient={{ from: "blue", to: "green" }}
            >
              Your Calendar
            </Text>
          </Title>
          <Button
            onClick={handleLogout}
            variant="light"
            leftSection={<IconLogout size={16} />}
          >
            Logout
          </Button>
        </Box>

        {loading ? (
          <Box className="flex justify-center items-center h-64">
            <Loader size="lg" />
            {debugInfo && (
              <Text size="sm" c="dimmed" mt="md">
                {debugInfo}
              </Text>
            )}
          </Box>
        ) : error ? (
          <Box>
            <Text color="red" className="text-center">
              {error}
            </Text>
            {debugInfo && (
              <Text size="sm" c="dimmed" mt="md" className="text-center">
                {debugInfo}
              </Text>
            )}
            <Button
              mt="md"
              variant="light"
              onClick={() => fetchEventsForWeek(currentWeekStart)}
              className="mx-auto block"
            >
              Retry
            </Button>
          </Box>
        ) : (
          <Box>
            <WeekView
              events={events}
              calendars={calendars}
              currentWeekStart={currentWeekStart}
              onWeekChange={handleWeekChange}
            />
            {debugInfo && (
              <Text size="xs" c="dimmed" mt="xs" ta="center">
                {debugInfo}
              </Text>
            )}
            {events.length === 0 && (
              <Text className="text-center mt-4">
                No events found for this week
              </Text>
            )}
          </Box>
        )}
      </AppShellMain>
    </AppShell>
  );
}
