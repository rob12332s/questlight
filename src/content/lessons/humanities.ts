import type { Lesson } from "@/domain/lesson";

/** Exam Answer Coach lessons for History and Geography. Sources are described, not reproduced. */
export const HISTORY_LESSONS: Record<string, Lesson> = {
  "source-provenance": {
    style: "evaluation",
    summary: "Use a source's provenance — its nature, origin and purpose — to judge how useful and reliable it is, instead of only describing what it shows.",
    knowledge: [
      "Nature: what type of source it is (a speech, diary, poster, photograph, government report).",
      "Origin: who made it and when.",
      "Purpose: why it was made and who it was for.",
      "A biased source can still be useful — it shows what its author wanted people to think.",
      "Combine provenance with content and your own knowledge.",
    ],
    vocabulary: [
      { term: "Provenance", meaning: "Where a source comes from: its nature, origin and purpose." },
      { term: "Utility", meaning: "How useful a source is for a particular enquiry." },
      { term: "Propaganda", meaning: "Material designed to persuade people to believe something." },
    ],
    recognise: "'How useful is Source A for an enquiry into…?' or 'How reliable…?'",
    commandWords: [
      { word: "How useful", meaning: "Weigh what the source can and can't tell you about the enquiry." },
      { word: "Explain your answer using Source A and your own knowledge", meaning: "Use both the source and facts you know." },
    ],
    method: [
      { title: "Content", detail: "What does the source tell you about the enquiry?" },
      { title: "Provenance", detail: "How do its nature, origin and purpose affect its usefulness?" },
      { title: "Own knowledge", detail: "Does what you know support or challenge it?" },
      { title: "Judgement", detail: "Conclude how useful it is FOR THIS ENQUIRY." },
    ],
    mistakes: [
      { tag: "source_content_only", text: "Describing what the source shows without discussing who made it and why." },
      { tag: "generic_knowledge", text: "Writing 'it's biased so it's not useful' — bias can make it useful." },
      { tag: "no_judgement", text: "Not concluding how useful it is." },
    ],
    worked: {
      question: "Source A is a Nazi election poster from 1932 showing unemployed workers with the slogan 'Our last hope: Hitler'. How useful is Source A for an enquiry into why the Nazis gained support?",
      marks: 8,
      steps: [
        {
          prompt: "What does the content suggest?",
          choices: [
            { text: "The Nazis targeted the unemployed, promising hope during the Depression", correct: true, feedback: "Specific and linked to the enquiry." },
            { text: "It shows some people", correct: false, feedback: "Be specific and link to the enquiry.", tag: "generic_knowledge" },
          ],
          reveal: "Content: the Nazis appealed to the desperate unemployed.",
        },
        {
          prompt: "How does provenance affect its usefulness?",
          choices: [
            { text: "As Nazi propaganda from 1932, it shows the message the Nazis used to win votes, though not whether voters believed it", correct: true, feedback: "Uses purpose to show both value and limits." },
            { text: "It's propaganda, so it's useless", correct: false, feedback: "Propaganda is very useful for showing a party's methods.", tag: "generic_knowledge" },
          ],
          reveal: "Provenance: useful for Nazi methods, limited on voters' motives.",
        },
        {
          prompt: "Which own knowledge supports it?",
          choices: [
            { text: "Unemployment reached about 6 million in 1932, and Nazi votes rose as the Depression deepened", correct: true, feedback: "Precise knowledge that supports the source." },
            { text: "Hitler was the leader of Germany", correct: false, feedback: "Too general to help.", tag: "generic_knowledge" },
          ],
          reveal: "Own knowledge: about 6 million unemployed by 1932.",
        },
      ],
      finalAnswer: "Source A is useful because it shows the Nazis targeting the unemployed with promises of hope. As 1932 Nazi propaganda it reveals the party's message, which my knowledge supports — unemployment reached about 6 million as Nazi support grew. However, it can't show why individual voters chose the Nazis, so it is useful for Nazi methods but limited on motives.",
    },
    guided: [
      {
        question: "Which part of provenance is 'to persuade people to vote Nazi'?",
        marks: 1,
        answer: { type: "choice", options: ["Nature", "Origin", "Purpose"], correct: 2 },
        hints: ["Is it about what it is, who made it, or why?", "It explains why it was made."],
        solution: "Purpose: why the source was made.",
      },
    ],
    exam: [
      {
        question: "A diary entry written in 1940 by a London teenager describes sleeping in an Underground station during the Blitz. How useful is this source for an enquiry into the experience of civilians in the Blitz?",
        marks: 8,
        answer: { type: "extended" },
        markScheme: [
          { point: "Uses the content to show what the source reveals about civilian experience", marks: 2 },
          { point: "Uses nature (private diary) to judge honesty", marks: 1 },
          { point: "Uses origin (date, author, place) to judge value and limits", marks: 2 },
          { point: "Brings in relevant, specific own knowledge", marks: 2 },
          { point: "Reaches a supported judgement about usefulness", marks: 1 },
        ],
        modelAnswer: "The diary is useful because it gives a first-hand account of sheltering in the Underground. As a private diary it was probably not written to persuade, so it may be honest. It was written in 1940 during the Blitz, so the experience is fresh. However, it is one teenager in London, and my knowledge shows many people used Anderson shelters or stayed at home, so it can't represent all civilians. Overall it is useful for an individual's experience but limited for civilians as a whole.",
        mistakeTags: ["source_content_only", "no_judgement", "generic_knowledge"],
      },
    ],
  },

  causation: {
    style: "explanation",
    summary: "Explain why an event happened by linking each cause to the outcome, showing how causes connect, and avoiding simply listing factors.",
    knowledge: [
      "A cause must be linked to the outcome — say HOW it led to the event.",
      "Causes can be long-term, short-term or triggers.",
      "Causes often connect: one made another more powerful.",
      "Use specific evidence: names, dates and figures.",
    ],
    vocabulary: [
      { term: "Trigger", meaning: "The immediate event that sets off a larger change." },
      { term: "Long-term cause", meaning: "A factor that built up over years and made the event possible." },
    ],
    recognise: "'Explain why…', 'Explain what was important about…'",
    commandWords: [{ word: "Explain why", meaning: "Give reasons and show how they led to the outcome." }],
    method: [
      { title: "Identify two or three causes", detail: "Choose different types if you can." },
      { title: "Support each with evidence", detail: "Specific details from your knowledge." },
      { title: "Link to the outcome", detail: "Use 'this led to', 'as a result', 'which meant'." },
      { title: "Connect the causes", detail: "Show how one cause made another worse." },
    ],
    mistakes: [
      { tag: "description_not_explanation", text: "Describing a cause without saying how it caused the outcome." },
      { tag: "generic_knowledge", text: "No specific facts to support a point." },
    ],
    worked: {
      question: "Explain why the Weimar Republic faced a crisis in 1923.",
      marks: 8,
      steps: [
        {
          prompt: "What's the first cause?",
          choices: [
            { text: "The French and Belgians occupied the Ruhr in January 1923 when Germany missed reparations payments", correct: true, feedback: "A specific cause with a date." },
            { text: "Germany had problems", correct: false, feedback: "Too vague.", tag: "generic_knowledge" },
          ],
          reveal: "Cause 1: the occupation of the Ruhr.",
        },
        {
          prompt: "How does it link to the crisis?",
          choices: [
            { text: "Workers went on strike and the government printed money to pay them, which caused hyperinflation", correct: true, feedback: "That's the link — the cause leads to the outcome." },
            { text: "The Ruhr was an important area", correct: false, feedback: "Say what happened as a result.", tag: "description_not_explanation" },
          ],
          reveal: "Linked: printing money caused hyperinflation.",
        },
        {
          prompt: "How do you connect to a second cause?",
          choices: [
            { text: "Hyperinflation made people lose faith in Weimar, encouraging extremists such as in the Munich Putsch in November 1923", correct: true, feedback: "Connected causes show higher-level explanation." },
            { text: "Also, there was the Munich Putsch.", correct: false, feedback: "That just lists another event.", tag: "description_not_explanation" },
          ],
          reveal: "Connected: economic crisis fuelled political threats.",
        },
      ],
      finalAnswer: "The occupation of the Ruhr in January 1923 led to strikes, and the government printed money to pay workers, causing hyperinflation. Savings became worthless, which made people lose faith in the Republic and encouraged extremists — Hitler attempted the Munich Putsch in November 1923.",
    },
    guided: [
      {
        question: "Which phrase shows a cause being LINKED to an outcome?",
        marks: 1,
        answer: { type: "choice", options: ["Another cause was…", "This led to…", "In 1923…", "Firstly…"], correct: 1 },
        hints: ["Linking shows consequence.", "Which phrase explains a result?"],
        solution: "'This led to…' links a cause to its effect.",
      },
    ],
    exam: [
      {
        question: "Explain why William won the Battle of Hastings in 1066.",
        marks: 8,
        answer: { type: "extended" },
        markScheme: [
          { point: "Identifies at least two relevant causes (e.g. Harold's exhausted army, Norman tactics, luck with the wind)", marks: 2 },
          { point: "Supports causes with specific knowledge", marks: 2 },
          { point: "Explains how each cause led to William's victory", marks: 3 },
          { point: "Shows how causes connected", marks: 1 },
        ],
        modelAnswer: "Harold's army had just fought Harald Hardrada at Stamford Bridge and marched about 250 miles south, so his troops were exhausted. This made them vulnerable to William's tactics: the Normans used feigned retreats, tempting Saxons to break the shield wall, which let Norman cavalry attack. Harold's death late in the battle left the English leaderless, so the army collapsed. The exhaustion made the shield wall harder to hold, linking the two causes.",
        mistakeTags: ["description_not_explanation", "generic_knowledge"],
      },
    ],
  },

  "how-far-do-you-agree": {
    style: "evaluation",
    summary: "Write a balanced 'how far do you agree?' essay: argue both sides with specific evidence, compare their importance, and reach a clear, sustained judgement.",
    knowledge: [
      "Make your judgement clear from the introduction.",
      "Give at least one paragraph agreeing and one disagreeing.",
      "Compare factors: explain why one is more important than another.",
      "End with a conclusion that weighs the factors and answers 'how far'.",
    ],
    vocabulary: [
      { term: "Sustained judgement", meaning: "An argument held consistently throughout the essay." },
      { term: "Criteria", meaning: "The measure you use to judge importance, such as the number of people affected." },
    ],
    recognise: "A statement in quotation marks followed by 'How far do you agree?'",
    commandWords: [{ word: "How far do you agree", meaning: "Decide to what extent, and justify it." }],
    method: [
      { title: "Introduction", detail: "Your judgement in one sentence." },
      { title: "Agree", detail: "A paragraph supporting the statement with evidence." },
      { title: "Disagree", detail: "One or two paragraphs on other factors." },
      { title: "Weigh", detail: "Compare factors using a clear criterion." },
      { title: "Conclusion", detail: "Answer 'how far' and say why." },
    ],
    mistakes: [
      { tag: "one_sided", text: "Arguing only one side." },
      { tag: "no_judgement", text: "Sitting on the fence: 'both factors were important'." },
      { tag: "not_linked_to_question", text: "Paragraphs about relevant events that never say how they support or challenge the statement." },
    ],
    worked: {
      question: "'The main reason Hitler became Chancellor in 1933 was the Great Depression.' How far do you agree?",
      marks: 16,
      steps: [
        {
          prompt: "Which introduction sets up a sustained judgement?",
          choices: [
            { text: "The Depression was the most important reason because it created the desperation the Nazis exploited, but it only led to the chancellorship because of the backroom deal of January 1933.", correct: true, feedback: "A clear judgement with nuance." },
            { text: "There were many reasons Hitler became Chancellor, which I will discuss.", correct: false, feedback: "No judgement.", tag: "no_judgement" },
          ],
          reveal: "Judgement set out.",
        },
        {
          prompt: "Which paragraph is the best 'disagree' point?",
          choices: [
            { text: "However, Nazi votes fell in November 1932; Hitler became Chancellor because von Papen and Hindenburg thought they could control him.", correct: true, feedback: "Specific evidence challenging the statement." },
            { text: "However, Hitler was a good speaker.", correct: false, feedback: "Needs evidence and a link to the question.", tag: "generic_knowledge" },
          ],
          reveal: "Counter-argument: the political deal.",
        },
        {
          prompt: "How should the conclusion weigh the factors?",
          choices: [
            { text: "The Depression gave the Nazis mass support, which was necessary — but the deal was the final step. So I largely agree: without the Depression the deal would never have been considered.", correct: true, feedback: "Weighs factors with a clear criterion." },
            { text: "Both were important in different ways.", correct: false, feedback: "Avoids answering 'how far'.", tag: "no_judgement" },
          ],
          reveal: "A weighed conclusion.",
        },
      ],
      finalAnswer: "I largely agree: the Depression created the mass support (Nazi votes rose to 37% in July 1932) that made Hitler impossible to ignore. However, his appointment came through a political deal by von Papen and Hindenburg, who believed they could control him — even after Nazi votes fell in November 1932. The Depression was necessary, the deal was the trigger.",
    },
    guided: [
      {
        question: "Which conclusion is a clear judgement?",
        marks: 1,
        answer: { type: "choice", options: ["There were lots of factors.", "Both factors were equally important.", "Overall I disagree: the Depression mattered, but propaganda was more important because it turned discontent into votes.", "Hitler became Chancellor in 1933."], correct: 2 },
        hints: ["A judgement says which is more important and why.", "Look for 'because'."],
        solution: "The third option makes a judgement and explains it.",
      },
    ],
    exam: [
      {
        question: "'Pasteur's germ theory was the most important development in medicine in the 19th century.' How far do you agree?",
        marks: 16,
        answer: { type: "extended" },
        markScheme: [
          { point: "Clear judgement in the introduction, sustained throughout", marks: 2 },
          { point: "Developed paragraph supporting the statement with specific knowledge", marks: 3 },
          { point: "Developed paragraph(s) on other developments (e.g. anaesthetics, antiseptics, public health, vaccination)", marks: 4 },
          { point: "Weighs factors using clear criteria", marks: 3 },
          { point: "Conclusion answers 'how far' with justification", marks: 2 },
          { point: "Accurate spelling, punctuation and grammar with specialist terms", marks: 2 },
        ],
        modelAnswer: "Germ theory (1861) was the most important development because it explained what caused disease, which later developments depended on. Lister used it to justify carbolic acid antiseptics, cutting deaths after surgery, and it gave scientific backing to public health reform such as the 1875 Public Health Act. However, Simpson's chloroform (1847) allowed longer operations and was developed without germ theory, so not every advance relied on it. Overall I largely agree: germ theory changed understanding, and that understanding made the other developments far more effective.",
        mistakeTags: ["one_sided", "no_judgement", "generic_knowledge"],
      },
    ],
  },
};

