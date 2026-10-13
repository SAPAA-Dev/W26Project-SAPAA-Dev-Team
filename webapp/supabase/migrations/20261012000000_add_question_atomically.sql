-- #273: the form editor added a question with three separate inserts (question_keys, questions,
-- question_options). When the second or third failed, the question_keys row stayed behind, and
-- because "question key" is unique, a retry with the same key failed too. This function does
-- all three inserts in one transaction, so a failure leaves nothing behind.
-- Caller: addQuestion in utils/form-actions.ts, with the service role, after requireApprovedAdmin.
-- A human runs this same file in the Supabase dashboard for production. Safe to run twice.

create or replace function public.add_question_atomically(
  p_section_id bigint,
  p_form_question text,
  p_subtext text,
  p_question_type text,
  p_is_required boolean,
  p_question_key text,
  p_category text,
  p_comment boolean,
  p_obs_value boolean,
  p_obs_comm boolean,
  p_options text[]
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_key_id bigint;
  new_question_id bigint;
begin
  insert into public.question_keys (category, "question key", comment, definition)
  values (p_category, p_question_key, p_comment, null)
  returning id into new_key_id;

  -- The new question goes at the end of the form.
  insert into public.questions (
    form_question, "question key", obs_value, obs_comm, question_key_id, question_type,
    is_active, section_id, is_required, subtext, autofill_key, formorder
  )
  values (
    p_form_question, p_question_key, p_obs_value, p_obs_comm, new_key_id, p_question_type,
    true, p_section_id, p_is_required, p_subtext, null,
    (select coalesce(max(formorder), 0) + 1 from public.questions)
  )
  returning id into new_question_id;

  -- position is the 0-based index of the option in p_options.
  insert into public.question_options (question_id, option_text, is_active, position)
  select new_question_id, options.option_text, true, (options.ordinality - 1)::integer
  from unnest(coalesce(p_options, '{}'::text[])) with ordinality as options(option_text, ordinality);

  return new_question_id;
end;
$$;

-- Direct browser callers cannot run it; only the server service role can.
revoke all on function public.add_question_atomically(
  bigint, text, text, text, boolean, text, text, boolean, boolean, boolean, text[]
) from public, anon, authenticated;

grant execute on function public.add_question_atomically(
  bigint, text, text, text, boolean, text, text, boolean, boolean, boolean, text[]
) to service_role;

-- Refresh PostgREST so the new RPC function is available without a service restart.
notify pgrst, 'reload schema';
