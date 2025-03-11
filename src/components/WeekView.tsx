import { useState, useEffect } from "react";
import {
  Box,
  Title,
  Text,
  Group,
  Button,
  Paper,
  SimpleGrid,
  Stack,
  ScrollArea,
  Tooltip,
  Grid,
  Checkbox,
  Divider,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClock,
} from "@tabler/icons-react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";

// Define a type for calendar events
interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  colorId?: string;
  organizer?: {
    email: string;
  };
  calendarId?: string; // Added for multi-calendar support
}

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

// Define props for the WeekView component
interface WeekViewProps {
  events: CalendarEvent[];
  calendars: Calendar[];
  currentWeekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
}

// Color mapping for Google Calendar color IDs
const colorMap: Record<string, string> = {
  "1": "#7986cb", // Lavender
  "2": "#33b679", // Sage
  "3": "#8e24aa", // Grape
  "4": "#e67c73", // Flamingo
  "5": "#f6bf26", // Banana
  "6": "#f4511e", // Tangerine
  "7": "#039be5", // Peacock
  "8": "#616161", // Graphite
  "9": "#3f51b5", // Blueberry
  "10": "#0b8043", // Basil
  "11": "#d50000", // Tomato
  // Default color for events without a colorId
  default: "#4285f4", // Blue
};