export const GEOGRAPHY_LESSONS: Record<string, Lesson> = {
  "plate-margins": {
    style: "explanation",
    summary: "Explain what happens at constructive, destructive and conservative plate margins, and which hazards each produces, using a clear sequence of processes.",
    knowledge: [
      "Constructive: plates move apart; magma rises to fill the gap, forming new crust and gentle volcanoes.",
      "Destructive: denser oceanic plate subducts under continental plate; it melts, forming explosive volcanoes and strong earthquakes.",
      "Conservative: plates slide past each other; friction builds and is released as earthquakes, with no volcanoes.",
      "Convection currents in the mantle (and ridge push/slab pull) move the plates.",
    ],
    vocabulary: [
      { term: "Subduction", meaning: "When one plate sinks beneath another into the mantle." },
      { term: "Oceanic crust", meaning: "Thinner, denser crust under the oceans." },
      { term: "Continental crust", meaning: "Thicker, less dense crust that forms the land." },
    ],
    recognise: "Diagrams of plate boundaries, or questions asking why volcanoes or earthquakes happen at a margin.",
    commandWords: [
      { word: "Explain", meaning: "Give the processes in order, linking cause and effect." },
      { word: "Use Figure 1", meaning: "Refer to the diagram's labels and data." },
    ],
    method: [
      { title: "Name the margin", detail: "Constructive, destructive or conservative." },
      { title: "Describe the movement", detail: "Apart, towards or past each other." },
      { title: "Explain the process", detail: "Rising magma, subduction and melting, or friction." },
      { title: "Give the hazard", detail: "What it produces and why." },
    ],
    mistakes: [
      { tag: "missing_key_term", text: "Forgetting 'subduction' and 'denser' at destructive margins." },
      { tag: "description_not_explanation", text: "Saying earthquakes happen without explaining friction and sudden release." },
    ],
    worked: {
      question: "Explain why earthquakes happen at conservative plate margins. (4 marks)",
      marks: 4,
      steps: [
        {
          prompt: "How do the plates move?",
          choices: [
            { text: "Past each other, in the same or opposite directions at different speeds", correct: true, feedback: "Correct." },
            { text: "Apart", correct: false, feedback: "That's a constructive margin.", tag: "missing_key_term" },
          ],
          reveal: "The plates slide past each other.",
        },
        {
          prompt: "What builds up?",
          choices: [
            { text: "The plates stick because of friction, so pressure builds", correct: true, feedback: "Yes." },
            { text: "Magma builds up", correct: false, feedback: "There's no magma at conservative margins.", tag: "missing_key_term" },
          ],
          reveal: "Friction makes them stick; pressure builds.",
        },
        {
          prompt: "What causes the earthquake?",
          choices: [
            { text: "The pressure is released suddenly as the plates jerk past, sending out seismic waves", correct: true, feedback: "That's the full explanation." },
            { text: "The ground shakes", correct: false, feedback: "That describes, not explains.", tag: "description_not_explanation" },
          ],
          reveal: "Sudden release sends out seismic waves.",
        },
      ],
      finalAnswer: "The plates slide past each other (1). Friction makes them stick (1), so pressure builds up (1). When it is suddenly released the plates jerk past, sending out seismic waves — an earthquake (1).",
    },
    guided: [
      {
        question: "Which plate margin produces explosive volcanoes?",
        marks: 1,
        answer: { type: "choice", options: ["Constructive", "Destructive", "Conservative"], correct: 1 },
        hints: ["Explosive eruptions come from melted crust that is thick and gas-rich.", "Where does a plate melt?"],
        solution: "Destructive: the subducting plate melts, creating gas-rich magma.",
      },
    ],
    exam: [
      {
        question: "Explain how volcanoes form at destructive plate margins.",
        marks: 4,
        answer: { type: "extended" },
        markScheme: [
          { point: "Oceanic and continental plates move towards each other", marks: 1 },
          { point: "Denser oceanic plate is subducted", marks: 1 },
          { point: "It melts in the mantle, forming magma", marks: 1 },
          { point: "Magma rises through cracks and erupts, forming a volcano", marks: 1 },
        ],
        modelAnswer: "The oceanic and continental plates move towards each other. The denser oceanic plate is subducted beneath the continental plate and melts as it sinks into the hot mantle. The resulting magma is less dense, so it rises through cracks in the crust and erupts, forming a composite volcano.",
        mistakeTags: ["missing_key_term", "description_not_explanation"],
      },
    ],
  },

  "meanders-and-ox-bows": {
    style: "explanation",
    summary: "Explain how meanders form through erosion on the outside bend and deposition on the inside, and how a meander neck is cut through to form an ox-bow lake.",
    knowledge: [
      "Water flows fastest on the outside of a bend, causing lateral erosion and a river cliff.",
      "Water is slowest on the inside, so it deposits sediment and forms a slip-off slope.",
      "Over time the neck of the meander narrows.",
      "During a flood the river cuts through the neck, taking the shortest route.",
      "Deposition seals off the old bend, leaving an ox-bow lake.",
    ],
    vocabulary: [
      { term: "Lateral erosion", meaning: "Sideways erosion that widens a river channel." },
      { term: "Slip-off slope", meaning: "A gentle slope of deposited material on the inside bend." },
      { term: "River cliff", meaning: "A steep bank on the outside bend caused by erosion." },
    ],
    recognise: "'Explain the formation of…' a meander or an ox-bow lake, often with a diagram.",
    commandWords: [{ word: "Explain the formation", meaning: "Give each stage of the process in order with the reasons." }],
    method: [
      { title: "Fast and slow flow", detail: "Outside bend fast, inside bend slow." },
      { title: "Erosion and deposition", detail: "Name the processes: hydraulic action, abrasion; deposition." },
      { title: "Narrowing neck", detail: "Erosion on the outside bends brings them closer." },
      { title: "Cut-off", detail: "Flood breaks through; deposition seals the old meander." },
    ],
    mistakes: [
      { tag: "missing_key_term", text: "Not naming erosion processes or using 'river cliff' and 'slip-off slope'." },
      { tag: "description_not_explanation", text: "Describing the shape without explaining why erosion and deposition happen where they do." },
    ],
    worked: {
      question: "Explain the formation of an ox-bow lake. (6 marks)",
      marks: 6,
      steps: [
        {
          prompt: "Where does the most erosion happen in a meander?",
          choices: [
            { text: "On the outside bend, where the water flows fastest", correct: true, feedback: "Yes — creating a river cliff." },
            { text: "On the inside bend", correct: false, feedback: "That's where water is slowest and deposits.", tag: "missing_key_term" },
          ],
          reveal: "Fastest flow on the outside bend erodes a river cliff.",
        },
        {
          prompt: "What happens to the meander neck over time?",
          choices: [
            { text: "It narrows as erosion on the outside bends brings them closer together", correct: true, feedback: "Correct." },
            { text: "It gets wider", correct: false, feedback: "Erosion on two outside bends cuts towards each other.", tag: "description_not_explanation" },
          ],
          reveal: "The neck narrows.",
        },
        {
          prompt: "What finally creates the lake?",
          choices: [
            { text: "In a flood the river cuts through the neck; deposition seals off the old bend", correct: true, feedback: "That completes it." },
            { text: "The river dries up", correct: false, feedback: "The river continues — it just takes a new course.", tag: "description_not_explanation" },
          ],
          reveal: "Cut-off and deposition form the ox-bow lake.",
        },
      ],
      finalAnswer: "Water flows fastest on the outside bend, eroding by hydraulic action and abrasion to form a river cliff, while slower water on the inside deposits a slip-off slope. Over time erosion narrows the neck. In a flood the river cuts through the neck, taking the shortest route, and deposition seals off the old meander, leaving an ox-bow lake.",
    },
    guided: [
      {
        question: "What landform is found on the inside bend of a meander?",
        marks: 1,
        answer: { type: "text", accept: ["slip-off slope", "slip off slope", "point bar"] },
        hints: ["Water is slow here, so sediment is deposited.", "It's a gentle slope — starts with 'slip'."],
        solution: "A slip-off slope (point bar).",
      },
    ],
    exam: [
      {
        question: "Explain why erosion happens on the outside of a meander bend and deposition on the inside.",
        marks: 4,
        answer: { type: "extended" },
        markScheme: [
          { point: "Faster flow / more energy on the outside bend", marks: 1 },
          { point: "Causes erosion (hydraulic action / abrasion), forming a river cliff", marks: 1 },
          { point: "Slower flow / less energy on the inside bend", marks: 1 },
          { point: "Sediment is deposited, forming a slip-off slope", marks: 1 },
        ],
        modelAnswer: "Water flows faster on the outside of the bend, so it has more energy and erodes the bank by hydraulic action and abrasion, forming a river cliff. On the inside the water is slower with less energy, so it deposits sediment, forming a slip-off slope.",
        mistakeTags: ["missing_key_term", "description_not_explanation"],
      },
    ],
  },

  "measuring-development": {
    style: "explanation",
    summary: "Compare economic and social measures of development — GNI per head, birth and death rates, life expectancy, literacy and the HDI — and explain why combined measures are more reliable than single ones.",
    knowledge: [
      "GNI per head measures average income but hides inequality.",
      "Social measures include life expectancy, infant mortality, literacy rate and access to clean water.",
      "The Human Development Index (HDI) combines life expectancy, education and income (0 to 1).",
      "A single measure can be misleading; using several gives a fuller picture.",
      "Countries can be grouped as HICs, NEEs and LICs.",
    ],
    vocabulary: [
      { term: "GNI per head", meaning: "Gross national income divided by the population." },
      { term: "HDI", meaning: "A composite measure of health, education and income." },
      { term: "NEE", meaning: "Newly emerging economy: a country beginning to experience rapid growth." },
    ],
    recognise: "Data tables of indicators, or 'Explain why HDI is a better measure than GNI'.",
    commandWords: [
      { word: "Compare", meaning: "Point out similarities and differences, using data." },
      { word: "Suggest", meaning: "Give a reasoned idea for an unfamiliar situation." },
    ],
    method: [
      { title: "Identify the measure", detail: "Economic or social?" },
      { title: "Use the data", detail: "Quote figures with units." },
      { title: "Explain the limitation", detail: "Averages hide inequality; single measures miss things." },
      { title: "Conclude", detail: "Why combined measures are better." },
    ],
    mistakes: [
      { tag: "data_not_used", text: "Not quoting figures from the table." },
      { tag: "vague_language", text: "Saying a country is 'poor' without a measure." },
    ],
    worked: {
      question: "Explain why HDI may be a more reliable measure of development than GNI per head. (4 marks)",
      marks: 4,
      steps: [
        {
          prompt: "What's the weakness of GNI per head?",
          choices: [
            { text: "It is an average, so it hides inequality between rich and poor", correct: true, feedback: "Yes." },
            { text: "It's hard to calculate", correct: false, feedback: "Focus on what it fails to show.", tag: "vague_language" },
          ],
          reveal: "GNI per head hides inequality.",
        },
        {
          prompt: "What else does GNI miss?",
          choices: [
            { text: "Quality of life — health and education aren't measured", correct: true, feedback: "Right." },
            { text: "The size of the country", correct: false, feedback: "Size isn't a development measure.", tag: "missing_key_term" },
          ],
          reveal: "GNI ignores health and education.",
        },
        {
          prompt: "Why is HDI better?",
          choices: [
            { text: "It combines life expectancy, education and income, giving a broader picture", correct: true, feedback: "That's the conclusion." },
            { text: "It's newer", correct: false, feedback: "Explain what it measures.", tag: "description_not_explanation" },
          ],
          reveal: "HDI combines several measures.",
        },
      ],
      finalAnswer: "GNI per head is an average, so it hides inequality (1), and it only measures income, not quality of life (1). HDI combines life expectancy, education and income (1), so it gives a fuller picture of development (1).",
    },
    guided: [
      {
        question: "Which of these is a social measure of development?",
        marks: 1,
        answer: { type: "choice", options: ["GNI per head", "Infant mortality rate", "Exports", "GDP"], correct: 1 },
        hints: ["Social measures are about people's health or education.", "Which isn't about money?"],
        solution: "Infant mortality rate.",
      },
    ],
    exam: [
      {
        question: "Country A has a GNI per head of US$12 000 and a life expectancy of 62 years. Country B has a GNI per head of US$9 000 and a life expectancy of 76 years. Suggest why using only GNI per head could give a misleading picture of development.",
        marks: 4,
        answer: { type: "extended" },
        markScheme: [
          { point: "Uses the data: A has higher GNI but lower life expectancy than B", marks: 1 },
          { point: "GNI is an average that may hide inequality (wealth held by a few)", marks: 1 },
          { point: "GNI ignores social factors such as healthcare", marks: 1 },
          { point: "Concludes that B may have a higher quality of life / several measures are needed", marks: 1 },
        ],
        modelAnswer: "Country A's GNI per head is US$3 000 higher than B's, yet life expectancy is 14 years lower. GNI is an average and may hide wealth held by a small group, and it doesn't measure healthcare. B may actually have a better quality of life, so several measures are needed.",
        mistakeTags: ["data_not_used", "vague_language"],
      },
    ],
  },
};
