import { Platform } from "react-native";

let Notifications: any = null;

try {
  Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // expo-notifications not available
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Reminders",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch {
    // Push notifications not supported in this environment
    return null;
  }
}

export async function scheduleReminder(
  title: string,
  date: Date,
  itemId: string
): Promise<string> {
  if (!Notifications) return "";

  const trigger = date.getTime() - Date.now();

  if (trigger <= 0) {
    return "";
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "brAIndump Reminder",
        body: title,
        data: { itemId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.floor(trigger / 1000),
      },
    });

    return id;
  } catch {
    return "";
  }
}

export async function cancelReminder(notificationId: string): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore
  }
}
