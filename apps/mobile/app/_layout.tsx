import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#09090b" },
        headerTintColor: "#fafafa",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: "#09090b" },
      }}
    />
  );
}
