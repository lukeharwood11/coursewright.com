import { Link } from "react-router-dom";
import { classAttendancePath } from "@/attendance/model/paths";
import { segmentButtonClass, TabList } from "@/ui/Tabs";

export function ClassSectionTabs({
  orgSlug,
  classId,
  selected,
}: {
  orgSlug: string;
  classId: number;
  selected: "students" | "attendance";
}) {
  const studentsTo = `/my/${orgSlug}/classes/${classId}`;
  const attendanceTo = classAttendancePath(orgSlug, classId);

  return (
    <TabList label="Class sections">
      <Link
        to={studentsTo}
        role="tab"
        aria-selected={selected === "students"}
        className={segmentButtonClass(selected === "students")}
      >
        Students
      </Link>
      <Link
        to={attendanceTo}
        role="tab"
        aria-selected={selected === "attendance"}
        className={segmentButtonClass(selected === "attendance")}
      >
        Attendance
      </Link>
    </TabList>
  );
}
