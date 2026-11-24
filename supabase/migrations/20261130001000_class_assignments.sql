-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0010 · Work set by teachers
--
-- A teacher sets a topic quiz for a class with a due date. A student has done it once
-- they finish a quiz on that topic after it was set (late if after the due date). The
-- teacher sees each student's status and best score. Students see their own work only.
-- ════════════════════════════════════════════════════════════════════════════

create table public.class_assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 80),
  due_at timestamptz not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint class_assignments_due_after_set check (due_at > created_at)
);
create index class_assignments_class_idx on public.class_assignments (classroom_id, due_at desc);

alter table public.class_assignments enable row level security;
revoke all on public.class_assignments from public, anon, authenticated;
grant select on public.class_assignments to authenticated;
create policy "class_assignments: teacher or member reads" on public.class_assignments
  for select to authenticated
  using (public.is_classroom_teacher(classroom_id) or public.is_classroom_member(classroom_id));

-- Due at the end of the chosen UK day.
create function public.create_assignment(p_class uuid, p_topic uuid, p_due date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cls public.classrooms%rowtype := public.lock_my_class(p_class);
  topic_name text;
  due timestamptz := ((p_due + 1)::timestamp at time zone 'Europe/London');
  new_id uuid;
begin
  if cls.archived_at is not null then
    raise exception 'this class is archived' using errcode = 'P0001', hint = 'archived';
  end if;
  select name into topic_name from public.topics where id = p_topic;
  if topic_name is null then
    raise exception 'topic not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if p_due is null or due <= now() or p_due > (now() at time zone 'Europe/London')::date + 180 then
    raise exception 'choose a due date from today up to six months ahead' using errcode = 'check_violation', hint = 'bad_due_date';
  end if;
  if (select count(*) from public.class_assignments where classroom_id = p_class and due_at > now()) >= 30 then
    raise exception 'too much work set' using errcode = 'P0001', hint = 'too_many';
  end if;
  insert into public.class_assignments (classroom_id, topic_id, title, due_at, created_by)
  values (p_class, p_topic, topic_name, due, auth.uid())
  returning id into new_id;
  return new_id;
end;
$$;

create function public.delete_assignment(p_assignment uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cls_id uuid;
begin
  select classroom_id into cls_id from public.class_assignments where id = p_assignment;
  if cls_id is null or not public.is_classroom_teacher(cls_id) then
    raise exception 'not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  delete from public.class_assignments where id = p_assignment;
end;
$$;

-- Teacher view: every student in the class and how they did on one piece of work.
create function public.get_assignment_progress(p_assignment uuid)
returns table (student_id uuid, display_name text, status text, best_correct integer, best_total integer, completed_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  a public.class_assignments%rowtype;
begin
  select * into a from public.class_assignments where id = p_assignment;
  if not found or not public.is_classroom_teacher(a.classroom_id) then
    raise exception 'not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  return query
  select m.student_id,
         p.display_name,
         case
           when best.completed_at is null then 'not_started'
           when first_done.completed_at <= a.due_at then 'done'
           else 'late'
         end,
         best.correct_count::integer,
         best.total::integer,
         first_done.completed_at
  from public.classroom_members m
  join public.profiles p on p.id = m.student_id
  left join lateral (
    select s.correct_count, cardinality(s.question_ids) as total, s.completed_at
    from public.quiz_sessions s
    where s.player_id = m.student_id and s.topic_id = a.topic_id and s.status = 'completed' and s.completed_at >= a.created_at
    order by s.correct_count::numeric / greatest(cardinality(s.question_ids), 1) desc, s.completed_at
    limit 1
  ) best on true
  left join lateral (
    select min(s.completed_at) as completed_at
    from public.quiz_sessions s
    where s.player_id = m.student_id and s.topic_id = a.topic_id and s.status = 'completed' and s.completed_at >= a.created_at
  ) first_done on true
  where m.classroom_id = a.classroom_id
  order by lower(p.display_name);
end;
$$;

-- Student view: work set in their classes that's due in the last week or later, with
-- whether they've done it.
create function public.get_my_assignments()
returns table (assignment_id uuid, classroom_id uuid, class_name text, topic_id uuid, title text, due_at timestamptz, done boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.classroom_id, c.name, a.topic_id, a.title, a.due_at,
         exists (
           select 1 from public.quiz_sessions s
           where s.player_id = auth.uid() and s.topic_id = a.topic_id and s.status = 'completed' and s.completed_at >= a.created_at
         )
  from public.class_assignments a
  join public.classrooms c on c.id = a.classroom_id
  join public.classroom_members m on m.classroom_id = a.classroom_id and m.student_id = auth.uid()
  where a.due_at > now() - interval '7 days' and c.archived_at is null
  order by a.due_at;
$$;

-- Teacher summary: how many students have done each piece of work in a class.
create function public.get_class_assignments(p_class uuid)
returns table (assignment_id uuid, topic_id uuid, title text, due_at timestamptz, done_count integer, student_count integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.is_classroom_teacher(p_class) then
    raise exception 'class not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  return query
  select a.id, a.topic_id, a.title, a.due_at,
         (select count(*)::integer from public.classroom_members m
          where m.classroom_id = p_class and exists (
            select 1 from public.quiz_sessions s
            where s.player_id = m.student_id and s.topic_id = a.topic_id and s.status = 'completed' and s.completed_at >= a.created_at
          )),
         (select count(*)::integer from public.classroom_members m where m.classroom_id = p_class)
  from public.class_assignments a
  where a.classroom_id = p_class
  order by a.due_at desc;
end;
$$;

revoke execute on function public.create_assignment(uuid, uuid, date) from public, anon;
revoke execute on function public.delete_assignment(uuid) from public, anon;
revoke execute on function public.get_assignment_progress(uuid) from public, anon;
revoke execute on function public.get_my_assignments() from public, anon;
revoke execute on function public.get_class_assignments(uuid) from public, anon;
grant execute on function public.create_assignment(uuid, uuid, date) to authenticated;
grant execute on function public.delete_assignment(uuid) to authenticated;
grant execute on function public.get_assignment_progress(uuid) to authenticated;
grant execute on function public.get_my_assignments() to authenticated;
grant execute on function public.get_class_assignments(uuid) to authenticated;
