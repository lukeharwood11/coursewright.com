import {
  browserTimeZone,
  dueInstantIso,
  wallTimeInZone,
} from "@/submissions/model/dueInstant";

export type WindowFields = {
  fromDate: string;
  fromTime: string;
  untilDate: string;
  untilTime: string;
};

export function emptyWindowFields(): WindowFields {
  return { fromDate: "", fromTime: "", untilDate: "", untilTime: "" };
}

export function wallDateInZone(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export function windowFieldsFromInstants(
  acceptsFrom: string | null,
  acceptsUntil: string | null,
  timeZone: string,
): WindowFields {
  return {
    fromDate: acceptsFrom ? wallDateInZone(acceptsFrom, timeZone) : "",
    fromTime: acceptsFrom ? wallTimeInZone(acceptsFrom, timeZone) : "",
    untilDate: acceptsUntil ? wallDateInZone(acceptsUntil, timeZone) : "",
    untilTime: acceptsUntil ? wallTimeInZone(acceptsUntil, timeZone) : "",
  };
}

export function instantsFromWindowFields(
  fields: WindowFields,
  timeZone: string,
): { acceptsFrom: string | null; acceptsUntil: string | null } {
  const fromTime = fields.fromTime || "00:00";
  const untilTime = fields.untilTime || "23:59";
  return {
    acceptsFrom: fields.fromDate
      ? dueInstantIso(fields.fromDate, fromTime, timeZone)
      : null,
    acceptsUntil: fields.untilDate
      ? dueInstantIso(fields.untilDate, untilTime, timeZone)
      : null,
  };
}

export function viewerTimeZone(saved: string | null): string {
  return saved || browserTimeZone();
}
