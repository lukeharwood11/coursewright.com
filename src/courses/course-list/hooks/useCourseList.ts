import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  copyCourseFromCourse,
  courseQueryKeys,
  createCourse,
  listCourses,
} from "@/courses/databridge/courses";
import { validateCreateCourse } from "@/courses/model/createCourse";
import { allowedGradeLevels, toggleGradeLevel } from "@/courses/model/gradeLevels";
import { coursePath } from "@/courses/model/paths";
import { getOrganization, orgQueryKeys } from "@/organizations/databridge/organizations";

export function useCourseList() {
  const { organization } = useOrgShell();
  const query = useQuery({
    queryKey: courseQueryKeys.list(organization.id),
    queryFn: () => listCourses(organization.id),
  });

  return {
    organization,
    courses: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? query.error.message : null,
  };
}

export function useCreateCourse() {
  const { organization } = useOrgShell();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const open = searchParams.get("new") === "1";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [subject, setSubject] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("active");
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [mode, setMode] = useState<"scratch" | "copy">("scratch");
  const [sourceCourseId, setSourceCourseId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const orgQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });
  const coursesQuery = useQuery({
    queryKey: courseQueryKeys.list(organization.id),
    queryFn: () => listCourses(organization.id),
  });

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setLocation("");
      setSubject("");
      setStartDate("");
      setEndDate("");
      setStatus("active");
      setGradeLevels([]);
      setMode("scratch");
      setSourceCourseId(null);
      setFormError(null);
      return;
    }
    const from = Number(searchParams.get("from"));
    if (Number.isFinite(from) && from > 0) {
      setMode("copy");
      setSourceCourseId(from);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !sourceCourseId) return;
    const source = (coursesQuery.data ?? []).find((row) => row.id === sourceCourseId);
    if (!source) return;
    setDescription((current) => current || source.description);
    setLocation((current) => current || source.location);
    setSubject((current) => current || source.subject);
  }, [open, sourceCourseId, coursesQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = validateCreateCourse({
        title,
        description,
        location,
        subject,
        startDate,
        endDate,
        gradeLevels: allowedGradeLevels(
          gradeLevels,
          orgQuery.data?.gradeLabels ?? [],
        ),
        status,
        copiedFromCourseId: mode === "copy" ? sourceCourseId : null,
      });
      if (!parsed.ok) throw new Error(parsed.error);
      if (mode === "copy") {
        if (!sourceCourseId) {
          throw new Error("Pick a course to copy from.");
        }
        return copyCourseFromCourse({
          sourceCourseId,
          title: parsed.value.title,
          description: parsed.value.description,
          location: parsed.value.location,
          subject: parsed.value.subject,
          startDate: parsed.value.startDate,
          endDate: parsed.value.endDate,
          gradeLevels: parsed.value.gradeLevels,
          status: parsed.value.status,
        }).then((result) => ({ id: result.courseId }));
      }
      return createCourse(organization.id, parsed.value);
    },
    onSuccess: async (course) => {
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.list(organization.id),
      });
      navigate(coursePath(organization.slug, course.id));
    },
    onError: (error: Error) => setFormError(error.message),
  });

  function setOpen(next: boolean) {
    const nextParams = new URLSearchParams(searchParams);
    if (next) nextParams.set("new", "1");
    else {
      nextParams.delete("new");
      nextParams.delete("from");
    }
    setSearchParams(nextParams, { replace: true });
  }

  function setSourceCourseIdAndPrefill(id: number | null) {
    setSourceCourseId(id);
    const source = (coursesQuery.data ?? []).find((row) => row.id === id);
    if (!source) return;
    setDescription(source.description);
    setLocation(source.location);
    setSubject(source.subject);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    mutation.mutate();
  }

  return {
    open,
    setOpen,
    title,
    setTitle,
    description,
    setDescription,
    location,
    setLocation,
    subject,
    setSubject,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    status,
    setStatus,
    gradeLevels,
    setGradeLevels: (label: string) =>
      setGradeLevels((current) => toggleGradeLevel(current, label)),
    mode,
    setMode,
    sourceCourseId,
    setSourceCourseId: setSourceCourseIdAndPrefill,
    formError,
    submitting: mutation.isPending,
    onSubmit,
    gradeLabels: orgQuery.data?.gradeLabels ?? [],
    sourceCourses: coursesQuery.data ?? [],
  };
}
