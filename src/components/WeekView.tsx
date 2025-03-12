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
  Grid,
  Checkbox,
  TextInput,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconGripVertical,
  IconEdit,
  IconFilter,
} from "@tabler/icons-react";
import { format, addDays, addWeeks, subWeeks } from "date-fns";
import { useCategories } from "./useCategories";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { formatInTimeZone } from "date-fns-tz";

// Define a type for calendar events
interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  organizer?: {
    email: string;
  };
  calendarId?: string;
  selected?: boolean;
  categoryId?: string; // Single category ID instead of array
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
  timeZone: string;
}

// Define props for the WeekView component
interface WeekViewProps {
  events: CalendarEvent[];
  calendars: Calendar[];
  currentWeekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
}

export default function WeekView({
  events,
  calendars,
  currentWeekStart,
  onWeekChange,
}: WeekViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingName, setEditingName] = useState("");
  const {
    categories,
    isLoading: categoriesLoading,
    addCategory,
    updateCategories,
    updateCategory,
  } = useCategories();

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
    const updatedVisibleCalendars: { [key: string]: boolean } = {
      ...visibleCalendars,
    };
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

  // Function to toggle event selection
  const toggleEventSelection = (eventId: string) => {
    console.log("toggleEventSelection", eventId);
    console.log(
      "categorizedEvents",
      events.filter((event) => event.categoryId),
    );
    console.log("filteredEvents", filteredEvents);
    console.log(
      "selectedFilteredEvents",
      filteredEvents.filter(
        (event) => event.calendarId && visibleCalendars[event.calendarId],
      ),
    );

    setSelectedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Filter events based on visible calendars
  const filteredEvents = events.filter(
    (event) =>
      event.calendarId &&
      visibleCalendars[event.calendarId] &&
      (!searchQuery ||
        event.summary.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Function to get events for a specific day
  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    return filteredEvents.filter((event) => {
      try {
        // For all-day events - no timezone conversion needed
        if (event.start.date) {
          const startDate = event.start.date;
          if (event.end?.date) {
            const end = new Date(event.end.date);
            end.setDate(end.getDate() - 1);
            const endDateStr = format(end, "yyyy-MM-dd");
            return dateStr >= startDate && dateStr <= endDateStr;
          }
          return dateStr === startDate;
        }

        // For timed events - handle timezone
        if (event.start.dateTime) {
          const calendar = calendars.find((cal) => cal.id === event.calendarId);
          const timeZone = event.start.timeZone || calendar?.timeZone || "UTC";

          // Convert event time to calendar's timezone for comparison
          const eventDate = formatInTimeZone(
            new Date(event.start.dateTime),
            timeZone,
            "yyyy-MM-dd",
          );
          return eventDate === dateStr;
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
        ? new Date(a.start.dateTime)
        : new Date(a.start.date || "");
      const bStart = b.start.dateTime
        ? new Date(b.start.dateTime)
        : new Date(b.start.date || "");

      return aStart.getTime() - bStart.getTime();
    });
  };

  // Function to format event time
  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.date) {
      return "All day";
    }

    if (event.start.dateTime) {
      const calendar = calendars.find((cal) => cal.id === event.calendarId);
      const timeZone = event.start.timeZone || calendar?.timeZone || "UTC";

      return formatInTimeZone(
        new Date(event.start.dateTime),
        timeZone,
        "h:mm a",
      );
    }

    return "";
  };

  // Function to get event color based on calendar
  const getEventColor = (event: CalendarEvent) => {
    // Use the calendar's backgroundColor directly
    if (event.calendarId) {
      const calendar = calendars.find((cal) => cal.id === event.calendarId);
      if (calendar && calendar.backgroundColor) {
        return calendar.backgroundColor;
      }
    }

    // Default color if nothing else works
    return "#4285f4"; // Blue
  };

  const getEventTextColor = (event: CalendarEvent) => {
    // If the event has a calendarId, use the calendar's foregroundColor
    if (event.calendarId) {
      const calendar = calendars.find((cal) => cal.id === event.calendarId);
      if (calendar && calendar.foregroundColor) {
        return calendar.foregroundColor;
      }
    }

    // Default to white if no foregroundColor is available
    return "#FFFFFF";
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      setNewCategoryName("");
    }
  };

  // Add this handler for drag end events
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedCategories = Array.from(categories);
    const [removed] = reorderedCategories.splice(result.source.index, 1);
    reorderedCategories.splice(result.destination.index, 0, removed);

    // Save the new order using the useCategories hook
    updateCategories(reorderedCategories);
  };

  // Add this function to handle category assignment
  const assignEventsToCategory = (categoryId: string) => {
    events.forEach((event) => {
      if (
        selectedEvents.has(event.id) &&
        calendars.find((cal) => cal.id === event.calendarId)?.selected
      ) {
        event.categoryId = categoryId;
      }
    });

    // Clear selections after assigning
    setSelectedEvents(new Set());
  };

  const selectedFilteredEvents = filteredEvents.filter(
    (event) =>
      selectedEvents.has(event.id) &&
      calendars.find((cal) => cal.id === event.calendarId)?.selected,
  );

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
        <Grid.Col span={8}>
          <Paper shadow="xs" p="xs" withBorder>
            <SimpleGrid cols={7} spacing={4}>
              {weekDays.map((day) => {
                const dayEvents = sortEventsByTime(getEventsForDay(day.date));

                return (
                  <Box key={day.dayName}>
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
                          <Box
                            key={`${event.calendarId}-${event.id}`}
                            p="6px"
                            onClick={() => toggleEventSelection(event.id)}
                            style={{
                              backgroundColor: getEventColor(event),
                              borderRadius: "4px",
                              color: getEventTextColor(event),
                              cursor: "pointer",
                              outline: selectedEvents.has(event.id)
                                ? "2px solid red"
                                : "none",
                              outlineOffset: "1px",
                              opacity: event.categoryId ? 0.5 : 1,
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
                        ))
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Paper>
        </Grid.Col>
        <Grid.Col span={4}>
          <Stack>
            <Paper shadow="xs" p="md" withBorder>
              <Title order={5} mb="sm">
                Calendars
              </Title>
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
            <Paper shadow="xs" p="md" withBorder>
              <Stack gap="lg">
                <Title order={5}>Categorize Events</Title>
                <Stack gap="xs">
                  <TextInput
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  />
                  <Grid gutter="xs">
                    <Grid.Col span={8}>
                      <Button
                        variant="light"
                        fullWidth
                        onClick={() => {
                          setSelectedEvents(
                            new Set(
                              filteredEvents
                                .filter(
                                  (event) =>
                                    event.calendarId &&
                                    visibleCalendars[event.calendarId],
                                )
                                .map((event) => event.id),
                            ),
                          );
                        }}
                      >
                        Select all visible events
                      </Button>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Button
                        variant="light"
                        fullWidth
                        onClick={() => {
                          setSelectedEvents(new Set());
                          setSearchQuery("");
                        }}
                      >
                        Clear
                      </Button>
                    </Grid.Col>
                  </Grid>
                  <Text
                    size="lg"
                    c={selectedEvents.size > 0 ? "dark" : "dimmed"}
                    ta="center"
                  >
                    {selectedEvents.size} events selected
                  </Text>
                  {categoriesLoading ? (
                    <Text size="sm" c="dimmed" ta="center">
                      Loading categories...
                    </Text>
                  ) : categories.length > 0 ? (
                    <Stack gap={0}>
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="categories">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                            >
                              {categories.map((category, index) => (
                                <Draggable
                                  key={category.id}
                                  draggableId={category.id}
                                  index={index}
                                >
                                  {(provided) => (
                                    <Grid
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      align="center"
                                      gutter="xs"
                                    >
                                      <Grid.Col span={1}>
                                        <div {...provided.dragHandleProps}>
                                          <IconGripVertical
                                            size={16}
                                            style={{ cursor: "grab" }}
                                          />
                                        </div>
                                      </Grid.Col>
                                      <Grid.Col span={5}>
                                        <Group gap={4}>
                                          {category.id === editingCategoryId ? (
                                            <TextInput
                                              size="xs"
                                              value={editingName}
                                              onChange={(e) =>
                                                setEditingName(
                                                  e.currentTarget.value,
                                                )
                                              }
                                              onKeyPress={(e) => {
                                                if (e.key === "Enter") {
                                                  updateCategory(category.id, {
                                                    name: editingName,
                                                  });
                                                  setEditingCategoryId(null);
                                                }
                                              }}
                                              onBlur={() => {
                                                updateCategory(category.id, {
                                                  name: editingName,
                                                });
                                                setEditingCategoryId(null);
                                              }}
                                              autoFocus
                                            />
                                          ) : (
                                            <>
                                              <Text size="sm">
                                                {category.name}
                                              </Text>
                                              <IconEdit
                                                size={14}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => {
                                                  setEditingCategoryId(
                                                    category.id,
                                                  );
                                                  setEditingName(category.name);
                                                }}
                                              />
                                            </>
                                          )}
                                        </Group>
                                      </Grid.Col>
                                      <Grid.Col span={4}>
                                        <Group gap={4} justify="flex-end">
                                          <Text size="xs" c="dimmed">
                                            {events.filter(
                                              (event) =>
                                                event.categoryId ===
                                                  category.id &&
                                                visibleCalendars[
                                                  event.calendarId!
                                                ],
                                            ).length || "0"}{" "}
                                            events
                                          </Text>
                                          <IconFilter
                                            size={14}
                                            style={{ cursor: "pointer" }}
                                            onClick={() => {
                                              const categoryEvents =
                                                events.filter(
                                                  (event) =>
                                                    event.categoryId ===
                                                    category.id,
                                                );
                                              const newSelection = new Set(
                                                categoryEvents.map(
                                                  (event) => event.id,
                                                ),
                                              );
                                              setSelectedEvents(newSelection);
                                            }}
                                          />
                                          <Text size="sm" w={45} ta="right">
                                            {events
                                              .filter(
                                                (event) =>
                                                  event.categoryId ===
                                                    category.id &&
                                                  visibleCalendars[
                                                    event.calendarId!
                                                  ],
                                              )
                                              .reduce((total, event) => {
                                                if (
                                                  event.start.dateTime &&
                                                  event.end.dateTime
                                                ) {
                                                  const start = new Date(
                                                    event.start.dateTime,
                                                  );
                                                  const end = new Date(
                                                    event.end.dateTime,
                                                  );
                                                  const durationHrs =
                                                    (end.getTime() -
                                                      start.getTime()) /
                                                    (1000 * 60 * 60);
                                                  return total + durationHrs;
                                                }
                                                return total;
                                              }, 0)
                                              .toFixed(1)}{" "}
                                            h
                                          </Text>
                                        </Group>
                                      </Grid.Col>
                                      <Grid.Col span={2}>
                                        <Button
                                          fullWidth
                                          size="compact-sm"
                                          onClick={() => {
                                            assignEventsToCategory(category.id);
                                            setSearchQuery("");
                                          }}
                                          disabled={
                                            selectedFilteredEvents.length === 0
                                          }
                                        >
                                          +{" "}
                                          {selectedFilteredEvents.length || ""}
                                        </Button>
                                      </Grid.Col>
                                    </Grid>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </Stack>
                  ) : (
                    <Text size="sm" c="dimmed" ta="center">
                      No categories found
                    </Text>
                  )}
                  <Grid gutter="xs">
                    <Grid.Col span={8}>
                      <TextInput
                        placeholder="New category name..."
                        size="sm"
                        value={newCategoryName}
                        onChange={(e) =>
                          setNewCategoryName(e.currentTarget.value)
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddCategory();
                          }
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Button
                        fullWidth
                        size="sm"
                        onClick={handleAddCategory}
                        disabled={!newCategoryName.trim()}
                      >
                        Create
                      </Button>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
