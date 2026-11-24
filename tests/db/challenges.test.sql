-- Topic challenges and mixed GCSE challenges (rooms with no subject).
\set QUIET on
\o /dev/null

\set gus '\'00000000-0000-4000-8000-0000000000a7\''
insert into auth.users (id, email, raw_user_meta_data) values (:gus, 'gus@example.test', '{"display_name":"Gus"}');
select id as maths from public.subjects where slug = 'maths' \gset
select id as alg from public.topics where slug = 'algebra-equations-expressions' \gset

select tests.login(:gus);
select public.create_room(null, null, null, 10, 20) ->> 'room_id' as mixed \gset
select tests.assert((select subject_id is null and topic_id is null and question_count = 10 from public.game_rooms where id = :'mixed'), 'a mixed challenge room has no subject');
reset role;
select tests.assert((select count(distinct t.subject_id) > 3 from public.game_question_pool(null, null) p(id) join public.questions q on q.id = p.id join public.topics t on t.id = q.topic_id), 'mixed questions come from many subjects');
select tests.login(:gus);
select tests.expect_error(format('select public.create_room(null, %L, null, 10, 20)', :'alg'), '23514');
select public.create_room(:'maths', :'alg', null, 10, 20) ->> 'room_id' as topical \gset
select tests.assert((select topic_id = :'alg' from public.game_rooms where id = :'topical'), 'topic challenges still work');
\echo '  ✓ challenge tests passed'
