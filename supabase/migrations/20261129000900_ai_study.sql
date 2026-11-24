-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0009 · AI study: daily allowances
--
-- The app calls the AI provider from the server only. Before each call it claims part
-- of the student's daily allowance here; the claim is recorded first, so every request
-- counts (a failed call can't be used to reset the allowance). Limits mirror the free
-- plan in src/config/plans.ts (a unit test checks they match).
--   explanation   20 requests per rolling 24 hours
--   questions     30 questions per rolling 24 hours, at most 10 per request
--   flashcards     5 requests per rolling 24 hours
-- ════════════════════════════════════════════════════════════════════════════

create function public.ai_limits()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'explanation', 20,       -- requests per day
    'questions', 30,         -- AI_QUESTIONS_PER_DAY (items per day)
    'questions_per_request', 10,
    'flashcards', 5          -- AI_FLASHCARD_REQUESTS_PER_DAY
  );
$$;

-- What the caller has used in the last 24 hours, and their limits.
create function public.ai_usage()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'explanation', (select count(*) from public.ai_generation_logs
                    where player_id = auth.uid() and request_type = 'explanation' and status <> 'rate_limited' and created_at > now() - interval '24 hours'),
    'questions', (select coalesce(sum(item_count), 0) from public.ai_generation_logs
                  where player_id = auth.uid() and request_type = 'questions' and created_at > now() - interval '24 hours'),
    'flashcards', (select count(*) from public.ai_generation_logs
                   where player_id = auth.uid() and request_type = 'flashcards' and status <> 'rate_limited' and created_at > now() - interval '24 hours'),
    'limits', public.ai_limits()
  );
$$;

-- Claims allowance for one request. Returns {ok: true, log_id} or {ok: false, reason}.
-- Not raised as an error, so a refused claim is still recorded as rate_limited.
create function public.claim_ai_request(p_type text, p_items integer default 1)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  limits jsonb := public.ai_limits();
  used integer;
  cost integer;
  new_id uuid;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  if p_type is null or p_type not in ('explanation', 'questions', 'flashcards') then
    raise exception 'unknown request type' using errcode = 'check_violation';
  end if;
  if p_items is null or p_items < 1 or p_items > 20
     or (p_type = 'questions' and p_items > (limits ->> 'questions_per_request')::integer) then
    raise exception 'too many items in one request' using errcode = 'check_violation';
  end if;

  -- One claim at a time per student, so two quick requests can't both slip under the limit.
  perform 1 from public.profiles where id = uid for update;

  if p_type = 'questions' then
    select coalesce(sum(item_count), 0) into used from public.ai_generation_logs
    where player_id = uid and request_type = 'questions' and status <> 'rate_limited' and created_at > now() - interval '24 hours';
    cost := p_items;
  else
    select count(*) into used from public.ai_generation_logs
    where player_id = uid and request_type = p_type and status <> 'rate_limited' and created_at > now() - interval '24 hours';
    cost := 1;
  end if;

  if used + cost > (limits ->> p_type)::integer then
    insert into public.ai_generation_logs (player_id, request_type, status, item_count)
    values (uid, p_type, 'rate_limited', 0);
    return jsonb_build_object('ok', false, 'reason', 'limit', 'used', used, 'limit', (limits ->> p_type)::integer);
  end if;

  insert into public.ai_generation_logs (player_id, request_type, status, item_count)
  values (uid, p_type, 'success', case when p_type = 'questions' then p_items else 0 end)
  returning id into new_id;
  return jsonb_build_object('ok', true, 'log_id', new_id);
end;
$$;

-- Records how a claimed request went (for the student's own history). It can't give
-- allowance back: the claim above always counts.
create function public.finish_ai_request(p_log uuid, p_status text, p_delivered integer)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_generation_logs
  set status = case when p_status in ('success', 'failed', 'rejected') then p_status else status end,
      usage_metadata = usage_metadata || jsonb_build_object('delivered', greatest(0, least(coalesce(p_delivered, 0), 50)))
  where id = p_log and player_id = auth.uid() and created_at > now() - interval '10 minutes';
$$;

revoke execute on function public.ai_limits() from public, anon;
revoke execute on function public.ai_usage() from public, anon;
revoke execute on function public.claim_ai_request(text, integer) from public, anon;
revoke execute on function public.finish_ai_request(uuid, text, integer) from public, anon;
grant execute on function public.ai_limits() to authenticated;
grant execute on function public.ai_usage() to authenticated;
grant execute on function public.claim_ai_request(text, integer) to authenticated;
grant execute on function public.finish_ai_request(uuid, text, integer) to authenticated;
