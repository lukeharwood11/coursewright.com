import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { caughtErrorMessage } from "@/ui/toast";
import {
  getOrgFormByItemId,
  listFormSubjectStudents,
  listOrgFormSubmissions,
  orgFormQueryKeys,
  submitOrgForm,
  type FormSubjectStudent,
} from "@/resources/databridge/forms";
import {
  formAnswerText,
  formAnswersPayload,
  subjectStudentIdFromChoice,
  submissionsVisibleToActor,
  validateFormAnswers,
  type FormAnswers,
  type OrgFormSchema,
} from "@/resources/model/formSchema";

export function useFormFill({
  organizationId,
  itemId,
  published,
  canEdit,
  userId,
}: {
  organizationId: number;
  itemId: number;
  published: boolean;
  canEdit: boolean;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const formQuery = useQuery({
    queryKey: orgFormQueryKeys.byItem(itemId),
    queryFn: () => getOrgFormByItemId(itemId),
  });
  const form = formQuery.data ?? null;
  const studentsQuery = useQuery({
    queryKey: orgFormQueryKeys.students(organizationId),
    queryFn: () => listFormSubjectStudents(organizationId),
    enabled: Boolean(form && form.schema.subject !== "none" && published),
  });
  const submissionsQuery = useQuery({
    queryKey: form ? orgFormQueryKeys.submissions(form.id) : ["org-forms", "submissions", 0],
    queryFn: () => listOrgFormSubmissions(form!.id),
    enabled: Boolean(form),
  });
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [studentId, setStudentIdState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function setStudentId(value: string) {
    setSent(false);
    setStudentIdState(value);
  }

  function setTextAnswer(fieldId: string, value: string) {
    setSent(false);
    setAnswers((current) => ({ ...current, [fieldId]: value }));
  }

  function setYesNo(fieldId: string, value: boolean) {
    setSent(false);
    setAnswers((current) => ({ ...current, [fieldId]: value }));
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error("This form isn’t ready yet.");
      const subjectStudentId = subjectStudentIdFromChoice(studentId);
      const message = validateFormAnswers({
        schema: form.schema,
        answers,
        subjectStudentId,
      });
      if (message) throw new Error(message);
      await submitOrgForm({
        organizationId,
        formId: form.id,
        submittedBy: userId,
        subjectStudentProfileId: form.schema.subject === "none" ? null : subjectStudentId,
        payload: formAnswersPayload(form.schema, answers),
      });
    },
    onSuccess: async () => {
      setAnswers({});
      setStudentIdState("");
      setError(null);
      setSent(true);
      if (form) {
        await queryClient.invalidateQueries({
          queryKey: orgFormQueryKeys.submissions(form.id),
        });
      }
    },
    onError: (caught: Error) => {
      setSent(false);
      setError(caughtErrorMessage(caught));
    },
  });

  const schema: OrgFormSchema | null = form?.schema ?? null;
  const submissions = submissionsQuery.data ?? [];

  return {
    loading: formQuery.isLoading,
    missing: !formQuery.isLoading && !form,
    published,
    canEdit,
    schema,
    students: (studentsQuery.data ?? []) as FormSubjectStudent[],
    studentId,
    setStudentId,
    textAnswer: (fieldId: string) => formAnswerText(answers[fieldId]),
    yesNo: (fieldId: string) => answers[fieldId],
    setTextAnswer,
    setYesNo,
    error,
    sent,
    pending: submit.isPending,
    submit: () => submit.mutate(),
    submissionsLoading: submissionsQuery.isLoading,
    submissions: submissionsVisibleToActor(submissions, { canEdit, userId }),
  };
}

export type FormFillModel = ReturnType<typeof useFormFill>;
