export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export const PUSH_PROMPT_DISMISSED_KEY = "cw-activity-push-dismissed";
export const PUSH_DEVICE_DISABLED_KEY = "cw-activity-push-disabled";

export type PushSettingMode = "install" | "turn-on" | "on" | "blocked" | "hidden";

/** Installed PWA: standalone window, fullscreen, or iOS home-screen `navigator.standalone`. */
export function isInstalledPwa(env: {
  standalone?: boolean;
  displayMode?: string | null;
}): boolean {
  if (env.standalone) return true;
  return env.displayMode === "standalone" || env.displayMode === "fullscreen";
}

export function shouldSyncPushSubscription(args: {
  installed: boolean;
  permission: PushPermission;
  disabledOnDevice: boolean;
}): boolean {
  return args.installed && args.permission === "granted" && !args.disabledOnDevice;
}

export function shouldShowPushPrompt(args: {
  installed: boolean;
  serviceWorkerReady: boolean;
  publicKeyReady: boolean;
  permission: PushPermission;
  dismissed: boolean;
}): boolean {
  if (!args.installed || args.dismissed) return false;
  if (args.permission === "denied") return true;
  return (
    args.permission === "default" &&
    args.serviceWorkerReady &&
    args.publicKeyReady
  );
}

export function pushSettingMode(args: {
  installed: boolean;
  serviceWorkerReady: boolean;
  publicKeyReady: boolean;
  permission: PushPermission;
  subscribed: boolean;
  disabledOnDevice: boolean;
  checked: boolean;
}): PushSettingMode {
  if (!args.installed) return "install";
  if (args.permission === "denied") return "blocked";
  if (!args.checked || !args.serviceWorkerReady || !args.publicKeyReady) return "hidden";
  if (args.permission === "unsupported") return "hidden";
  if (
    args.permission === "granted" &&
    args.subscribed &&
    !args.disabledOnDevice
  ) {
    return "on";
  }
  return "turn-on";
}
