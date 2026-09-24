import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { caughtErrorMessage, toastCaughtError } from "@/ui/toast";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import { getOrganization } from "@/organizations/databridge/organizations";
import {
  listOrgPendingStudentInvites,
  sendOrganizationInviteEmail,
  staffInviteQueryKeys,
} from "@/organizations/databridge/staffInvites";
import {
  classQueryKeys,
  listClassesForStudent,
} from "@/roster/databridge/classes";
import {
  enrollmentQueryKeys,
  listStudentEnrollments,
} from "@/roster/databridge/enrollments";
import {
  deleteStudent,
  getStudent,
  studentQueryKeys,
  updateStudent,
} from "@/roster/databridge/students";
import {
  studentProfileHaveChanges,
  validateStudentProfile,
} from "@/roster/model/studentProfile";

export const STUDENT_PROFILE_FORM_ID = "student-profile-form";

export function useStudentProfile() {
  const { studentId: studentIdParam } = useParams();
  const studentId = studentIdParam ? Number(studentIdParam) : NaN;
  const { organization } = useOrgShell();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: studentQueryKeys.detail(studentId),
    queryFn: () => getStudent(studentId),
    enabled: Number.isFinite(studentId),
  });

  const student = query.data ?? null;
  const belongsHere = student?.organizationId === organization.id;

  const organizationQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });

  const enrollmentsQuery = useQuery({
    queryKey: enrollmentQueryKeys.byStudent(studentId),
    queryFn: () => listStudentEnrollments(studentId),
    enabled: Number.isFinite(studentId) && belongsHere,
  });

  const classesQuery = useQuery({
    queryKey: classQueryKeys.forStudent(studentId),
    queryFn: () => listClassesForStudent(studentId),
    enabled: Number.isFinite(studentId) && belongsHere,
  });

  const [name, setName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    if (!student || !belongsHere) return;
    setName(student.name);
    setStudentEmail(student.studentEmail ?? "");
    setGradeLevel(student.gradeLevel ?? "");
    setFormError(null);
  }, [student, belongsHere]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!student) throw new Error("Student isn’t loaded yet.");
      const parsed = validateStudentProfile({
        name,
        parentEmail: student.parentEmail ?? "",
        studentEmail,
        gradeLevel,
        gradeLabels: organizationQuery.data?.gradeLabels ?? [],
      });
      if (!parsed.ok) throw new Error(parsed.error);
      const emailChanged = parsed.value.studentEmail !== student.studentEmail;
      const hadLinkedAccount = Boolean(student.userId);
      const saved = await updateStudent(student.id, parsed.value);

      if (!emailChanged || !saved.studentEmail) {
        return {
          saved,
          emailChanged,
          hadLinkedAccount,
          replacementInvite: null,
          inviteEmailSent: null,
        };
      }

      const pending = await listOrgPendingStudentInvites(organization.id);
      const replacementInvite =
        pending.find(
          (invite) =>
            invite.email === saved.studentEmail &&
            invite.studentProfileIds.includes(saved.id),
        ) ?? null;
      const inviteEmail = replacementInvite
        ? await sendOrganizationInviteEmail(replacementInvite.id)
        : null;

      return {
        saved,
        emailChanged,
        hadLinkedAccount,
        replacementInvite,
        inviteEmailSent: inviteEmail?.sent ?? null,
      };
    },
    onSuccess: async (result) => {
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: studentQueryKeys.detail(result.saved.id),
        }),
        queryClient.invalidateQueries({
          queryKey: studentQueryKeys.list(organization.id),
        }),
        queryClient.invalidateQueries({
          queryKey: staffInviteQueryKeys.students(organization.id),
        }),
        queryClient.invalidateQueries({
          queryKey: staffInviteQueryKeys.staff(organization.id),
        }),
        queryClient.invalidateQueries({
          queryKey: ["student-account", result.saved.id],
        }),
      ]);

      if (result.replacementInvite) {
        toast(
          result.inviteEmailSent
            ? `Student saved. New invite sent to ${result.replacementInvite.email}.`
            : "Student saved and the old invite was canceled, but the new invite email didn’t send.",
        );
      } else if (result.emailChanged && result.hadLinkedAccount) {
        toast("Student saved. The previous account is no longer linked to this student.");
      } else {
        toast("Student saved.");
      }
    },
    onError: (error: Error) => {
      setFormError(caughtErrorMessage(error));
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => deleteStudent(studentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: studentQueryKeys.list(organization.id),
      });
      await queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast("Student removed from the roster.");
      navigate(`/my/${organization.slug}/roster`);
    },
    onError: (error: Error) => {
      toastCaughtError(error);
    },
  });

  const hasChanges =
    student && belongsHere
      ? studentProfileHaveChanges(
          {
            name,
            parentEmail: student.parentEmail ?? "",
            studentEmail,
            gradeLevel,
          },
          student,
        )
      : false;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!hasChanges) return;
    setFormError(null);
    saveMutation.mutate();
  }

  return {
    organization,
    student: belongsHere ? student : null,
    gradeLabels: organizationQuery.data?.gradeLabels ?? [],
    enrollments: enrollmentsQuery.data ?? [],
    classes: classesQuery.data ?? [],
    loading: query.isLoading,
    error: query.error ? query.error.message : null,
    notFound: !query.isLoading && (!student || !belongsHere),
    name,
    studentEmail,
    gradeLevel,
    formError,
    saving: saveMutation.isPending,
    removing: removeMutation.isPending,
    hasChanges,
    setName: (value: string) => {
      setName(value);
      setFormError(null);
    },
    setStudentEmail: (value: string) => {
      setStudentEmail(value);
      setFormError(null);
    },
    setGradeLevel: (value: string) => {
      setGradeLevel(value);
      setFormError(null);
    },
    onSubmit,
    onRemove: () => removeMutation.mutate(),
  };
}
