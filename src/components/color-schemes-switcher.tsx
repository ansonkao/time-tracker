"use client";

import { useMantineColorScheme, Button, Group } from "@mantine/core";

export function ColorSchemesSwitcher() {
  const { setColorScheme, clearColorScheme } = useMantineColorScheme();

  return (
    <Group>
      <Button
        className="bg-brand-200 text-white"
        onClick={() => setColorScheme("light")}
      >
        Light
      </Button>
      <Button
        className="bg-red-500 text-white"
        onClick={() => setColorScheme("dark")}
      >
        Dark
      </Button>
      <Button
        className="bg-red-500 text-white"
        onClick={() => setColorScheme("auto")}
      >
        Auto
      </Button>
      <Button onClick={clearColorScheme}>Clear</Button>
    </Group>
  );
}
