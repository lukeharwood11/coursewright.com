import type { ComponentType, SVGProps } from "react";
import {
  AcademicCapIcon,
  BeakerIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  CalculatorIcon,
  ComputerDesktopIcon,
  GlobeAmericasIcon,
  HeartIcon,
  MapIcon,
  LightBulbIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  PencilSquareIcon,
  SparklesIcon,
  SunIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export const COURSE_ICON_OPTIONS = [
  { key: "academic-cap", label: "Academics" },
  { key: "book-open", label: "Reading" },
  { key: "beaker", label: "Science lab" },
  { key: "light-bulb", label: "Ideas" },
  { key: "calculator", label: "Math" },
  { key: "globe-americas", label: "Geography" },
  { key: "map", label: "Field trips" },
  { key: "sun", label: "Nature" },
  { key: "paint-brush", label: "Art" },
  { key: "musical-note", label: "Music" },
  { key: "pencil-square", label: "Writing" },
  { key: "computer-desktop", label: "Technology" },
  { key: "building-library", label: "History" },
  { key: "user-group", label: "Group learning" },
  { key: "heart", label: "Wellness" },
  { key: "sparkles", label: "Enrichment" },
] as const;

export type CourseIconKey = (typeof COURSE_ICON_OPTIONS)[number]["key"];

export type CourseIconValue = CourseIconKey | null;

const COURSE_ICON_KEYS = new Set<string>(COURSE_ICON_OPTIONS.map((option) => option.key));

const ICON_BY_KEY: Record<CourseIconKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  "academic-cap": AcademicCapIcon,
  "book-open": BookOpenIcon,
  beaker: BeakerIcon,
  "light-bulb": LightBulbIcon,
  calculator: CalculatorIcon,
  "globe-americas": GlobeAmericasIcon,
  map: MapIcon,
  sun: SunIcon,
  "paint-brush": PaintBrushIcon,
  "musical-note": MusicalNoteIcon,
  "pencil-square": PencilSquareIcon,
  "computer-desktop": ComputerDesktopIcon,
  "building-library": BuildingLibraryIcon,
  "user-group": UserGroupIcon,
  heart: HeartIcon,
  sparkles: SparklesIcon,
};

export function parseCourseIconKey(raw: string | null | undefined): CourseIconValue {
  if (!raw?.trim()) return null;
  const key = raw.trim();
  return COURSE_ICON_KEYS.has(key) ? (key as CourseIconKey) : null;
}

export function courseIconLabel(key: CourseIconValue): string | null {
  if (!key) return null;
  return COURSE_ICON_OPTIONS.find((option) => option.key === key)?.label ?? null;
}

export function getCourseIconComponent(
  key: CourseIconValue,
): ComponentType<SVGProps<SVGSVGElement>> | null {
  if (!key) return null;
  return ICON_BY_KEY[key];
}