export default function WeekView({
  events,
  calendars,
  currentWeekStart,
  onWeekChange,
}: WeekViewProps) {
  // State to track which calendars are visible
  const [visibleCalendars, setVisibleCalendars] = useState<
    Record<string, boolean>
  >(() => {
    // Initialize all calendars as visible
    const initialState: Record<string, boolean> = {};
    calendars.forEach((calendar) => {
      initialState[calendar.id] = true;
    });
    return initialState;
  });

  // Update visible calendars when the calendars prop changes
  useEffect(() => {
    const updatedVisibleCalendars: Record<string, boolean> = {
      ...visibleCalendars,
    };

    // Add any new calendars
    calendars.forEach((calendar) => {
      if (updatedVisibleCalendars[calendar.id] === undefined) {
        updatedVisibleCalendars[calendar.id] = true;
      }
    });

    setVisibleCalendars(updatedVisibleCalendars);
  }, [calendars]);

  // Log events when they change to help with debugging
  useEffect(() => {
    console.log(
      `Received ${events.length} events for week of ${format(currentWeekStart, "yyyy-MM-dd")}`,
    );
  }, [events, currentWeekStart]);

  const goToPreviousWeek = () => {
    onWeekChange(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    onWeekChange(addWeeks(currentWeekStart, 1));
  };

  // Generate the days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(currentWeekStart, i);
    return {
      date: day,
      dayName: format(day, "EEE"), // Mon, Tue, etc.
      dayNumber: format(day, "d"), // 1, 2, 3, etc.
    };
  });

  // Function to toggle calendar visibility
  const toggleCalendarVisibility = (calendarId: string) => {
    setVisibleCalendars((prev) => ({
      ...prev,
      [calendarId]: !prev[calendarId],
    }));
  };

  // Filter events based on visible calendars
  const filteredEvents = events.filter(
    (event) => event.calendarId && visibleCalendars[event.calendarId],
  );

  // Function to get events for a specific day
  const getEventsForDay = (date: Date) => {
    // Format the date to compare with event dates
    const dateStr = format(date, "yyyy-MM-dd");

    return filteredEvents.filter((event) => {
      try {
        // For all-day events
        if (event.start.date) {
          const startDate = event.start.date;
          const endDate = event.end?.date
            ? new Date(event.end.date)
            : new Date(startDate);

          // For multi-day all-day events, the end date is exclusive
          if (event.end?.date) {
            const end = new Date(event.end.date);
            end.setDate(end.getDate() - 1); // Make the end date inclusive
            const endDateStr = format(end, "yyyy-MM-dd");

            // Check if the current date is within the range
            return dateStr >= startDate && dateStr <= endDateStr;
          }

          // For single day all-day events
          return dateStr === startDate;
        }

        // For timed events
        if (event.start.dateTime) {
          const eventDate = parseISO(event.start.dateTime);
          return format(eventDate, "yyyy-MM-dd") === dateStr;
        }

        return false;
      } catch (error) {
        console.error("Error processing event:", error, event);
        return false;
      }
    });
  };

  // Function to sort events by start time
  const sortEventsByTime = (events: CalendarEvent[]) => {
    return [...events].sort((a, b) => {
      const aStart = a.start.dateTime
        ? parseISO(a.start.dateTime)
        : parseISO(a.start.date || "");
      const bStart = b.start.dateTime
        ? parseISO(b.start.dateTime)
        : parseISO(b.start.date || "");
      return aStart.getTime() - bStart.getTime();
    });
  };

  // Function to format event time
  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.date) {
      return "All day";
    }

    if (event.start.dateTime) {
      return format(parseISO(event.start.dateTime), "h:mm a");
    }

    return "";
  };

  // Function to get event color based on calendar
  const getEventColor = (event: CalendarEvent) => {
    // First try to use the event's colorId
    if (event.colorId && colorMap[event.colorId]) {
      return colorMap[event.colorId];
    }

    // If no colorId or not found in colorMap, use the calendar's backgroundColor
    if (event.calendarId) {
      const calendar = calendars.find((cal) => cal.id === event.calendarId);
      if (calendar && calendar.backgroundColor) {
        return calendar.backgroundColor;
      }
    }

    // Default color if nothing else works
    return colorMap["default"];
  };

  return (
    <Box>
      <Group mb="md" gap="xl">
        <Title order={3}>
          Week of {format(currentWeekStart, "MMMM do, yyyy")}
        </Title>
        <Group gap={0}>
          <Button
            variant="subtle"
            onClick={goToPreviousWeek}
            leftSection={<IconChevronLeft size={16} />}
          >
            Previous
          </Button>
          <Button
            variant="subtle"
            onClick={goToNextWeek}
            rightSection={<IconChevronRight size={16} />}
          >
            Next
          </Button>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={10}>
          <SimpleGrid cols={7}>
            {weekDays.map((day) => {
              const dayEvents = sortEventsByTime(getEventsForDay(day.date));

              return (
                <Paper
                  shadow="xs"
                  p="xs"
                  withBorder
                  key={day.dayName}
                  className="min-h-[300px]"
                >
                  <Box className="text-center mb-0.5">
                    <Text>
                      {day.dayName}, {day.dayNumber}
                    </Text>
                  </Box>

                  <Stack gap={4}>
                    {dayEvents.length === 0 ? (
                      <Text size="sm" c="dimmed" ta="center" mt="md">
                        No events
                      </Text>
                    ) : (
                      dayEvents.map((event) => (
                        <Tooltip
                          key={`${event.calendarId}-${event.id}`}
                          label={`${event.summary} - ${formatEventTime(event)}`}
                          position="right"
                          withArrow
                        >
                          <Box
                            p="6px"
                            style={{
                              backgroundColor: getEventColor(event),
                              borderRadius: "4px",
                              color: "white",
                            }}
                          >
                            <Stack gap={4}>
                              <Text size="12px" lineClamp={2} fw={600} lh={1.2}>
                                {event.summary}
                              </Text>
                              <Group gap={4} wrap="nowrap" opacity={0.64}>
                                <Text size="10px" fw={500}>
                                  {formatEventTime(event)}
                                </Text>
                              </Group>
                            </Stack>
                          </Box>
                        </Tooltip>
                      ))
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Grid.Col>
        <Grid.Col span={2}>
          <Paper shadow="xs" p="md" withBorder>
            <Title order={5} mb="sm">
              Calendars
            </Title>
            <Divider mb="sm" />
            <Stack gap="xs">
              {calendars.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center">
                  No calendars found
                </Text>
              ) : (
                calendars.map((calendar) => (
                  <Group key={calendar.id} gap="xs" wrap="nowrap">
                    <Checkbox
                      checked={visibleCalendars[calendar.id] || false}
                      onChange={() => toggleCalendarVisibility(calendar.id)}
                      styles={{
                        input: {
                          backgroundColor: calendar.backgroundColor,
                          borderColor: calendar.backgroundColor,
                        },
                      }}
                    />
                    <Text size="sm" lineClamp={1}>
                      {calendar.summary}
                    </Text>
                  </Group>
                ))
              )}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
