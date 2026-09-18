-- HN-014: authenticated INSERT on bigserial tables needs sequence USAGE.
-- Table grants alone are not enough; missing USAGE yields 42501
-- "permission denied for sequence organizations_id_seq".

grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant usage, select on sequences to authenticated;
