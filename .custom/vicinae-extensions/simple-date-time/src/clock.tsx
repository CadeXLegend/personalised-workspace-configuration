import { showToast, Toast } from "@vicinae/api";
import { setTimeout } from "timers/promises";

export default async function Clock() {
  const now = new Date();
  const displayMessage = `${now.toLocaleTimeString()} ${now.toDateString()}`;

  await showToast({
    title: "Current Time",
    message: displayMessage,
  });
}
