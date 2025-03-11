import Login from "@/components/Login";
import { AppShell, AppShellMain, Box, Text, Title } from "@mantine/core";
import Image from "next/image";

export default function Home() {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShellMain>
        <Title className="text-center mt-10 text-8xl">
          <Text
            inherit
            variant="gradient"
            component="span"
            gradient={{ from: "blue", to: "green" }}
          >
            Time Tracker
          </Text>
        </Title>
        <Text
          className="text-center text-gray-700 dark:text-gray-300 max-w-[500px] mx-auto mt-xl"
          ta="center"
          size="lg"
          maw={580}
          mx="auto"
          mt="xl"
        >
          Connect to your Google Calendar to audit your weekly time spent!
        </Text>
        <Box className="flex justify-center mt-2">
          <Login />
        </Box>
      </AppShellMain>
    </AppShell>
  );
}
