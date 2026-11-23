-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0002 · Reference data
-- Launch subjects and achievement definitions. Topics and original question-bank
-- content arrive with solo revision (Stage 2).
-- ════════════════════════════════════════════════════════════════════════════

insert into public.subjects (slug, name, description, accent, sort_order) values
  ('maths',     'Mathematics', 'Number, algebra, geometry and statistics.',            'subject-maths',     10),
  ('english',   'English',     'Reading, writing, grammar and literary techniques.',   'subject-english',   20),
  ('science',   'Science',     'Biology, chemistry and physics fundamentals.',         'subject-science',   30),
  ('history',   'History',     'Key periods, events, people and sources.',             'subject-history',   40),
  ('geography', 'Geography',   'Physical and human geography, maps and skills.',      'subject-geography', 50)
on conflict (slug) do nothing;

insert into public.achievements (id, name, description, icon, xp_reward, sort_order) values
  ('first_quiz',        'First Steps',      'Complete your first solo revision quiz.',                 'footprints', 25, 10),
  ('perfect_quiz',      'Flawless',         'Score 100% on a quiz of five or more questions.',         'sparkles',   40, 20),
  ('first_battle',      'Into the Arena',   'Finish your first multiplayer battle.',                   'swords',     25, 30),
  ('battle_winner',     'Top of the Room',  'Win a multiplayer battle with at least two players.',     'crown',      50, 40),
  ('streak_3',          'On a Roll',        'Learn on three days in a row.',                           'flame',      30, 50),
  ('streak_7',          'Week Warrior',     'Learn on seven days in a row.',                           'flame',      75, 60),
  ('century',           'Century',          'Answer 100 questions correctly.',                         'target',     60, 70),
  ('all_rounder',       'All-Rounder',      'Complete a quiz in every launch subject.',                'compass',    60, 80),
  ('comeback',          'Comeback',         'Beat your previous best accuracy on a topic.',            'trending-up', 20, 90)
on conflict (id) do nothing;
