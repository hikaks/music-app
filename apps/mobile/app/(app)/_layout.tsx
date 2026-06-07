import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Home, Library, ListMusic, Search, Settings } from "lucide-react-native";
import { useAuth } from "@/auth/auth-context";
import { MiniPlayer } from "@/ui/music";
import { colors, spacing, typography } from "@/theme/tokens";

const tabIcons: Record<string, LucideIcon> = {
  index: Home,
  search: Search,
  library: Library,
  playlists: ListMusic,
  settings: Settings,
};

type TabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
};

function TabBarWithPlayer({ state, descriptors, navigation }: TabBarProps) {
  return (
    <View style={styles.tabShell}>
      <MiniPlayer />
      <View style={styles.tabBar}>
        {state.routes.map((route: { key: string; name: string; params?: object }, index: number) => {
          const options = descriptors[route.key]?.options;
          const label =
            typeof options?.tabBarLabel === "string" ? options.tabBarLabel : options?.title ?? route.name;
          const isFocused = state.index === index;
          const Icon = tabIcons[route.name] ?? Home;
          const color = isFocused ? colors.accent : colors.muted;

          function handlePress() {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : undefined}
              onPress={handlePress}
              style={styles.tabItem}
            >
              <Icon color={color} size={22} strokeWidth={2.4} />
              <Text style={[styles.tabLabel, isFocused ? styles.tabLabelActive : null]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AppLayout() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      tabBar={(props) => <TabBarWithPlayer {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => <Library color={color} size={size} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: "Playlists",
          tabBarIcon: ({ color, size }) => <ListMusic color={color} size={size} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} strokeWidth={2.4} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  tabShell: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  tabBar: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  tabLabelActive: {
    color: colors.accent,
  },
});
