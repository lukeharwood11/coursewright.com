import { getCourseIconComponent, type CourseIconValue } from "@/courses/model/courseIcon";

export function CourseIcon({
  iconKey,
  className = "h-6 w-6",
}: {
  iconKey: CourseIconValue;
  className?: string;
}) {
  const Icon = getCourseIconComponent(iconKey);
  if (!Icon) return null;
  return <Icon className={className} aria-hidden />;
}
