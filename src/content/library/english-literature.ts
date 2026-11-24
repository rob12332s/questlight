import type { LibraryGroup, SubjectLibrary, TopicTuple } from "./types";

/**
 * GCSE English Literature. Knowledge of a set text is the same whichever board sets it,
 * so text topics are "general" and carry the text as an option: students only see the
 * texts they study (chosen in their course settings). Paper-by-paper technique is
 * board-specific; AQA 8702 is included because its set-text list has been checked.
 * Edexcel and OCR technique is planned.
 */
const text = (opt: string, subtopic: string, topics: TopicTuple[], quiz?: string): LibraryGroup => ({
  subtopic,
  flags: { opt, coverage: "general", ...(quiz ? { quiz } : {}) },
  topics,
});

export const ENGLISH_LITERATURE_LIBRARY: SubjectLibrary = {
  subject: "english-literature",
  defaults: { coverage: "shared", verification: "awaiting_verification" },
  areas: [
    {
      area: "Shakespeare",
      groups: [
        text("macbeth", "Macbeth", [
          ["macbeth-plot", "Macbeth: plot and structure", "Know the plot of Macbeth act by act and how its structure builds tragedy", "recall", { d: "f" }],
          ["macbeth-character", "Macbeth's character", "Trace Macbeth's change from brave soldier to tyrant and explain what drives it", "analyse"],
          ["lady-macbeth", "Lady Macbeth", "Analyse how Lady Macbeth is presented and how she changes", "analyse"],
          ["banquo-and-macduff", "Banquo and Macduff", "Explain how Banquo and Macduff act as foils to Macbeth", "analyse"],
          ["macbeth-ambition", "Ambition in Macbeth", "Explore how Shakespeare presents ambition and its consequences", "analyse"],
          ["macbeth-supernatural", "The supernatural", "Analyse the witches, visions and the supernatural and link them to Jacobean beliefs", "context"],
          ["macbeth-guilt", "Guilt and conscience", "Explore how guilt is presented through imagery of blood, sleep and hands", "analyse"],
          ["macbeth-kingship", "Kingship and the divine right of kings", "Compare good and bad kingship and link it to James I and the Gunpowder Plot", "context"],
          ["macbeth-gender", "Gender and masculinity", "Explore how Shakespeare presents masculinity and challenges gender roles", "analyse", { d: "c" }],
          ["macbeth-quotations", "Macbeth: key quotations", "Learn and analyse short key quotations from Macbeth for each character and theme", "recall"],
          ["macbeth-extract-to-whole", "Macbeth: from extract to whole play", "Move from analysing the extract to linking it with the whole play", "analyse", { d: "c" }],
          ["macbeth-dramatic-methods", "Dramatic methods in Macbeth", "Analyse soliloquy, dramatic irony and the use of verse and prose", "analyse"],
        ], "english-literature/macbeth"),
        text("romeo-and-juliet", "Romeo and Juliet", [
          ["rj-plot", "Romeo and Juliet: plot and structure", "Know the plot and how the prologue and fast pace shape the tragedy", "recall", { d: "f" }],
          ["rj-romeo", "Romeo", "Analyse how Romeo is presented and how he changes", "analyse"],
          ["rj-juliet", "Juliet", "Analyse Juliet's growth from obedient daughter to decisive young woman", "analyse"],
          ["rj-love", "Love in Romeo and Juliet", "Compare the types of love presented in the play", "analyse"],
          ["rj-conflict", "Conflict and violence", "Explore how conflict drives the tragedy", "analyse"],
          ["rj-fate", "Fate and free will", "Explore the role of fate and the characters' own choices", "evaluate", { d: "c" }],
          ["rj-family-and-society", "Family, honour and society", "Link the presentation of family and honour to Elizabethan expectations", "context"],
          ["rj-minor-characters", "Mercutio, the Nurse and Friar Laurence", "Explain how minor characters shape events and themes", "analyse"],
          ["rj-quotations", "Romeo and Juliet: key quotations", "Learn and analyse short key quotations from Romeo and Juliet for each character and theme", "recall"],
        ], "english-literature/romeo-and-juliet"),
        text("the-tempest", "The Tempest", [
          ["tempest-plot", "The Tempest: plot and characters", "Know the plot and the roles of Prospero, Miranda, Ariel and Caliban", "recall", { d: "f" }],
          ["tempest-power", "Power and control in The Tempest", "Explore how power, control and colonisation are presented", "analyse"],
          ["tempest-forgiveness", "Forgiveness and reconciliation", "Explore how the play moves from revenge to forgiveness", "analyse"],
        ]),
        text("merchant-of-venice", "The Merchant of Venice", [
          ["merchant-plot", "The Merchant of Venice: plot and characters", "Know the plot and the roles of Shylock, Antonio, Portia and Bassanio", "recall", { d: "f" }],
          ["merchant-prejudice", "Prejudice and justice", "Explore how prejudice, mercy and justice are presented and how audiences' views have changed", "context"],
          ["merchant-portia", "Portia and gender", "Analyse how Portia is presented and how she challenges expectations", "analyse"],
        ]),
        text("much-ado", "Much Ado About Nothing", [
          ["much-ado-plot", "Much Ado About Nothing: plot and characters", "Know the plot and the paired stories of Beatrice and Benedick and Hero and Claudio", "recall", { d: "f" }],
          ["much-ado-deception", "Deception in Much Ado", "Explore how deception drives both comedy and near-tragedy", "analyse"],
          ["much-ado-gender", "Gender and honour", "Explore gender, honour and reputation in Messina", "context"],
        ]),
        text("julius-caesar", "Julius Caesar", [
          ["caesar-plot", "Julius Caesar: plot and characters", "Know the plot and the roles of Caesar, Brutus, Cassius and Antony", "recall", { d: "f" }],
          ["caesar-power", "Power, ambition and loyalty", "Explore how power, ambition and loyalty are presented", "analyse"],
          ["caesar-rhetoric", "Rhetoric and persuasion", "Compare the persuasive methods of Brutus's and Antony's speeches", "compare", { d: "c" }],
        ]),
      ],
    },
    {
      area: "19th-century novel",
      groups: [
        text("christmas-carol", "A Christmas Carol", [
          ["acc-plot", "A Christmas Carol: plot and structure", "Know the plot stave by stave and how the structure shows Scrooge's change", "recall", { d: "f" }],
          ["acc-scrooge", "Scrooge's transformation", "Trace how Dickens presents Scrooge's transformation", "analyse"],
          ["acc-ghosts", "The ghosts", "Explain the role and presentation of each ghost", "analyse"],
          ["acc-cratchits", "The Cratchits and Tiny Tim", "Analyse how the Cratchit family is used to present poverty and family", "analyse"],
          ["acc-poverty", "Poverty and social responsibility", "Explore Dickens's message about poverty and responsibility", "analyse"],
          ["acc-victorian-context", "Victorian context", "Link the novella to the Poor Law, workhouses and Malthus", "context"],
          ["acc-christmas-family", "Christmas, family and redemption", "Explore how Christmas and family symbolise generosity and redemption", "analyse"],
          ["acc-ignorance-and-want", "Ignorance and Want", "Analyse the allegorical children Ignorance and Want", "analyse", { d: "c" }],
          ["acc-quotations", "A Christmas Carol: key quotations", "Learn and analyse short key quotations from A Christmas Carol for each character and theme", "recall"],
          ["acc-dickens-methods", "Dickens's methods", "Analyse Dickens's narrator, imagery, pathetic fallacy and allegory", "analyse"],
        ], "english-literature/a-christmas-carol"),
        text("jekyll-and-hyde", "The Strange Case of Dr Jekyll and Mr Hyde", [
          ["jh-plot", "Jekyll and Hyde: plot and structure", "Know the plot and how multiple narrators and withheld information create mystery", "recall", { d: "f" }],
          ["jh-jekyll", "Dr Jekyll", "Analyse how Jekyll is presented and why he creates Hyde", "analyse"],
          ["jh-hyde", "Mr Hyde", "Analyse how Hyde is presented as primitive and frightening", "analyse"],
          ["jh-utterson", "Utterson and the other gentlemen", "Explain the role of Utterson, Lanyon and Enfield", "analyse"],
          ["jh-duality", "Duality of human nature", "Explore how Stevenson presents the duality of human nature", "analyse"],
          ["jh-reputation", "Reputation and secrecy", "Explore how Victorian respectability leads to repression and secrecy", "context"],
          ["jh-science-and-religion", "Science and religion", "Link the novella to Darwin, degeneration and Victorian science", "context", { d: "c" }],
          ["jh-setting", "Setting and the gothic", "Analyse how London, fog and doors create a gothic atmosphere", "analyse"],
          ["jh-quotations", "Jekyll and Hyde: key quotations", "Learn and analyse short key quotations from Jekyll and Hyde for each character and theme", "recall"],
        ], "english-literature/jekyll-and-hyde"),
        text("great-expectations", "Great Expectations", [
          ["ge-plot", "Great Expectations: plot and characters", "Know the plot and Pip's relationships with Magwitch, Miss Havisham, Estella and Joe", "recall", { d: "f" }],
          ["ge-class", "Social class and ambition", "Explore how Dickens presents class, ambition and what makes a gentleman", "context"],
          ["ge-guilt-and-redemption", "Guilt and redemption", "Trace Pip's guilt and moral growth", "analyse"],
        ]),
        text("jane-eyre", "Jane Eyre", [
          ["je-plot", "Jane Eyre: plot and characters", "Know the plot and Jane's journey from Gateshead to Ferndean", "recall", { d: "f" }],
          ["je-independence", "Independence and identity", "Explore how Brontë presents Jane's search for independence", "analyse"],
          ["je-gender-and-class", "Gender and class", "Link the novel's presentation of women and class to Victorian society", "context"],
        ]),
        text("frankenstein", "Frankenstein", [
          ["frank-plot", "Frankenstein: plot and narrative frame", "Know the plot and how the nested narratives work", "recall", { d: "f" }],
          ["frank-creature", "The creature", "Analyse how the creature is presented and how the reader's sympathy shifts", "analyse"],
          ["frank-ambition-science", "Ambition and responsibility", "Explore dangerous ambition and scientific responsibility", "context"],
          ["frank-isolation", "Isolation and rejection", "Explore how isolation shapes both Victor and the creature", "analyse"],
        ]),
        text("pride-and-prejudice", "Pride and Prejudice", [
          ["pp-plot", "Pride and Prejudice: plot and characters", "Know the plot and the relationship between Elizabeth and Darcy", "recall", { d: "f" }],
          ["pp-marriage", "Marriage and money", "Explore attitudes to marriage, money and class in Regency England", "context"],
          ["pp-irony", "Austen's irony", "Analyse how Austen uses irony and free indirect speech", "analyse", { d: "c" }],
        ]),
        text("sign-of-four", "The Sign of Four", [
          ["sof-plot", "The Sign of Four: plot and characters", "Know the plot and the roles of Holmes, Watson, Mary Morstan and Jonathan Small", "recall", { d: "f" }],
          ["sof-empire", "Empire and otherness", "Explore how the novel presents the British Empire and outsiders", "context"],
          ["sof-detective-genre", "The detective genre", "Analyse how Conan Doyle uses the conventions of detective fiction", "analyse"],
        ]),
      ],
    },
    {
      area: "Modern texts",
      groups: [
        text("inspector-calls", "An Inspector Calls", [
          ["aic-plot", "An Inspector Calls: plot and structure", "Know the plot and how the single setting and cliffhangers build tension", "recall", { d: "f" }],
          ["aic-inspector", "Inspector Goole", "Analyse the Inspector's role as Priestley's mouthpiece", "analyse"],
          ["aic-birlings", "Mr and Mrs Birling", "Analyse how the older Birlings represent capitalism and class prejudice", "analyse"],
          ["aic-sheila-eric", "Sheila and Eric", "Analyse how the younger generation changes", "analyse"],
          ["aic-gerald-eva", "Gerald and Eva Smith", "Explain the roles of Gerald and Eva Smith", "analyse"],
          ["aic-responsibility", "Social responsibility", "Explore Priestley's message about collective responsibility", "analyse"],
          ["aic-class-gender", "Class and gender", "Explore how class and gender are presented", "analyse"],
          ["aic-context", "1912 and 1945", "Link the play to the dates it is set and first performed", "context"],
          ["aic-dramatic-devices", "Dramatic devices", "Analyse dramatic irony, stage directions, lighting and entrances and exits", "analyse", { d: "c" }],
          ["aic-quotations", "An Inspector Calls: key quotations", "Learn and analyse short key quotations from An Inspector Calls for each character and theme", "recall"],
        ], "english-literature/an-inspector-calls"),
        text("blood-brothers", "Blood Brothers", [
          ["bb-plot", "Blood Brothers: plot and structure", "Know the plot and how the narrator and songs foreshadow the ending", "recall", { d: "f" }],
          ["bb-mickey-eddie", "Mickey and Eddie", "Compare how Mickey and Eddie are shaped by their upbringing", "compare"],
          ["bb-mothers", "Mrs Johnstone and Mrs Lyons", "Analyse how the two mothers are presented", "analyse"],
          ["bb-class", "Class and nature versus nurture", "Explore Russell's message about class and opportunity", "context"],
          ["bb-superstition-fate", "Superstition and fate", "Explore superstition, fate and the narrator's role", "analyse"],
        ]),
        text("lord-of-the-flies", "Lord of the Flies", [
          ["lotf-plot", "Lord of the Flies: plot and characters", "Know the plot and the roles of Ralph, Jack, Piggy and Simon", "recall", { d: "f" }],
          ["lotf-civilisation-savagery", "Civilisation and savagery", "Explore how Golding presents the collapse of order", "analyse"],
          ["lotf-symbolism", "Symbolism in Lord of the Flies", "Analyse the conch, the glasses, the beast and the island as symbols", "analyse"],
          ["lotf-context", "Golding's context", "Link the novel to the Second World War and the Cold War", "context"],
        ]),
        text("animal-farm", "Animal Farm", [
          ["af-plot", "Animal Farm: plot and characters", "Know the plot and the roles of Napoleon, Snowball, Squealer and Boxer", "recall", { d: "f" }],
          ["af-allegory", "Animal Farm as allegory", "Link the novella to the Russian Revolution and Stalin", "context"],
          ["af-power-propaganda", "Power and propaganda", "Explore how power corrupts and how language is used to control", "analyse"],
          ["af-structure", "Structure and the changing commandments", "Analyse how the cyclical structure shows the revolution failing", "analyse", { d: "c" }],
        ]),
      ],
    },
    {
      area: "Poetry",
      groups: [
        {
          subtopic: "Power and conflict cluster",
          flags: { opt: "power-and-conflict", coverage: "board_specific", boards: ["aqa"], quiz: "english-literature/poetry-techniques" },
          topics: [
            ["pc-power-of-humans", "The power of humans", "Compare how Ozymandias, London and My Last Duchess present human power", "compare"],
            ["pc-power-of-nature", "The power of nature", "Compare how Storm on the Island, Exposure and The Prelude extract present nature", "compare"],
            ["pc-reality-of-war", "The reality of war", "Compare how Bayonet Charge, Remains, Exposure and The Charge of the Light Brigade present conflict", "compare"],
            ["pc-loss-and-grief", "Loss and the effects of conflict", "Compare how Poppies, War Photographer and Kamikaze present loss", "compare"],
            ["pc-identity", "Identity and belonging", "Compare how Checking Out Me History, The Émigrée, Tissue and Kamikaze present identity", "compare"],
            ["pc-comparison-essay", "Writing the anthology comparison", "Compare a named poem with one you choose, linking methods and context", "compare", { d: "c" }],
          ],
        },
        {
          subtopic: "Love and relationships cluster",
          flags: { opt: "love-and-relationships", coverage: "board_specific", boards: ["aqa"], quiz: "english-literature/poetry-techniques" },
          topics: [
            ["lr-romantic-love", "Romantic love and desire", "Compare how Sonnet 29, Love's Philosophy, Porphyria's Lover and Singh Song! present romantic love", "compare"],
            ["lr-family", "Family relationships", "Compare how Follower, Mother, any distance, Walking Away and Climbing My Grandfather present family", "compare"],
            ["lr-loss-and-memory", "Loss, memory and endings", "Compare how When We Two Parted, Neutral Tones, Eden Rock and Before You Were Mine present loss and memory", "compare"],
            ["lr-comparison-essay", "Writing the love and relationships comparison", "Compare a named love poem with another poem from the cluster that you choose", "compare", { d: "c" }],
          ],
        },
        {
          subtopic: "Unseen poetry",
          flags: { quiz: "english-literature/poetry-techniques" },
          topics: [
            ["unseen-first-read", "Reading an unseen poem", "Work out what an unseen poem is about and its speaker, situation and tone", "analyse", { d: "f" }],
            ["poetic-form", "Form in poetry", "Explain the effect of sonnets, dramatic monologues, free verse and other forms", "analyse"],
            ["metre-and-rhyme", "Metre and rhyme", "Analyse rhythm, metre, rhyme and enjambment and their effect", "analyse"],
            ["poetic-imagery", "Imagery in poetry", "Analyse extended metaphors, symbolism and imagery in poems", "analyse"],
            ["volta-and-structure", "Structure and the volta", "Analyse stanza structure, shifts and turning points", "analyse"],
            ["comparing-unseen-poems", "Comparing two unseen poems", "Compare the methods used in two unseen poems on a shared theme", "compare", { d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Literature skills",
      groups: [
        {
          subtopic: "Essay writing",
          topics: [
            ["thesis-statements", "Thesis statements", "Open an essay with a clear argument that answers the question", "evaluate", { d: "f" }],
            ["analytical-paragraphs", "Analytical paragraphs", "Write paragraphs that make a point, analyse evidence and explore alternatives", "analyse"],
            ["integrating-context", "Integrating context", "Weave context into analysis rather than bolting it on", "context"],
            ["writers-intentions", "Writers' intentions", "Explain what the writer wants the audience to think and why", "analyse"],
            ["alternative-interpretations", "Alternative interpretations", "Offer more than one interpretation of a quotation or character", "evaluate", { d: "c" }],
            ["literature-conclusions", "Literature conclusions", "End an essay by drawing the argument together and linking to the writer's message", "evaluate"],
            ["literature-spag", "Accuracy in literature essays", "Write accurately with a range of vocabulary and sentence structures", "accuracy"],
          ],
        },
      ],
    },
    {
      area: "AQA exam technique",
      flags: { coverage: "board_specific", boards: ["aqa"] },
      groups: [
        {
          subtopic: "Papers 1 and 2",
          topics: [
            ["aqa-lit-p1-shakespeare", "Paper 1: the Shakespeare question", "Answer the extract-to-whole-play question in time", "analyse", { p: "Paper 1: Shakespeare and the 19th-century novel" }],
            ["aqa-lit-p1-novel", "Paper 1: the 19th-century novel question", "Answer the extract-to-whole-novel question in time", "analyse", { p: "Paper 1: Shakespeare and the 19th-century novel" }],
            ["aqa-lit-p2-modern", "Paper 2: the modern text essay", "Choose and plan the modern text question with no extract", "evaluate", { p: "Paper 2: Modern texts and poetry" }],
            ["aqa-lit-p2-poetry", "Paper 2: anthology and unseen poetry", "Divide time between the anthology comparison and the two unseen questions", "compare", { p: "Paper 2: Modern texts and poetry" }],
          ],
        },
      ],
    },
  ],
};
