import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { createQuiz, quizQueryKeys } from "@/quizzes/databridge/quizzes";
import { quizEditPath } from "@/quizzes/model/paths";

export function useAddQuiz(args: {
  organizationId: number;
  orgSlug: string;
  courseId: number;
  unitId: number;
}) {
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const trimmed = title.trim();
      if (!trimmed) throw new Error("Give the quiz a title.");
      return createQuiz({
        organizationId: args.organizationId,
        courseId: args.courseId,
        unitId: args.unitId,
        title: trimmed,
        description,
        createdBy: user.id,
      });
    },
    onSuccess: async (quiz) => {
      await queryClient.invalidateQueries({ queryKey: quizQueryKeys.list(args.courseId) });
      await queryClient.invalidateQueries({ queryKey: quizQueryKeys.unit(args.unitId) });
      setTitle("");
      setDescription("");
      setOpen(false);
      navigate(
        quizEditPath({
          orgSlug: args.orgSlug,
          courseId: args.courseId,
          unitId: args.unitId,
          quizId: quiz.id,
        }),
      );
    },
  });

  return {
    open,
    setOpen,
    title,
    setTitle,
    description,
    setDescription,
    submitting: mutation.isPending,
    error: mutation.error?.message ?? null,
    onSubmit: (event: { preventDefault: () => void }) => {
      event.preventDefault();
      mutation.mutate();
    },
  };
}
