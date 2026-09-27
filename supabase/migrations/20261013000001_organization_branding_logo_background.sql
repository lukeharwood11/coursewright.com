-- Optional accent-colored plate behind the logo lockup (for white/light artwork).

alter table public.organization_branding
  add column logo_accent_background boolean not null default false;

comment on column public.organization_branding.logo_accent_background is
  'When true, report cards render the logo on the org accent color (or Wright Green).';

create or replace function private.report_card_snapshot(p_enrollment_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_items jsonb;
  v_final numeric;
  v_mode text;
  v_pass numeric;
  v_bands jsonb;
  v_updated timestamptz;
  v_course_id bigint;
  v_course_title text;
  v_student_id bigint;
  v_student_name text;
  v_org bigint;
  v_org_name text;
  v_logo_path text;
  v_logo_updated_at timestamptz;
  v_logo_accent_bg boolean;
  v_accent_color text;
  v_override text;
  v_note text;
  v_overridden_at timestamptz;
  item jsonb;
  labeled jsonb := '[]'::jsonb;
begin
  select
    e.course_id,
    c.title,
    e.student_profile_id,
    sp.name,
    c.organization_id,
    o.name,
    b.logo_path,
    b.updated_at,
    coalesce(b.logo_accent_background, false),
    b.accent_color,
    f.override_label,
    f.override_note,
    f.overridden_at
  into
    v_course_id,
    v_course_title,
    v_student_id,
    v_student_name,
    v_org,
    v_org_name,
    v_logo_path,
    v_logo_updated_at,
    v_logo_accent_bg,
    v_accent_color,
    v_override,
    v_note,
    v_overridden_at
  from public.enrollments e
  join public.courses c on c.id = e.course_id
  join public.org_profiles sp on sp.id = e.student_profile_id
  join public.organizations o on o.id = c.organization_id
  left join public.organization_branding b on b.organization_id = c.organization_id
  left join public.course_final_grades f on f.enrollment_id = e.id
  where e.id = p_enrollment_id;

  select s.mode, s.pass_threshold, s.bands, s.updated_at
  into v_mode, v_pass, v_bands, v_updated
  from public.organization_grading_scales s
  where s.organization_id = v_org;

  if v_mode is null then
    v_mode := 'none';
    v_bands := '[]'::jsonb;
  end if;

  v_items := private.enrollment_grade_rows(p_enrollment_id);
  v_final := private.mean_locked_percent(v_items);

  for item in
    select value from jsonb_array_elements(v_items)
  loop
    labeled := labeled || jsonb_build_array(
      item || jsonb_build_object(
        'label', private.percent_label(
          v_mode, v_pass, v_bands, nullif(item->>'percent', '')::numeric
        )
      )
    );
  end loop;

  return jsonb_build_object(
    'scale_mode', v_mode,
    'scale_updated_at', v_updated,
    'course_id', v_course_id,
    'course_title', v_course_title,
    'student_profile_id', v_student_id,
    'student_name', v_student_name,
    'enrollment_id', p_enrollment_id,
    'org_name', v_org_name,
    'org_logo_path', v_logo_path,
    'org_logo_updated_at', v_logo_updated_at,
    'org_logo_accent_background', v_logo_accent_bg and v_logo_path is not null,
    'org_accent_color', v_accent_color,
    'final_percent', v_final,
    'final_label', private.percent_label(v_mode, v_pass, v_bands, v_final),
    'override_label', v_override,
    'override_note', v_note,
    'overridden_at', v_overridden_at,
    'items', labeled
  );
end;
$$;
