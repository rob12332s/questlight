import type { SubjectLibrary, TopicTuple } from "./types";

/**
 * GCSE English Language. Reading and writing skills follow the DfE GCSE English
 * language subject content that all boards assess ("shared"). Question-by-question
 * technique is board-specific; only AQA 8700 is included so far, because its paper
 * structure has been checked. Edexcel and OCR exam technique is planned.
 */
const aqa = (paper: 1 | 2) => ({
  coverage: "board_specific" as const,
  boards: ["aqa" as const],
  p: paper === 1 ? "Paper 1: Explorations in creative reading and writing" : "Paper 2: Writers' viewpoints and perspectives",
});

const aqaPaper1: TopicTuple[] = [
  ["aqa-p1-q1-retrieval", "Paper 1 Q1: listing information", "List four true pieces of information from a set section of the source", "recall", { ...aqa(1), d: "f" }],
  ["aqa-p1-q2-language", "Paper 1 Q2: language analysis", "Analyse how the writer uses words, phrases, techniques and sentence forms in a set extract", "analyse", aqa(1)],
  ["aqa-p1-q3-structure", "Paper 1 Q3: structure analysis", "Analyse how the writer structures the whole source to interest the reader", "analyse", aqa(1)],
  ["aqa-p1-q4-evaluation", "Paper 1 Q4: evaluating a statement", "Evaluate a statement about the source with a personal response backed by quotations and methods", "evaluate", { ...aqa(1), d: "c" }],
  ["aqa-p1-q5-creative", "Paper 1 Q5: descriptive or narrative writing", "Write a description or story from a picture or prompt, with ambitious vocabulary and a deliberate structure", "write", aqa(1)],
];

const aqaPaper2: TopicTuple[] = [
  ["aqa-p2-q1-true-statements", "Paper 2 Q1: true statements", "Identify four true statements from a list about a set part of the source", "recall", { ...aqa(2), d: "f" }],
  ["aqa-p2-q2-summary", "Paper 2 Q2: summarising differences", "Summarise the differences or similarities between two sources using inference from both", "compare", aqa(2)],
  ["aqa-p2-q3-language", "Paper 2 Q3: language in non-fiction", "Analyse how a writer uses language to describe something in one source", "analyse", aqa(2)],
  ["aqa-p2-q4-comparing-perspectives", "Paper 2 Q4: comparing perspectives", "Compare how two writers convey their perspectives and the methods they use", "compare", { ...aqa(2), d: "c" }],
  ["aqa-p2-q5-viewpoint", "Paper 2 Q5: writing to present a viewpoint", "Write an article, letter, speech or essay presenting your view on a statement", "write", aqa(2)],
];

