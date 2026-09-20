-- Activity previews for Lexical posts (including @mention pills) walked
-- `children` but not `root`, so the stored preview was the raw JSON body.

create or replace function private.jsonb_collect_text(p jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  piece text := '';
  child jsonb;
begin
  if p is null then
    return '';
  end if;
  if jsonb_typeof(p) = 'string' then
    return p #>> '{}';
  end if;
  if jsonb_typeof(p) = 'object' then
    -- Quoted blocks are cite, not the new post text.
    if coalesce(p->>'type', '') = 'quote' then
      return '';
    end if;
    if jsonb_typeof(p->'text') = 'string' then
      piece := p->>'text';
    end if;
    if p ? 'lexical' then
      piece := piece || private.jsonb_collect_text(p->'lexical');
    end if;
    if p ? 'root' then
      piece := piece || private.jsonb_collect_text(p->'root');
    end if;
    if jsonb_typeof(p->'children') = 'array' then
      for child in select value from jsonb_array_elements(p->'children')
      loop
        piece := piece || private.jsonb_collect_text(child);
      end loop;
    end if;
    return piece;
  end if;
  if jsonb_typeof(p) = 'array' then
    for child in select value from jsonb_array_elements(p)
    loop
      piece := piece || private.jsonb_collect_text(child);
    end loop;
    return piece;
  end if;
  return '';
end;
$$;

-- Guard blocks client preview edits; this backfill is a one-shot repair.
alter table public.notifications disable trigger notifications_guard_update;

update public.notifications n
set preview = coalesce(
  nullif(private.discussion_message_preview(m.body), ''),
  'Posted in this discussion.'
)
from public.discussion_messages m
where n.discussion_message_id = m.id
  and left(btrim(n.preview), 1) = '{';

alter table public.notifications enable trigger notifications_guard_update;
