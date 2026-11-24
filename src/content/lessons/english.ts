import type { Lesson } from "@/domain/lesson";

/**
 * Exam Answer Coach lessons for English Language and English Literature.
 * Extracts in English Language lessons are written for Questlight. Literature quotations
 * are only taken from texts in the public domain (Shakespeare, Dickens).
 */
const STORM = "The wind came first, hurling itself at the windows like something that had been locked out too long. Then the rain: not falling, but thrown, in fistfuls, rattling the glass. Inside, the candle flinched. Mara pressed her back to the cold wall and listened to the old house groan, its beams creaking like the bones of a tired giant.";

export const ENGLISH_LANGUAGE_LESSONS: Record<string, Lesson> = {
  "word-level-analysis": {
    style: "analysis",
    summary: "Zoom in on single words and explore their connotations — the ideas and feelings they suggest — so you can explain precisely how a writer's word choices affect the reader.",
    knowledge: [
      "Denotation is a word's literal meaning; connotation is what it suggests.",
      "Strong verbs, adjectives and adverbs often carry the most meaning.",
      "Explain what the word suggests, then how it makes the reader feel or think.",
      "One well-chosen word, closely analysed, is worth more than a long quotation.",
    ],
    vocabulary: [
      { term: "Connotation", meaning: "An idea or feeling a word suggests beyond its literal meaning." },
      { term: "Verb", meaning: "An action or state word — often where the energy of a sentence is." },
    ],
    recognise: "Questions that ask 'how does the writer use language…' or point you to specific lines.",
    commandWords: [
      { word: "How does the writer…", meaning: "Explain the methods and their effects — not just what happens." },
      { word: "Analyse", meaning: "Pick apart the words and explain how they create meaning." },
    ],
    method: [
      { title: "Choose a powerful word", detail: "Look for verbs and adjectives that do more than describe." },
      { title: "Unpack its connotations", detail: "Ask: what does this word make me think of?" },
      { title: "Link to the effect", detail: "Say what the reader feels or understands because of it." },
      { title: "Link to the bigger picture", detail: "Connect the effect to the mood or the writer's purpose." },
    ],
    mistakes: [
      { tag: "technique_spotting", text: "Writing 'the writer uses a verb to create imagery' — which says nothing about this word." },
      { tag: "quotation_too_long", text: "Quoting a whole sentence instead of the key word." },
      { tag: "no_effect_on_reader", text: "Explaining what the word means but not its effect." },
    ],
    worked: {
      question: `Read this extract:\n\n“${STORM}”\n\nHow does the writer use language to make the storm seem threatening?`,
      marks: 4,
      steps: [
        {
          prompt: "Which word is the most powerful one to analyse?",
          choices: [
            { text: "\"hurling\"", correct: true, feedback: "Good choice — a violent verb you can explore in detail." },
            { text: "\"windows\"", correct: false, feedback: "A plain noun; there's little to analyse.", tag: "no_evidence" },
            { text: "The whole first sentence", correct: false, feedback: "Too long: you won't be able to analyse it closely.", tag: "quotation_too_long" },
          ],
          reveal: "Focus word: \"hurling\".",
        },
        {
          prompt: "What does \"hurling\" suggest?",
          choices: [
            { text: "Deliberate, aggressive force, as if the wind is attacking", correct: true, feedback: "Yes — the wind seems to throw itself with intent." },
            { text: "That it was windy", correct: false, feedback: "That's the literal meaning — go further.", tag: "no_effect_on_reader" },
            { text: "It is a verb", correct: false, feedback: "Naming the word class isn't analysis.", tag: "technique_spotting" },
          ],
          reveal: "\"Hurling\" suggests violent, deliberate force, as if the wind is attacking the house.",
        },
        {
          prompt: "Now link it to the reader and the rest of the extract.",
          choices: [
            { text: "The reader feels the house is under attack, which builds through the rain being 'thrown' — the storm seems alive and hostile", correct: true, feedback: "Excellent: effect, plus a link to a related word." },
            { text: "This makes it interesting for the reader", correct: false, feedback: "Too vague — what does the reader feel, and why?", tag: "no_effect_on_reader" },
          ],
          reveal: "The reader feels the house is besieged; together with the rain being 'thrown', the storm seems alive and hostile.",
        },
      ],
      finalAnswer: "The writer presents the storm as an attacker. The verb \"hurling\" suggests violent, deliberate force, as though the wind is throwing itself at the house. This makes the reader feel the characters are under siege, an idea reinforced when the rain is \"thrown, in fistfuls\", as if the storm is a living enemy.",
    },
    guided: [
      {
        question: `In the extract, the candle "flinched". Which effect does this word create best?`,
        marks: 1,
        answer: { type: "choice", options: ["It shows the candle was badly made", "It personifies the candle as frightened, reflecting Mara's fear", "It shows the room was bright", "It shows it was night"], correct: 1 },
        hints: ["Who usually flinches?", "If an object reacts like a frightened person, what does that suggest about the mood?"],
        solution: "Personification: the candle reacts like a frightened person, mirroring Mara's fear.",
      },
    ],
    exam: [
      {
        question: `Using the extract, write a paragraph analysing how the writer presents the house in the final sentence ("Inside, the candle flinched… tired giant").`,
        marks: 4,
        answer: { type: "extended" },
        markScheme: [
          { point: "Makes a clear point about how the house is presented (e.g. old, weak, alive)", marks: 1 },
          { point: "Uses a short, well-chosen quotation (e.g. \"groan\", \"bones of a tired giant\")", marks: 1 },
          { point: "Explores the connotations of specific words", marks: 1 },
          { point: "Explains the effect on the reader / links to the mood of the extract", marks: 1 },
        ],
        modelAnswer: "The writer presents the house as old and vulnerable. The verb \"groan\" personifies it as if it is in pain under the storm's attack, and the simile \"like the bones of a tired giant\" suggests something huge but worn out, close to collapse. This makes the reader worry that the house — Mara's only shelter — may not survive, increasing the tension.",
        mistakeTags: ["technique_spotting", "no_effect_on_reader", "quotation_too_long"],
      },
    ],
  },

  "what-how-why": {
    style: "analysis",
    summary: "Build analytical paragraphs in three moves: WHAT the writer is doing, HOW they do it (with evidence and a method), and WHY — the effect on the reader and the writer's purpose.",
    knowledge: [
      "WHAT: a clear point that answers the question.",
      "HOW: short evidence plus the method, analysed closely.",
      "WHY: the effect on the reader and the writer's purpose.",
      "Each paragraph should go deeper than the last, not just add another example.",
    ],
    vocabulary: [{ term: "Topic sentence", meaning: "The opening sentence that states the paragraph's point." }],
    recognise: "Any analysis question in English Language or Literature.",
    commandWords: [{ word: "How", meaning: "Focus on methods and effects, not retelling the story." }],
    method: [
      { title: "What", detail: "Start with a point that uses the question's words." },
      { title: "How", detail: "Embed a short quotation and name the method if it helps." },
      { title: "Zoom in", detail: "Analyse one or two words in detail." },
      { title: "Why", detail: "Explain the effect on the reader and why the writer wanted it." },
    ],
    mistakes: [
      { tag: "not_linked_to_question", text: "A point that doesn't answer the question asked." },
      { tag: "description_not_explanation", text: "Retelling what happens instead of analysing how." },
      { tag: "no_effect_on_reader", text: "Stopping after the evidence." },
    ],
    worked: {
      question: `Using the storm extract (“${STORM.slice(0, 60)}…”), build a paragraph answering: How does the writer create tension?`,
      marks: 4,
      steps: [
        {
          prompt: "Choose the best WHAT (topic sentence).",
          choices: [
            { text: "The writer creates tension by presenting the storm as a violent intruder trying to get in.", correct: true, feedback: "Clear, uses the question's word 'tension', and sets up the analysis." },
            { text: "In this extract there is a storm and Mara is inside.", correct: false, feedback: "This retells events rather than making a point.", tag: "description_not_explanation" },
            { text: "The writer uses lots of techniques.", correct: false, feedback: "Too vague to analyse.", tag: "not_linked_to_question" },
          ],
          reveal: "WHAT: The writer creates tension by presenting the storm as a violent intruder trying to get in.",
        },
        {
          prompt: "Choose the best HOW.",
          choices: [
            { text: "The simile \"like something that had been locked out too long\" makes the wind seem desperate to get inside.", correct: true, feedback: "Short evidence, method and a precise interpretation." },
            { text: "The writer says \"The wind came first, hurling itself at the windows like something that had been locked out too long.\"", correct: false, feedback: "Too long and no analysis yet.", tag: "quotation_too_long" },
          ],
          reveal: "HOW: The simile \"like something that had been locked out too long\" makes the wind seem desperate to get in.",
        },
        {
          prompt: "Choose the best WHY.",
          choices: [
            { text: "This makes the reader fear what will happen if it breaks in, so we share Mara's sense of being trapped.", correct: true, feedback: "Effect on the reader, linked to the character." },
            { text: "This is effective.", correct: false, feedback: "Say what it does to the reader.", tag: "no_effect_on_reader" },
          ],
          reveal: "WHY: The reader fears what will happen if it gets in, sharing Mara's sense of being trapped.",
        },
      ],
      finalAnswer: "The writer creates tension by presenting the storm as a violent intruder. The simile \"like something that had been locked out too long\" suggests the wind is desperate, even resentful, as if it has a right to come in. This makes the reader fear what will happen if it breaks through, so we share Mara's sense of being trapped.",
    },
    guided: [
      {
        question: "Which part of a WHAT-HOW-WHY paragraph is this? “This makes the reader feel uneasy, because the storm seems to have a will of its own.”",
        marks: 1,
        answer: { type: "choice", options: ["What", "How", "Why"], correct: 2 },
        hints: ["Is it the point, the evidence, or the effect?", "It talks about the reader."],
        solution: "It's the WHY: the effect on the reader.",
      },
    ],
    exam: [
      {
        question: "Write one WHAT-HOW-WHY paragraph about how the writer presents Mara in the storm extract.",
        marks: 6,
        answer: { type: "extended" },
        markScheme: [
          { point: "WHAT: a clear point about Mara (e.g. frightened, isolated, vulnerable)", marks: 1 },
          { point: "HOW: short, embedded evidence (e.g. \"pressed her back to the cold wall\")", marks: 1 },
          { point: "Analysis of specific word choices", marks: 2 },
          { point: "WHY: effect on the reader", marks: 1 },
          { point: "Links to the writer's purpose or the wider extract", marks: 1 },
        ],
        modelAnswer: "Mara is presented as vulnerable and alone. She \"pressed her back to the cold wall\", which suggests she is retreating as far as possible from the storm; the adjective \"cold\" shows even the house offers no comfort. The reader feels protective of her, and because she only \"listened\", she seems powerless against the storm's noise — the writer builds tension by keeping her passive while the storm acts.",
        mistakeTags: ["description_not_explanation", "no_effect_on_reader", "weak_structure"],
      },
    ],
  },

  "argument-writing": {
    style: "evaluation",
    summary: "Write a convincing argument: a clear viewpoint from the first line, logically ordered paragraphs, evidence, a counter-argument you knock down, and an ending that stays with the reader.",
    knowledge: [
      "Decide your view before you plan — and stick to it.",
      "Each paragraph makes one point, supported by evidence or an example.",
      "A counter-argument and rebuttal makes your argument stronger, not weaker.",
      "Match tone and form to the audience: an article reads differently from a speech.",
      "Accuracy and varied sentences are marked too.",
    ],
    vocabulary: [
      { term: "Rebuttal", meaning: "Showing why an opposing argument is weaker than yours." },
      { term: "Discourse marker", meaning: "Words that guide the reader, such as 'furthermore' or 'however'." },
    ],
    recognise: "A statement to respond to, with a form (article, letter, speech, essay) and an audience.",
    commandWords: [{ word: "Write… arguing/explaining your point of view", meaning: "Take a clear position and support it." }],
    method: [
      { title: "Decode the task", detail: "Underline the form, audience and purpose." },
      { title: "Plan 4–5 points", detail: "Order them so the strongest comes last, with a counter-argument before it." },
      { title: "Hook", detail: "Open with an anecdote, a striking fact or a bold statement." },
      { title: "Develop", detail: "Each paragraph: point, evidence, why it matters." },
      { title: "End strongly", detail: "Return to your opening or call the reader to act." },
    ],
    mistakes: [
      { tag: "weak_structure", text: "Listing points without an order or links between them." },
      { tag: "one_sided", text: "Ignoring the other side, so the argument seems naive." },
      { tag: "spag_errors", text: "Comma splices and missing apostrophes — save time to proofread." },
    ],
    worked: {
      question: "'Homework should be banned for all secondary school students.' Write an article for a newspaper in which you argue for or against this statement.",
      marks: 40,
      steps: [
        {
          prompt: "Which opening is the strongest hook?",
          choices: [
            { text: "It's 10.47pm. Sam has finished his third worksheet of the night, and his eyes are closing over a page he no longer understands.", correct: true, feedback: "An anecdote puts the reader in the situation straight away." },
            { text: "In this article I am going to argue about homework.", correct: false, feedback: "Announcing what you'll do wastes your opening.", tag: "weak_structure" },
          ],
          reveal: "Open with a short anecdote.",
        },
        {
          prompt: "Where should the counter-argument go?",
          choices: [
            { text: "Just before your strongest point, so you can rebut it and finish on strength", correct: true, feedback: "Yes — acknowledge, rebut, then land your best point." },
            { text: "Leave it out — it weakens your case", correct: false, feedback: "Ignoring it makes your argument seem one-sided.", tag: "one_sided" },
          ],
          reveal: "Counter-argument and rebuttal come before the final point.",
        },
        {
          prompt: "Which ending is strongest?",
          choices: [
            { text: "Return to Sam: imagine him asleep by ten, ready to learn tomorrow. That's the school day we should be fighting for.", correct: true, feedback: "A cyclical ending ties the piece together." },
            { text: "In conclusion, that is why homework should be banned.", correct: false, feedback: "Flat: it repeats rather than persuades.", tag: "weak_structure" },
          ],
          reveal: "End by returning to the opening image with a call to action.",
        },
      ],
      finalAnswer: "Plan: anecdote hook → point 1 (wellbeing) → point 2 (inequality of home support) → counter-argument (practice matters) and rebuttal (practice works better in school) → strongest point (rest improves learning) → cyclical ending with a call to action.",
    },
    guided: [
      {
        question: "Which sentence is the best rebuttal of 'Homework helps students practise'?",
        marks: 1,
        answer: { type: "choice", options: ["Practice is boring.", "Of course practice matters — but it works best in lessons, where a teacher can spot mistakes before they become habits.", "Homework is bad.", "Some people like homework."], correct: 1 },
        hints: ["A rebuttal accepts part of the point, then shows why it doesn't win.", "Look for 'but' with a reason."],
        solution: "The second option concedes the point and then gives a reason it doesn't justify homework.",
      },
    ],
    exam: [
      {
        question: "'Young people spend too much time on their phones.' Write the opening two paragraphs of a speech to your year group arguing your view.",
        marks: 8,
        answer: { type: "extended" },
        markScheme: [
          { point: "Clear viewpoint established early", marks: 1 },
          { point: "Engaging hook suited to a speech (direct address, anecdote, question)", marks: 2 },
          { point: "A developed point with evidence or example", marks: 2 },
          { point: "Tone and register suit the audience", marks: 1 },
          { point: "Varied sentences and accurate spelling and punctuation", marks: 2 },
        ],
        modelAnswer: "Hands up if you checked your phone before you'd even got out of bed this morning. Look around — that's most of us. I'm not here to tell you phones are evil; I'm here to ask who's really in charge.\n\nEvery app on your screen was designed by people whose job is to keep you scrolling. The longer you stay, the more they earn. So when you lose an evening to videos you won't remember tomorrow, that isn't a lack of willpower — it's a business plan working exactly as intended.",
        mistakeTags: ["weak_structure", "spag_errors", "one_sided"],
      },
    ],
  },
};

