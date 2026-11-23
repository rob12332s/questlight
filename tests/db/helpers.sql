-- Test helpers. Created after migrations so they never become part of the real schema.
create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.assert(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if condition is not true then
    raise exception 'ASSERTION FAILED: %', message;
  end if;
end;
$$;

-- Fixed identities used across test files.
create function tests.alice() returns uuid language sql immutable as $$ select '00000000-0000-4000-8000-0000000000a1'::uuid $$;
create function tests.bob() returns uuid language sql immutable as $$ select '00000000-0000-4000-8000-0000000000b2'::uuid $$;
create function tests.carol() returns uuid language sql immutable as $$ select '00000000-0000-4000-8000-0000000000c3'::uuid $$;

-- Acts as a signed-in user for the rest of the session (until tests.logout()).
create function tests.login(user_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, false);
  perform set_config('role', 'authenticated', false);
end;
$$;

create function tests.login_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', false);
  perform set_config('role', 'anon', false);
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

-- Expects `stmt` to fail. `expected` may be a PostgreSQL error code (e.g. 42501) or the
-- HINT our functions attach (e.g. already_answered).
create function tests.expect_error(stmt text, expected text)
returns void
language plpgsql
as $$
declare
  h text;
  st text;
begin
  begin
    execute stmt;
  exception when others then
    get stacked diagnostics h = pg_exception_hint, st = returned_sqlstate;
    if expected is not null and coalesce(h, '') <> expected and st <> expected then
      raise exception 'ASSERTION FAILED: "%" failed with % / % (wanted %)', stmt, st, h, expected;
    end if;
    return;
  end;
  raise exception 'ASSERTION FAILED: expected an error from: %', stmt;
end;
$$;
grant execute on function tests.expect_error(text, text) to anon, authenticated;

-- Answer keys copied out for tests that play quizzes as a student.
create table tests.answer_key (question_id uuid primary key, answer text not null);
grant select on tests.answer_key to authenticated;
