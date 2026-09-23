import { createContext, useContext, type ReactNode } from "react";
import { Button } from "@/ui/Button";
import { pushSettingMode, shouldShowPushPrompt } from "@/notifications/model/push";
import { useActivityPush, usePushNavigation } from "./hooks/useActivityPush";

const ActivityPushContext = createContext<ReturnType<typeof useActivityPush> | null>(null);

export function ActivityPushProvider({ children }: { children: ReactNode }) {
  usePushNavigation();
  const push = useActivityPush();
  return <ActivityPushContext.Provider value={push}>{children}</ActivityPushContext.Provider>;
}

function useActivityPushContext() {
  const push = useContext(ActivityPushContext);
  if (!push) {
    throw new Error("Activity push controls must sit inside the signed-in shell.");
  }
  return push;
}

export function ActivityPushChrome({ showPrompt }: { showPrompt: boolean }) {
  const push = useActivityPushContext();
  if (
    !showPrompt ||
    !shouldShowPushPrompt({
      installed: push.installed,
      serviceWorkerReady: push.serviceWorkerReady,
      publicKeyReady: push.publicKeyReady,
      permission: push.permission,
      dismissed: push.dismissed,
    })
  ) {
    return null;
  }

  const blocked = push.permission === "denied";

  return (
    <div className="cw-org-chrome shrink-0 border-b border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-[var(--ink)]">
            {blocked ? "Notifications are blocked" : "Turn on notifications"}
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--ink-soft)]">
            {blocked
              ? "Allow notifications for Course Wright in this device’s settings, then come back."
              : "Get a notification on this device when there’s new activity."}
          </p>
          {push.error ? (
            <p className="mt-1 text-[13px] text-[var(--amber-deep)]" role="alert">
              {push.error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {blocked ? null : (
            <Button onClick={() => void push.turnOn()} disabled={push.busy}>
              {push.busy ? "Turning on…" : "Turn on notifications"}
            </Button>
          )}
          <Button variant="secondary" onClick={push.dismiss} disabled={push.busy}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PushNotificationSetting() {
  const push = useActivityPushContext();
  const mode = pushSettingMode({
    installed: push.installed,
    serviceWorkerReady: push.serviceWorkerReady,
    publicKeyReady: push.publicKeyReady,
    permission: push.permission,
    subscribed: push.subscribed,
    disabledOnDevice: push.disabledOnDevice,
    checked: push.checked,
  });

  if (mode === "hidden") return null;

  return (
    <section className="mt-8 border-t border-[var(--line-soft)] pt-6">
      <h2
        className="text-[18px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Notifications
      </h2>
      {mode === "install" ? (
        <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
          Install Course Wright on your home screen to get notifications when there’s new
          activity.
        </p>
      ) : null}
      {mode === "blocked" ? (
        <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
          Notifications are blocked in this device’s settings. Allow them for Course Wright,
          then come back here.
        </p>
      ) : null}
      {mode === "on" ? (
        <>
          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
            This device gets a notification when there’s new activity.
          </p>
          <div className="mt-3">
            <Button variant="secondary" onClick={() => void push.turnOff()} disabled={push.busy}>
              {push.busy ? "Turning off…" : "Turn off notifications"}
            </Button>
          </div>
        </>
      ) : null}
      {mode === "turn-on" ? (
        <>
          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
            Get a notification on this device when there’s new activity.
          </p>
          <div className="mt-3">
            <Button onClick={() => void push.turnOn()} disabled={push.busy}>
              {push.busy ? "Turning on…" : "Turn on notifications"}
            </Button>
          </div>
        </>
      ) : null}
      {push.error ? (
        <p className="mt-2 text-[13px] text-[var(--amber-deep)]" role="alert">
          {push.error}
        </p>
      ) : null}
    </section>
  );
}