export const ENGLISH_LITERATURE_LESSONS: Record<string, Lesson> = {
  "thesis-statements": {
    style: "evaluation",
    summary: "Open every literature essay with a thesis: a one- or two-sentence argument that answers the question, names the writer's purpose and gives your essay a direction to follow.",
    knowledge: [
      "A thesis answers the question directly — it's an argument, not a summary.",
      "Good theses mention the writer and what they wanted the audience to think.",
      "Each paragraph should prove part of the thesis.",
      "Words like 'ultimately', 'initially… but' and 'Dickens uses… to' help build a developing argument.",
    ],
    vocabulary: [{ term: "Thesis", meaning: "The central argument of your essay." }],
    recognise: "Any essay question: 'How does the writer present…', 'Explore how…'.",
    commandWords: [{ word: "Explore", meaning: "Consider more than one idea or interpretation." }],
    method: [
      { title: "Find the key word", detail: "Underline the character or theme in the question." },
      { title: "Decide what the writer wants us to think", detail: "What is the writer's message about it?" },
      { title: "Show development", detail: "How does the character or theme change across the text?" },
      { title: "Write it in two sentences", detail: "Then plan paragraphs that each prove a part of it." },
    ],
    mistakes: [
      { tag: "description_not_explanation", text: "A thesis that summarises the plot." },
      { tag: "not_linked_to_question", text: "A thesis about the whole text rather than the question's focus." },
    ],
    worked: {
      question: "How does Dickens present Scrooge as a character who changes in 'A Christmas Carol'?",
      marks: 4,
      steps: [
        {
          prompt: "Which is the best thesis?",
          choices: [
            { text: "Dickens presents Scrooge's transformation from isolated miser to generous member of society to show his Victorian readers that anyone can change — and that the wealthy have a duty to.", correct: true, feedback: "An argument, with the writer's purpose and context." },
            { text: "Scrooge is mean at the start and nice at the end.", correct: false, feedback: "A plot summary, not an argument.", tag: "description_not_explanation" },
            { text: "Dickens uses lots of language techniques to present Scrooge.", correct: false, feedback: "This gives the essay no direction.", tag: "not_linked_to_question" },
          ],
          reveal: "Thesis chosen.",
        },
        {
          prompt: "Which paragraph plan best follows the thesis?",
          choices: [
            { text: "1. Scrooge's isolation in Stave 1 → 2. the ghosts force him to see the poor → 3. his generosity in Stave 5 as Dickens's model for readers", correct: true, feedback: "Each paragraph proves a stage of the change." },
            { text: "1. Similes → 2. Metaphors → 3. Adjectives", correct: false, feedback: "Organising by technique loses the argument.", tag: "weak_structure" },
          ],
          reveal: "Plan: isolation → confrontation → redemption.",
        },
      ],
      finalAnswer: "Thesis: Dickens presents Scrooge's transformation from isolated miser to generous member of society to show his readers that anyone can change, and that the wealthy have a responsibility to. Plan: isolation (Stave 1) → confrontation with poverty (Staves 2–4) → redemption (Stave 5).",
    },
    guided: [
      {
        question: "Which word makes a thesis sound like an argument rather than a description?",
        marks: 1,
        answer: { type: "choice", options: ["happens", "to show", "then", "also"], correct: 1 },
        hints: ["An argument explains the writer's purpose.", "Look for the phrase that introduces a reason."],
        solution: "'To show' introduces the writer's purpose.",
      },
    ],
    exam: [
      {
        question: "Write a thesis statement for: 'How does Shakespeare present ambition in Macbeth?'",
        marks: 4,
        answer: { type: "extended" },
        markScheme: [
          { point: "Answers the question directly (about ambition)", marks: 1 },
          { point: "Presents an argument rather than a summary", marks: 1 },
          { point: "Refers to Shakespeare's purpose or message", marks: 1 },
          { point: "Suggests development or more than one interpretation", marks: 1 },
        ],
        modelAnswer: "Shakespeare presents ambition as a force that begins as a private desire but grows into a destructive obsession, warning his Jacobean audience that ambition which defies the natural order leads only to guilt, isolation and death.",
        mistakeTags: ["description_not_explanation", "no_context_link"],
      },
    ],
  },

  "macbeth-ambition": {
    style: "analysis",
    summary: "Explore how Shakespeare presents ambition as the force that drives Macbeth to murder, and how it destroys him and Lady Macbeth — with short quotations and context about the divine right of kings.",
    knowledge: [
      "Macbeth's ambition is awakened by the witches' prophecy and pushed by Lady Macbeth.",
      "In Act 1 he admits his ambition is \"vaulting\" and has no other spur — he has no good reason to kill Duncan.",
      "He hides his \"black and deep desires\" — ambition is shown as dark and secret.",
      "Jacobean audiences believed kings were chosen by God; killing one broke the natural order.",
      "By the end, ambition leaves Macbeth isolated and seeing life as meaningless.",
    ],
    vocabulary: [
      { term: "Tragic hero", meaning: "A great character whose flaw leads to their downfall." },
      { term: "Hamartia", meaning: "The fatal flaw of a tragic hero — here, ambition." },
      { term: "Divine right of kings", meaning: "The belief that monarchs are appointed by God." },
    ],
    recognise: "Questions on ambition, power, Macbeth's or Lady Macbeth's character, or the extract around Act 1 scenes 3–7.",
    commandWords: [{ word: "Starting with this extract, explore…", meaning: "Analyse the extract, then link to the whole play." }],
    method: [
      { title: "Thesis", detail: "Ambition as a destructive force that breaks the natural order." },
      { title: "Extract", detail: "Analyse two or three short quotations closely." },
      { title: "Whole play", detail: "Trace how ambition changes Macbeth and Lady Macbeth." },
      { title: "Context", detail: "Link to the divine right of kings and James I." },
    ],
    mistakes: [
      { tag: "no_context_link", text: "Mentioning context in a separate paragraph instead of linking it to the analysis." },
      { tag: "quotation_too_long", text: "Copying out long speeches rather than picking key words." },
      { tag: "description_not_explanation", text: "Retelling the plot." },
    ],
    worked: {
      question: "Macbeth says: \"I have no spur / To prick the sides of my intent, but only / Vaulting ambition, which o'erleaps itself / And falls on th'other.\" How does Shakespeare present ambition here?",
      marks: 6,
      steps: [
        {
          prompt: "What is Macbeth admitting?",
          choices: [
            { text: "He has no good reason to kill Duncan — only his ambition", correct: true, feedback: "Yes: the 'spur' that should drive him is missing." },
            { text: "He is going to ride a horse", correct: false, feedback: "The horse riding is a metaphor.", tag: "description_not_explanation" },
          ],
          reveal: "Macbeth admits ambition is his only motive.",
        },
        {
          prompt: "Which word is best to analyse?",
          choices: [
            { text: "\"Vaulting\"", correct: true, feedback: "It suggests leaping too high." },
            { text: "\"I\"", correct: false, feedback: "Pick a word with rich connotations.", tag: "no_evidence" },
          ],
          reveal: "\"Vaulting\" suggests a rider leaping too high over an obstacle.",
        },
        {
          prompt: "What's the best analysis and context link?",
          choices: [
            { text: "Like a rider who jumps too far and falls, ambition will cause Macbeth's downfall — foreshadowing that overreaching against God's chosen king will be punished.", correct: true, feedback: "Analysis, foreshadowing and context, all linked." },
            { text: "Shakespeare uses a metaphor. In Jacobean times people believed in kings.", correct: false, feedback: "Technique-spotting and bolted-on context.", tag: "no_context_link" },
          ],
          reveal: "Ambition is presented as self-destructive, foreshadowing his fall.",
        },
      ],
      finalAnswer: "Shakespeare presents ambition as self-destructive. Macbeth admits he has no \"spur\" except \"vaulting ambition\", picturing a rider who leaps so high he \"falls on th'other\" side. This foreshadows his downfall, warning a Jacobean audience that overreaching against a king chosen by God breaks the natural order and will be punished.",
    },
    guided: [
      {
        question: "Which belief would make a Jacobean audience see Duncan's murder as especially shocking?",
        marks: 1,
        answer: { type: "choice", options: ["The divine right of kings", "Democracy", "Germ theory", "The Poor Law"], correct: 0 },
        hints: ["Who did people think chose the king?", "Killing the king was like going against God."],
        solution: "The divine right of kings: killing Duncan was a crime against God's order.",
      },
    ],
    exam: [
      {
        question: "How does Shakespeare present the consequences of ambition in Macbeth? Write about the play as a whole.",
        marks: 12,
        answer: { type: "extended" },
        markScheme: [
          { point: "A clear argument (thesis) about the consequences of ambition", marks: 2 },
          { point: "Well-chosen, short quotations from across the play", marks: 2 },
          { point: "Close analysis of language and its effects", marks: 3 },
          { point: "Dramatic methods (e.g. soliloquy, structure, foreshadowing)", marks: 2 },
          { point: "Context linked to the analysis (e.g. divine right, Jacobean beliefs)", marks: 2 },
          { point: "Coherent structure and accurate writing", marks: 1 },
        ],
        modelAnswer: "Shakespeare presents ambition as leading to guilt, isolation and despair. Early on, Macbeth's ambition makes him hide his \"black and deep desires\", showing it as something shameful. After the murder, guilt fills him with visions and sleeplessness — Macbeth \"does murder sleep\". Lady Macbeth's ambition collapses into the sleepwalking scene, where she cannot wash out the \"damned spot\". By Act 5, Macbeth sees life as \"a tale told by an idiot\": his ambition has destroyed all meaning. For a Jacobean audience who believed in the divine right of kings, this downfall shows the natural order being restored.",
        mistakeTags: ["no_context_link", "description_not_explanation", "weak_structure"],
      },
    ],
  },

  "aic-responsibility": {
    style: "analysis",
    summary: "Explore how Priestley uses An Inspector Calls to argue for collective social responsibility, contrasting the older Birlings' selfishness with the younger generation's capacity to change.",
    knowledge: [
      "Each Birling contributes to Eva Smith's death; no single person is entirely to blame — that's the point.",
      "The Inspector acts as Priestley's voice, arguing that we are all responsible for each other.",
      "Mr and Mrs Birling refuse to accept responsibility; Sheila and Eric are changed by the evening.",
      "The play is set in 1912 but was first performed in 1945, when Britain was building the welfare state.",
      "The final phone call means the Birlings cannot escape the lesson.",
    ],
    vocabulary: [
      { term: "Collective responsibility", meaning: "The idea that society shares responsibility for how its members are treated." },
      { term: "Dramatic irony", meaning: "When the audience knows something the characters don't." },
      { term: "Mouthpiece", meaning: "A character who expresses the writer's views." },
    ],
    recognise: "Questions on responsibility, the Inspector, class, generations, or how Priestley presents a Birling.",
    commandWords: [{ word: "How does Priestley present…", meaning: "Focus on Priestley's methods and message." }],
    method: [
      { title: "Thesis", detail: "Priestley contrasts those who accept and refuse responsibility to persuade his 1945 audience." },
      { title: "Older generation", detail: "Show how Mr and Mrs Birling deny responsibility." },
      { title: "Younger generation", detail: "Show how Sheila and Eric change." },
      { title: "Methods", detail: "Dramatic irony, the Inspector's role, the ending." },
      { title: "Context", detail: "1912 setting vs 1945 audience." },
    ],
    mistakes: [
      { tag: "description_not_explanation", text: "Retelling each Birling's involvement in order." },
      { tag: "no_context_link", text: "Forgetting the 1912/1945 contrast." },
      { tag: "not_linked_to_question", text: "Writing about characters without linking back to responsibility." },
    ],
    worked: {
      question: "How does Priestley use Mr Birling to present ideas about responsibility?",
      marks: 6,
      steps: [
        {
          prompt: "What's the strongest point to start with?",
          choices: [
            { text: "Priestley makes Mr Birling's rejection of social responsibility look foolish, so the audience rejects his views too.", correct: true, feedback: "An argument about Priestley's purpose." },
            { text: "Mr Birling is a businessman who sacked Eva Smith.", correct: false, feedback: "That's plot, not an argument.", tag: "description_not_explanation" },
          ],
          reveal: "Point: Priestley makes Birling's views look foolish.",
        },
        {
          prompt: "Which method best supports this?",
          choices: [
            { text: "Dramatic irony: Birling confidently predicts there will be no war and calls the Titanic unsinkable, which the 1945 audience knows is wrong.", correct: true, feedback: "If he is wrong about these, the audience doubts his views on responsibility too." },
            { text: "He has a lot of lines.", correct: false, feedback: "Not a meaningful method.", tag: "technique_spotting" },
          ],
          reveal: "Dramatic irony undermines Birling.",
        },
        {
          prompt: "How do you link to context?",
          choices: [
            { text: "Watching in 1945, after two world wars, the audience is encouraged to reject Birling's selfish capitalism and support a fairer society.", correct: true, feedback: "Context woven into the purpose." },
            { text: "Priestley was born in 1894.", correct: false, feedback: "A fact that isn't linked to the question.", tag: "no_context_link" },
          ],
          reveal: "Context: the 1945 audience.",
        },
      ],
      finalAnswer: "Priestley uses dramatic irony to make Mr Birling's rejection of social responsibility look foolish. His confident predictions that there will be no war and that the Titanic is unsinkable are known to be wrong by the 1945 audience, so they also doubt his insistence that a man should look after only himself and his family. After two world wars, Priestley encourages his audience to reject Birling's selfish capitalism.",
    },
    guided: [
      {
        question: "When was An Inspector Calls first performed?",
        marks: 1,
        answer: { type: "choice", options: ["1912", "1945", "1918", "1960"], correct: 1 },
        hints: ["It's set before the First World War…", "…but first performed just after the Second."],
        solution: "1945, though it is set in 1912.",
      },
    ],
    exam: [
      {
        question: "How does Priestley present Sheila as a character who learns to accept responsibility?",
        marks: 12,
        answer: { type: "extended" },
        markScheme: [
          { point: "Clear thesis about Sheila's development and Priestley's purpose", marks: 2 },
          { point: "Evidence from the start and end of the play", marks: 2 },
          { point: "Analysis of language and dramatic methods (stage directions, contrast with her parents)", marks: 3 },
          { point: "Links to the theme of responsibility and generations", marks: 2 },
          { point: "Context woven in (1912/1945, gender, class)", marks: 2 },
          { point: "Coherent structure and accurate writing", marks: 1 },
        ],
        modelAnswer: "Priestley presents Sheila's journey from a sheltered, privileged girl to someone who accepts her share of responsibility, making her a model for his audience. At first her concerns are trivial and she is excited by Gerald's ring. When she learns how her jealousy cost Eva her job at the shop, she is genuinely ashamed and promises never to act that way again. By the end she refuses to pretend nothing has happened, unlike her parents, and the contrast suggests Priestley's hope lies with the young. For a 1945 audience, Sheila shows that people — and women in particular — can challenge the attitudes of their elders.",
        mistakeTags: ["description_not_explanation", "no_context_link", "not_linked_to_question"],
      },
    ],
  },
};
