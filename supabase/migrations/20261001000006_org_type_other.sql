-- Add generic "other" organization type (default for new orgs in app).

alter table organizations drop constraint if exists organizations_org_type_chk;

alter table organizations
  add constraint organizations_org_type_chk
  check (org_type in ('other', 'coop', 'micro_school', 'family'));