export const ENGLISH_LANGUAGE_LIBRARY: SubjectLibrary = {
  subject: "english-language",
  defaults: { coverage: "shared", verification: "awaiting_verification" },
  areas: [
    {
      area: "Reading",
      groups: [
        {
          subtopic: "Understanding a text",
          topics: [
            ["explicit-information", "Finding explicit information", "Identify and retrieve explicit information from a text accurately", "recall", { d: "f" }],
            ["inference", "Inference", "Infer meaning that is implied rather than stated, using evidence", "analyse"],
            ["choosing-quotations", "Choosing and embedding quotations", "Select short, precise quotations and embed them in your own sentences", "analyse"],
            ["summarising", "Summarising", "Summarise key points from a text concisely in your own words", "recall"],
            ["synthesising-two-texts", "Synthesising two texts", "Draw together information and ideas from two texts", "compare"],
            ["purpose-audience-form", "Purpose, audience and form", "Identify a text's purpose, audience and form and explain how they shape it", "analyse", { d: "f" }],
            ["fact-and-opinion", "Fact and opinion", "Tell facts from opinions and explain how writers blend them to persuade", "analyse", { d: "f" }],
            ["bias-and-reliability", "Bias and reliability", "Spot bias and one-sided presentation in non-fiction and explain how it is created", "evaluate"],
            ["writers-perspective", "Identifying a writer's perspective", "Work out a writer's attitude and viewpoint from their choices", "analyse"],
            ["unseen-fiction", "Reading unseen fiction", "Read an unseen fiction extract quickly for setting, character, mood and shifts", "analyse"],
            ["genre-conventions", "Genre conventions", "Recognise conventions of genres such as gothic, crime and dystopian fiction", "analyse"],
            ["nineteenth-century-nonfiction", "Reading 19th-century non-fiction", "Understand older non-fiction texts, including unfamiliar vocabulary and syntax", "context", { d: "c" }],
            ["literary-nonfiction", "Literary non-fiction", "Read autobiography, travel writing and journalism and identify their features", "analyse"],
          ],
        },
        {
          subtopic: "Language analysis",
          flags: { quiz: "english-language/language-techniques" },
          topics: [
            ["word-level-analysis", "Analysing word choice", "Explore the connotations of individual words and their effect on the reader", "analyse", { d: "f" }],
            ["imagery", "Imagery: simile, metaphor and personification", "Explain the effect of figurative language rather than just naming it", "analyse"],
            ["sound-devices", "Sound devices", "Analyse alliteration, sibilance, onomatopoeia and assonance", "analyse"],
            ["sentence-forms", "Sentence forms", "Analyse the effect of short, long, minor, complex and fragmented sentences", "analyse"],
            ["semantic-fields", "Semantic fields and patterns", "Track semantic fields and repeated patterns across a text", "analyse"],
            ["symbolism", "Symbolism and motifs", "Explain how objects, colours and recurring motifs carry meaning", "analyse"],
            ["tone-and-mood", "Tone and mood", "Identify tone and mood and explain how language creates them", "analyse"],
            ["pathetic-fallacy", "Pathetic fallacy", "Explain how weather and setting reflect characters' feelings and mood", "analyse"],
            ["characterisation", "Characterisation", "Analyse how writers present characters through description, speech and action", "analyse"],
            ["setting-and-atmosphere", "Setting and atmosphere", "Analyse how writers create a sense of place and atmosphere", "analyse"],
            ["rhetorical-devices", "Rhetorical devices", "Analyse rhetorical questions, lists of three, direct address and emotive language", "analyse"],
            ["irony-and-satire", "Irony and satire", "Recognise irony, sarcasm and satire and explain their effect", "analyse", { d: "c" }],
            ["hyperbole-and-humour", "Hyperbole and humour", "Analyse how writers use exaggeration and humour to make a point", "analyse"],
            ["what-how-why", "What, how, why paragraphs", "Build analytical paragraphs that say what the writer does, how, and why", "analyse", { d: "c" }],
            ["subject-terminology", "Using subject terminology", "Use subject terminology accurately to support analysis", "analyse"],
          ],
        },
        {
          subtopic: "Structure analysis",
          flags: { quiz: "english-language/structure-narrative" },
          topics: [
            ["openings-and-endings", "Openings and endings", "Analyse how openings hook readers and how endings resolve or unsettle", "analyse", { d: "f" }],
            ["shifts-in-focus", "Shifts in focus", "Track how a writer moves the reader's focus from wide to narrow, outside to inside, or across time", "analyse"],
            ["narrative-perspective", "Narrative perspective", "Explain the effect of first-person, third-person and changing viewpoints", "analyse"],
            ["pace-and-tension", "Pace and tension", "Explain how paragraph length, dialogue and sentence length control pace", "analyse"],
            ["cyclical-and-contrast", "Cyclical structure and contrast", "Explain the effect of cyclical structures, juxtaposition and contrast", "analyse", { d: "c" }],
            ["flashback-and-time", "Flashback and time shifts", "Explain the effect of flashbacks, foreshadowing and time shifts", "analyse"],
            ["dialogue-in-narrative", "Dialogue in narratives", "Explain how dialogue moves a narrative forward and reveals character", "analyse"],
            ["climax-and-turning-points", "Climax and turning points", "Identify turning points and climaxes and explain their effect on the reader", "analyse"],
          ],
        },
        {
          subtopic: "Evaluation and comparison",
          topics: [
            ["critical-evaluation", "Critical evaluation", "Evaluate how successfully a writer achieves an effect, with a clear personal judgement", "evaluate"],
            ["agreeing-with-a-statement", "Responding to a statement", "Decide how far you agree with a statement and support your view throughout", "evaluate", { d: "c" }],
            ["comparing-ideas", "Comparing ideas", "Compare writers' ideas and perspectives using connectives of comparison", "compare"],
            ["comparing-methods", "Comparing methods", "Compare the methods two writers use to convey their views", "compare", { d: "c" }],
            ["context-in-language", "Context of non-fiction texts", "Explain how the time a text was written affects its views and language", "context"],
            ["older-and-modern-texts", "Comparing older and modern texts", "Compare how a 19th-century and a 21st-century writer present similar ideas", "compare", { d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Writing",
      groups: [
        {
          subtopic: "Creative writing",
          flags: { quiz: "english-language/structure-narrative" },
          topics: [
            ["descriptive-writing", "Descriptive writing", "Write a vivid description that zooms in on details and senses", "write"],
            ["narrative-writing", "Narrative writing", "Write a short story with a clear arc, a focused setting and a few characters", "write"],
            ["show-dont-tell", "Show, don't tell", "Reveal character and emotion through action, dialogue and detail", "write"],
            ["sensory-description", "Sensory description", "Use all five senses to build a convincing setting", "write", { d: "f" }],
            ["character-creation", "Creating believable characters", "Build a character from a few telling details and a clear motivation", "write"],
            ["narrative-voice", "Choosing a narrative voice", "Choose first or third person deliberately and keep the voice consistent", "write"],
            ["creative-openings", "Writing strong openings", "Open creative writing with an in-media-res, dialogue, setting or question hook", "write", { d: "f" }],
            ["creative-endings", "Writing satisfying endings", "End stories with resolution, a twist or a cyclical return", "write"],
            ["writing-from-an-image", "Writing from an image", "Use a picture prompt to plan and structure a description", "write", { d: "f" }],
            ["dialogue-punctuation", "Writing dialogue", "Write and punctuate dialogue that reveals character", "accuracy"],
            ["crafting-imagery", "Crafting original imagery", "Create original similes, metaphors and personification and avoid clichés", "write", { d: "c" }],
            ["structural-devices-in-writing", "Using structure in your own writing", "Use one-line paragraphs, shifts in focus and cyclical endings deliberately", "write", { d: "c" }],
          ],
        },
        {
          subtopic: "Transactional writing",
          flags: { quiz: "english-language/persuasive-writing" },
          topics: [
            ["argument-writing", "Writing to argue", "Write an argument with a clear line, counter-argument and rebuttal", "write"],
            ["persuasive-writing", "Writing to persuade", "Use persuasive techniques deliberately and with restraint", "write"],
            ["writing-articles", "Writing articles", "Write a newspaper or magazine article with a headline, standfirst and engaging opening", "write"],
            ["writing-letters", "Writing letters", "Write formal letters with correct conventions and appropriate tone", "write", { d: "f" }],
            ["writing-speeches", "Writing speeches", "Write a speech that addresses its audience directly and builds to a strong ending", "write"],
            ["writing-leaflets-and-essays", "Writing leaflets and essays", "Use the conventions of leaflets and essays to inform and advise", "write"],
            ["writing-reviews", "Writing reviews", "Write a review that informs and gives a balanced judgement", "write", { coverage: "general" }],
            ["writing-reports", "Writing reports", "Write a report with a clear structure and an objective tone", "write", { coverage: "general" }],
            ["tone-and-register", "Tone and register", "Match formality and tone to the audience and purpose", "write"],
            ["counter-arguments", "Counter-arguments", "Acknowledge and rebut opposing views convincingly", "write", { d: "c" }],
            ["strong-conclusions", "Writing strong conclusions", "End transactional writing with a call to action or a memorable final thought", "write"],
            ["using-evidence-in-writing", "Using evidence and anecdote", "Support arguments with facts, statistics, expert opinion and anecdotes", "write"],
          ],
        },
        {
          subtopic: "Crafting and planning",
          topics: [
            ["planning-writing", "Planning in five minutes", "Plan a piece of writing quickly with a clear structure", "write", { d: "f" }],
            ["paragraphing", "Paragraphing", "Organise writing into paragraphs with topic sentences and linking", "write"],
            ["discourse-markers", "Discourse markers", "Use discourse markers to guide the reader through an argument", "write"],
            ["sentence-variety", "Sentence variety for effect", "Vary sentence openings, lengths and types for effect", "write"],
            ["ambitious-vocabulary", "Ambitious vocabulary", "Choose precise, ambitious vocabulary that suits the task", "write"],
            ["proofreading", "Proofreading", "Check and correct your writing in the final minutes", "accuracy", { d: "f" }],
            ["timed-writing", "Writing under timed conditions", "Plan, write and check a full response within the time allowed", "write", { d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Spelling, punctuation and grammar",
      groups: [
        {
          subtopic: "Punctuation",
          flags: { quiz: "english-language/grammar-punctuation" },
          topics: [
            ["sentence-demarcation", "Full stops and sentence demarcation", "Mark sentence boundaries correctly and avoid comma splices", "accuracy", { d: "f" }],
            ["commas", "Commas", "Use commas for lists, clauses and after fronted adverbials", "accuracy"],
            ["apostrophes", "Apostrophes", "Use apostrophes for contraction and possession correctly", "accuracy"],
            ["colons-and-semicolons", "Colons and semicolons", "Use colons and semicolons accurately and for effect", "accuracy"],
            ["dashes-brackets-ellipsis", "Dashes, brackets and ellipsis", "Use dashes, brackets and ellipsis for effect", "accuracy", { d: "c" }],
          ],
        },
        {
          subtopic: "Grammar and spelling",
          flags: { quiz: "english-language/word-classes-vocabulary" },
          topics: [
            ["word-classes", "Word classes", "Identify nouns, verbs, adjectives, adverbs, pronouns, prepositions and conjunctions", "recall", { d: "f" }],
            ["clauses", "Main and subordinate clauses", "Use main and subordinate clauses to build complex sentences", "accuracy"],
            ["sentence-types", "Simple, compound and complex sentences", "Identify and build simple, compound and complex sentences", "accuracy", { d: "f" }],
            ["tense-and-agreement", "Tense consistency and agreement", "Keep tense consistent and make subjects and verbs agree", "accuracy"],
            ["active-and-passive", "Active and passive voice", "Use the active and passive voice and explain their effects", "analyse"],
            ["cohesion", "Cohesion and pronoun reference", "Use pronouns and reference chains clearly so writing stays cohesive", "accuracy"],
            ["homophones", "Homophones", "Spell commonly confused homophones correctly", "accuracy", { quiz: "english-language/spelling-homophones" }],
            ["tricky-spellings", "Commonly misspelt words", "Spell commonly misspelt words and use spelling rules for prefixes and suffixes", "accuracy", { quiz: "english-language/spelling-homophones" }],
            ["standard-english", "Standard English", "Use Standard English and avoid non-standard forms in formal writing", "accuracy"],
            ["unfamiliar-vocabulary", "Working out unfamiliar words", "Use context, prefixes and word roots to work out unfamiliar vocabulary", "recall"],
          ],
        },
      ],
    },
    {
      area: "Spoken language",
      groups: [
        {
          subtopic: "Spoken language endorsement",
          topics: [
            ["presentation-skills", "Giving a presentation", "Plan and deliver a formal presentation in Standard English", "write"],
            ["responding-to-questions", "Responding to questions", "Listen and respond appropriately to questions and feedback", "write"],
            ["persuasive-speaking", "Speaking persuasively", "Use voice, pace, pause and emphasis to persuade an audience", "write"],
          ],
        },
      ],
    },
    {
      area: "AQA exam technique",
      groups: [
        { subtopic: "Paper 1: Explorations in creative reading and writing", topics: aqaPaper1 },
        { subtopic: "Paper 2: Writers' viewpoints and perspectives", topics: aqaPaper2 },
        {
          subtopic: "Timing and planning",
          flags: aqa(1),
          topics: [
            ["aqa-timing", "Timing both papers", "Divide your time across the reading and writing sections so every question is attempted", "evaluate", { p: "Papers 1 and 2" }],
            ["aqa-reading-the-source", "Reading the source efficiently", "Read and annotate the sources quickly before answering", "analyse", { p: "Papers 1 and 2" }],
          ],
        },
      ],
    },
  ],
};
