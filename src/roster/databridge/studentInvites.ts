import { createStudentInvite } from "@/organizations/databridge/staffInvites";
import type { StudentSummary } from "./students";

export type StudentInviteBatchResult = {
  withEmail: number;
  sent: number;
  failed: number;
};

/** Email a student-account invite for each new profile that has an address. */
export async function inviteCreatedStudents(input: {
  organizationId: number;
  students: StudentSummary[];
  invitedBy: string;
}): Promise<StudentInviteBatchResult> {
  const targets = input.students.filter(
    (student): student is StudentSummary & { studentEmail: string } =>
      Boolean(student.studentEmail),
  );
  let sent = 0;
  let failed = 0;
  for (const student of targets) {
    try {
      const result = await createStudentInvite({
        organizationId: input.organizationId,
        studentProfileId: student.id,
        email: student.studentEmail,
        invitedBy: input.invitedBy,
      });
      if (result.email.sent) sent += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }
  return { withEmail: targets.length, sent, failed };
}
