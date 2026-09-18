-- Optional catalog icon for courses (Heroicons outline key, validated in app + DB).

alter table public.courses
  add column icon_key text;

alter table public.courses
  add constraint courses_icon_key_chk
  check (
    icon_key is null
    or icon_key in (
      'academic-cap',
      'book-open',
      'beaker',
      'building-library',
      'calculator',
      'computer-desktop',
      'globe-americas',
      'heart',
      'map',
      'light-bulb',
      'musical-note',
      'paint-brush',
      'pencil-square',
      'sparkles',
      'sun',
      'user-group'
    )
  );

comment on column public.courses.icon_key is
  'Optional Heroicons outline key for course list cards; null = no icon';
