-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0002 · Reference data
-- Launch subjects (GCSE focus) and achievement definitions. Topics, subtopics and
-- the original question bank arrive with solo revision (Stage 2).
-- Subject rows are stage-neutral; topics carry the education stage, so the same
-- "Biology" subject serves GCSE now and A-level later.
-- ════════════════════════════════════════════════════════════════════════════

insert into public.subjects (slug, name, description, icon, sort_order) values
  ('maths',               'Mathematics',         'Number, algebra, ratio, geometry, probability and statistics.', 'sigma',       10),
  ('english-language',    'English Language',    'Reading analysis, writing techniques, grammar and vocabulary.',  'pen-line',    20),
  ('english-literature',  'English Literature',  'Set texts, poetry, themes, context and analytical writing.',     'book-open',   30),
  ('biology',             'Biology',             'Cells, organisms, ecology, genetics and human biology.',          'leaf',        40),
  ('chemistry',           'Chemistry',           'Atomic structure, bonding, reactions and quantitative chemistry.', 'flask-conical', 50),
  ('physics',             'Physics',             'Energy, forces, electricity, waves and particles.',               'atom',        60),
  ('combined-science',    'Combined Science',    'Biology, chemistry and physics taught as one course.',            'microscope',  70),
  ('history',             'History',             'Periods, events, people, causes and source analysis.',            'landmark',    80),
  ('geography',           'Geography',           'Physical and human geography, fieldwork and map skills.',         'globe-2',     90)
on conflict (slug) do nothing;

insert into public.achievements (id, name, description, icon, xp_reward, sort_order) values
  ('first_quiz',     'First steps',     'Complete your first revision quiz.',                             'footprints',  25, 10),
  ('perfect_quiz',   'Clean sheet',     'Score 100% on a quiz of five or more questions.',               'check-check', 40, 20),
  ('first_battle',   'Into the room',   'Finish your first live game.',                                  'swords',      25, 30),
  ('battle_winner',  'Top of the room', 'Win a live game against at least one other player.',            'crown',       50, 40),
  ('streak_3',       'Three in a row',  'Learn on three days in a row.',                                  'flame',       30, 50),
  ('streak_7',       'Full week',       'Learn on seven days in a row.',                                  'flame',       75, 60),
  ('century',        'Century',         'Answer 100 questions correctly.',                                'target',      60, 70),
  ('comeback',       'Comeback',        'Raise your accuracy on a topic you previously found difficult.', 'trending-up', 40, 80),
  ('deck_builder',   'Deck builder',    'Create a flashcard deck with ten or more cards.',               'layers',      20, 90),
  ('steady_recall',  'Steady recall',   'Rate 50 flashcards as confident on review.',                    'brain',       40, 100)
on conflict (id) do nothing;
