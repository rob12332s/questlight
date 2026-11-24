import type { Lesson } from "@/domain/lesson";

/** Exam Answer Coach lessons for Biology, Chemistry and Physics, keyed by library topic slug. */
export const BIOLOGY_LESSONS: Record<string, Lesson> = {
  "animal-and-plant-cells": {
    style: "explanation",
    summary: "Name the parts of animal and plant cells, say what each part does, and explain the differences between the two — the starting point for all of cell biology.",
    knowledge: [
      "Animal and plant cells both have a nucleus, cytoplasm, cell membrane, mitochondria and ribosomes.",
      "Plant cells also have a cell wall made of cellulose, a permanent vacuole filled with cell sap, and often chloroplasts.",
      "The nucleus contains genetic material that controls the cell's activities.",
      "Mitochondria are where aerobic respiration happens; ribosomes are where proteins are made.",
      "Chloroplasts absorb light for photosynthesis; the cell wall strengthens the cell.",
    ],
    vocabulary: [
      { term: "Cell membrane", meaning: "Controls which substances move into and out of the cell." },
      { term: "Cytoplasm", meaning: "Gel-like substance where most chemical reactions happen." },
      { term: "Chloroplast", meaning: "Contains chlorophyll, which absorbs light for photosynthesis." },
    ],
    recognise: "A labelled diagram of a cell, or a question asking you to name, describe the function of, or compare cell parts.",
    commandWords: [
      { word: "Name", meaning: "One word or phrase is enough." },
      { word: "Describe", meaning: "Say what something is like or does — no reason needed." },
      { word: "Explain", meaning: "Give a reason: say why or how." },
    ],
    method: [
      { title: "Identify the part", detail: "Use shape and position: chloroplasts are small green ovals, the vacuole is a large central space." },
      { title: "Give its function", detail: "Match each part to its job using precise words: 'controls', 'site of', 'absorbs'." },
      { title: "For comparisons, use both cells", detail: "Say what the plant cell has that the animal cell doesn't, and what they share." },
    ],
    mistakes: [
      { tag: "vague_language", text: "Saying mitochondria 'make energy'. Energy can't be made: they release energy by respiration." },
      { tag: "missing_key_term", text: "Saying the cell wall 'protects' without mentioning that it strengthens and supports the cell." },
      { tag: "misread_question", text: "Thinking all plant cells have chloroplasts — root cells don't, because they get no light." },
    ],
    worked: {
      question: "Explain why root hair cells do not contain chloroplasts. (2 marks)",
      marks: 2,
      steps: [
        {
          prompt: "What do chloroplasts do?",
          choices: [
            { text: "They absorb light for photosynthesis", correct: true, feedback: "Yes — that's the first idea you need." },
            { text: "They release energy from glucose", correct: false, feedback: "That's mitochondria (respiration).", tag: "missing_key_term" },
            { text: "They control the cell", correct: false, feedback: "That's the nucleus.", tag: "missing_key_term" },
          ],
          reveal: "Chloroplasts absorb light so the cell can photosynthesise.",
        },
        {
          prompt: "Now link it to root hair cells. Which reason completes the explanation?",
          choices: [
            { text: "Roots are underground, so they receive no light to photosynthesise", correct: true, feedback: "That's the 'because' that turns it into an explanation." },
            { text: "Root hair cells are small", correct: false, feedback: "Size isn't the reason — think about where roots are.", tag: "description_not_explanation" },
            { text: "Root hair cells absorb water", correct: false, feedback: "True, but it doesn't explain the missing chloroplasts.", tag: "not_linked_to_question" },
          ],
          reveal: "Roots are underground and get no light, so chloroplasts would be useless there.",
        },
      ],
      finalAnswer: "Chloroplasts absorb light for photosynthesis (1). Root hair cells are underground so receive no light, so they cannot photosynthesise (1).",
    },
    guided: [
      {
        question: "Which part of a cell is the site of aerobic respiration?",
        marks: 1,
        answer: { type: "choice", options: ["Nucleus", "Ribosome", "Mitochondrion", "Cell wall"], correct: 2 },
        hints: ["Respiration releases energy from glucose.", "This organelle is often called the 'powerhouse', though it releases energy rather than making it."],
        solution: "Mitochondria are the site of aerobic respiration.",
      },
      {
        question: "Name the substance a plant cell wall is made of.",
        marks: 1,
        answer: { type: "text", accept: ["cellulose"] },
        hints: ["It's a carbohydrate polymer made from glucose.", "It starts with 'c'."],
        solution: "Cellulose.",
      },
    ],
    exam: [
      {
        question: "Give three structures found in a palisade leaf cell that are not found in an animal cell, and describe the function of each.",
        marks: 6,
        answer: { type: "extended" },
        markScheme: [
          { point: "Cell wall", marks: 1 },
          { point: "Strengthens / supports the cell", marks: 1 },
          { point: "Permanent vacuole", marks: 1 },
          { point: "Contains cell sap / keeps the cell firm (turgid)", marks: 1 },
          { point: "Chloroplasts", marks: 1 },
          { point: "Absorb light for photosynthesis", marks: 1 },
        ],
        modelAnswer: "A cell wall made of cellulose, which strengthens and supports the cell. A permanent vacuole filled with cell sap, which keeps the cell firm. Chloroplasts, which contain chlorophyll to absorb light for photosynthesis.",
        mistakeTags: ["missing_key_term", "vague_language"],
      },
    ],
  },

  osmosis: {
    style: "explanation",
    summary: "Explain osmosis as the movement of water across a partially permeable membrane from a dilute to a more concentrated solution, and analyse results from the potato practical.",
    knowledge: [
      "Osmosis is the diffusion of water from a dilute solution to a more concentrated solution through a partially permeable membrane.",
      "It is passive: it needs no energy from respiration.",
      "In a more concentrated solution, plant tissue loses water and mass; in a more dilute one it gains water and mass.",
      "Percentage change in mass = (final − initial) ÷ initial × 100, which lets you compare pieces that started at different masses.",
      "Where the line of a graph crosses 0% change, the solution has the same concentration as the cell contents.",
    ],
    vocabulary: [
      { term: "Partially permeable", meaning: "Lets small molecules like water through but not larger ones like sugar." },
      { term: "Turgid", meaning: "A plant cell swollen with water, pressing on its cell wall." },
      { term: "Plasmolysed", meaning: "A plant cell that has lost so much water its membrane pulls away from the wall." },
    ],
    recognise: "Questions about water moving into or out of cells, sugar or salt solutions, or results tables showing mass change of potato pieces.",
    commandWords: [
      { word: "Explain", meaning: "Say what happens to the water and why, using 'dilute' and 'concentrated'." },
      { word: "Calculate", meaning: "Show the percentage change working." },
      { word: "Suggest", meaning: "Apply what you know to an unfamiliar situation." },
    ],
    method: [
      { title: "Compare the concentrations", detail: "Which side has more water (is more dilute)?" },
      { title: "State the direction", detail: "Water moves from the dilute side to the concentrated side." },
      { title: "Name the membrane", detail: "Say 'through a partially permeable membrane'." },
      { title: "Give the result", detail: "Say what happens to the cell or tissue: gains mass and becomes turgid, or loses mass and becomes flaccid." },
    ],
    mistakes: [
      { tag: "vague_language", text: "Saying water moves 'from high to low concentration' without saying high or low concentration of what." },
      { tag: "missing_key_term", text: "Missing 'partially permeable membrane'." },
      { tag: "data_not_used", text: "Comparing mass changes instead of percentage changes when pieces started at different masses." },
    ],
    worked: {
      question: "A potato cylinder is placed in a concentrated sugar solution. Explain what happens to its mass. (3 marks)",
      marks: 3,
      steps: [
        {
          prompt: "Compare the concentrations. Which is more concentrated?",
          choices: [
            { text: "The sugar solution is more concentrated than the potato cells", correct: true, feedback: "Right — the cells contain a more dilute solution." },
            { text: "The potato cells are more concentrated", correct: false, feedback: "The question says the sugar solution is concentrated.", tag: "misread_question" },
          ],
          reveal: "The solution outside is more concentrated than the cell contents.",
        },
        {
          prompt: "Which way does water move, and how?",
          choices: [
            { text: "Out of the cells by osmosis, through the partially permeable membrane", correct: true, feedback: "Yes — from the dilute cell contents to the concentrated solution." },
            { text: "Sugar moves into the cells", correct: false, feedback: "The membrane stops sugar; osmosis is about water.", tag: "missing_key_term" },
            { text: "Water moves into the cells", correct: false, feedback: "Water moves towards the more concentrated solution.", tag: "vague_language" },
          ],
          reveal: "Water leaves the cells by osmosis through the partially permeable membrane.",
        },
        {
          prompt: "What happens to the mass?",
          choices: [
            { text: "It decreases, because the potato loses water", correct: true, feedback: "That completes the explanation." },
            { text: "It increases", correct: false, feedback: "Losing water means losing mass.", tag: "description_not_explanation" },
          ],
          reveal: "The mass decreases.",
        },
      ],
      finalAnswer: "The solution is more concentrated than the cell contents (1), so water moves out of the potato cells by osmosis through the partially permeable membrane (1), so the mass decreases (1).",
    },
    guided: [
      {
        question: "A piece of potato has a mass of 2.50 g at the start and 2.80 g at the end. Calculate the percentage change in mass.",
        marks: 2,
        answer: { type: "numeric", value: 12, tolerance: 0.05, unit: "%" },
        hints: ["Change = final − initial = 0.30 g.", "Divide the change by the initial mass, then multiply by 100."],
        solution: "0.30 ÷ 2.50 × 100 = 12%",
      },
    ],
    exam: [
      {
        question: "Explain why percentage change in mass is calculated, rather than change in mass, in the potato osmosis practical.",
        marks: 2,
        answer: { type: "extended" },
        markScheme: [
          { point: "The potato pieces may have different starting masses", marks: 1 },
          { point: "Percentage change allows a fair comparison", marks: 1 },
        ],
        modelAnswer: "The pieces may not start with the same mass, so calculating percentage change lets the results be compared fairly.",
        mistakeTags: ["description_not_explanation"],
      },
      {
        question: "Red blood cells are placed in pure water. Explain what happens to them.",
        marks: 3,
        answer: { type: "extended" },
        markScheme: [
          { point: "Water is more dilute than the cytoplasm / the cell contents are more concentrated", marks: 1 },
          { point: "Water moves into the cells by osmosis through the partially permeable membrane", marks: 1 },
          { point: "The cells swell and burst, because animal cells have no cell wall", marks: 1 },
        ],
        modelAnswer: "Pure water is more dilute than the cytoplasm, so water moves into the cells by osmosis through the partially permeable membrane. With no cell wall to resist it, the cells swell and burst.",
        mistakeTags: ["missing_key_term", "description_not_explanation"],
      },
    ],
  },

  "natural-selection": {
    style: "explanation",
    summary: "Explain evolution by natural selection as a sequence: variation, selection pressure, survival and reproduction of the best adapted, inheritance of alleles, and change over many generations.",
    knowledge: [
      "Individuals in a population show variation, partly caused by mutations.",
      "There is a selection pressure, such as a predator, disease or competition for food.",
      "Individuals with characteristics best suited to the environment are more likely to survive and reproduce.",
      "They pass their alleles to their offspring.",
      "Over many generations the advantageous allele becomes more common in the population.",
    ],
    vocabulary: [
      { term: "Allele", meaning: "A version of a gene." },
      { term: "Selection pressure", meaning: "A factor in the environment that affects which individuals survive." },
      { term: "Mutation", meaning: "A change in DNA that can produce a new allele." },
    ],
    recognise: "Questions asking how a species 'evolved', how bacteria became resistant, or why a characteristic became more common.",
    commandWords: [{ word: "Explain", meaning: "Give the steps in order, linking each one to the next." }],
    method: [
      { title: "Variation", detail: "Say the characteristic varies in the population, maybe because of a mutation." },
      { title: "Selection pressure", detail: "Name what in the environment makes the characteristic useful." },
      { title: "Survive and reproduce", detail: "Those with the characteristic are more likely to survive AND reproduce." },
      { title: "Inheritance", detail: "They pass on the allele to their offspring." },
      { title: "Over generations", detail: "The allele becomes more common in the population over many generations." },
    ],
    mistakes: [
      { tag: "vague_language", text: "Saying the animal 'adapts to survive' or 'needs' the characteristic. Individuals don't choose to change." },
      { tag: "missing_key_term", text: "Forgetting 'reproduce' and 'pass on alleles' — survival alone doesn't change the population." },
    ],
    worked: {
      question: "Explain how peppered moths with dark wings became more common in industrial areas in the 1800s, when soot darkened tree bark. (4 marks)",
      marks: 4,
      steps: [
        {
          prompt: "What is the first point?",
          choices: [
            { text: "There was variation in wing colour, caused by a mutation", correct: true, feedback: "Yes — start with variation." },
            { text: "The moths turned dark to hide on the soot", correct: false, feedback: "Individual moths can't change their colour to match.", tag: "vague_language" },
          ],
          reveal: "Some moths had dark wings because of a mutation.",
        },
        {
          prompt: "What was the selection pressure?",
          choices: [
            { text: "Birds could see pale moths more easily on dark bark and ate them", correct: true, feedback: "Right: predation." },
            { text: "The soot poisoned pale moths", correct: false, feedback: "The pressure was being spotted by predators.", tag: "generic_knowledge" },
          ],
          reveal: "Pale moths were more visible to predatory birds.",
        },
        {
          prompt: "What happened next?",
          choices: [
            { text: "Dark moths were more likely to survive and reproduce, passing on the allele for dark wings", correct: true, feedback: "That's the key link." },
            { text: "Dark moths lived longer", correct: false, feedback: "Survival alone isn't enough: they must reproduce and pass on the allele.", tag: "missing_key_term" },
          ],
          reveal: "Dark moths survived, reproduced and passed on the dark allele.",
        },
        {
          prompt: "How do you finish?",
          choices: [
            { text: "Over many generations, the dark allele became more common in the population", correct: true, feedback: "That's evolution." },
            { text: "So all moths became dark straight away", correct: false, feedback: "It happens over many generations.", tag: "vague_language" },
          ],
          reveal: "Over many generations the dark form became more common.",
        },
      ],
      finalAnswer: "Variation from a mutation (1); birds ate pale moths that were easier to see on dark bark (1); dark moths more likely to survive and reproduce, passing on the allele (1); over many generations the allele became more common (1).",
    },
    guided: [
      {
        question: "Which of these is a selection pressure for bacteria developing antibiotic resistance?",
        marks: 1,
        answer: { type: "choice", options: ["Mutation", "Use of antibiotics", "Reproduction", "Variation"], correct: 1 },
        hints: ["A selection pressure is something in the environment that kills some individuals.", "What kills non-resistant bacteria?"],
        solution: "The use of antibiotics kills non-resistant bacteria, so it is the selection pressure.",
      },
    ],
    exam: [
      {
        question: "Explain how a population of bacteria can become resistant to an antibiotic.",
        marks: 4,
        answer: { type: "extended" },
        markScheme: [
          { point: "A mutation produces a resistant bacterium / variation in resistance", marks: 1 },
          { point: "The antibiotic kills non-resistant bacteria", marks: 1 },
          { point: "Resistant bacteria survive and reproduce, passing on the resistance allele/gene", marks: 1 },
          { point: "The resistant strain increases / becomes common over many generations", marks: 1 },
        ],
        modelAnswer: "A random mutation makes some bacteria resistant. When the antibiotic is used it kills the non-resistant bacteria, but the resistant ones survive and reproduce, passing on the resistance gene. Over many generations the resistant strain becomes common.",
        mistakeTags: ["missing_key_term", "vague_language"],
      },
    ],
  },
};

export const CHEMISTRY_LESSONS: Record<string, Lesson> = {
  "ionic-bonding": {
    style: "explanation",
    summary: "Explain ionic bonding as the transfer of electrons from a metal atom to a non-metal atom, forming oppositely charged ions held together by strong electrostatic attraction, and draw dot and cross diagrams.",
    knowledge: [
      "Ionic bonding happens between a metal and a non-metal.",
      "Metal atoms lose electrons to form positive ions; non-metal atoms gain electrons to form negative ions.",
      "The ions have the electronic structure of a noble gas (a full outer shell).",
      "Group 1 forms 1+ ions, group 2 forms 2+, group 6 forms 2−, group 7 forms 1−.",
      "Oppositely charged ions are held together by strong electrostatic forces of attraction.",
    ],
    vocabulary: [
      { term: "Ion", meaning: "An atom or group of atoms with a charge, because it has lost or gained electrons." },
      { term: "Electrostatic attraction", meaning: "The force between oppositely charged particles." },
    ],
    recognise: "A compound made of a metal and a non-metal, such as sodium chloride or magnesium oxide, with 'describe what happens' or 'draw a dot and cross diagram'.",
    commandWords: [
      { word: "Describe", meaning: "Say what happens to the electrons, step by step." },
      { word: "Draw", meaning: "Show outer-shell electrons, ion charges in square brackets." },
    ],
    method: [
      { title: "Identify the metal and non-metal", detail: "Use the periodic table to find their groups." },
      { title: "Electrons transferred", detail: "Say how many electrons the metal loses and the non-metal gains." },
      { title: "Ions formed", detail: "Give each ion's charge and say they now have full outer shells." },
      { title: "Attraction", detail: "Say the oppositely charged ions attract by strong electrostatic forces." },
    ],
    mistakes: [
      { tag: "missing_key_term", text: "Saying electrons are 'shared' — that's covalent bonding." },
      { tag: "vague_language", text: "Saying 'the atoms bond' without explaining the electron transfer." },
    ],
    worked: {
      question: "Describe what happens when magnesium reacts with oxygen to form magnesium oxide. Give the charges on the ions. (4 marks)",
      marks: 4,
      steps: [
        {
          prompt: "What happens to the electrons?",
          choices: [
            { text: "Magnesium transfers two electrons to oxygen", correct: true, feedback: "Yes: magnesium is in group 2, oxygen in group 6." },
            { text: "Magnesium and oxygen share two electrons", correct: false, feedback: "Sharing is covalent. A metal and a non-metal transfer electrons.", tag: "missing_key_term" },
            { text: "Oxygen transfers two electrons to magnesium", correct: false, feedback: "Metals lose electrons; non-metals gain them.", tag: "vague_language" },
          ],
          reveal: "Each magnesium atom loses 2 electrons; each oxygen atom gains 2.",
        },
        {
          prompt: "What ions form?",
          choices: [
            { text: "Mg²⁺ and O²⁻", correct: true, feedback: "Correct — both now have the electronic structure of neon." },
            { text: "Mg²⁻ and O²⁺", correct: false, feedback: "Losing electrons gives a positive charge.", tag: "sign_error" },
            { text: "Mg⁺ and O⁻", correct: false, feedback: "Two electrons transfer, so the charges are 2+ and 2−.", tag: "arithmetic_slip" },
          ],
          reveal: "Mg²⁺ and O²⁻ ions form, each with a full outer shell.",
        },
        {
          prompt: "What holds the compound together?",
          choices: [
            { text: "Strong electrostatic attraction between oppositely charged ions", correct: true, feedback: "That's the ionic bond." },
            { text: "Weak forces between molecules", correct: false, feedback: "Ionic compounds aren't molecules: they form giant lattices.", tag: "missing_key_term" },
          ],
          reveal: "The ions are held together by strong electrostatic forces.",
        },
      ],
      finalAnswer: "Magnesium loses two electrons (1), oxygen gains two electrons (1), forming Mg²⁺ and O²⁻ ions (1) which are held together by strong electrostatic attraction (1).",
    },
    guided: [
      {
        question: "What is the charge on a chloride ion?",
        marks: 1,
        answer: { type: "choice", options: ["1+", "1−", "2−", "7−"], correct: 1 },
        hints: ["Chlorine is in group 7.", "It needs to gain one electron to fill its outer shell."],
        solution: "Chlorine gains one electron, so the chloride ion is Cl⁻ (1−).",
      },
      {
        question: "Give the formula of the ionic compound formed between calcium (Ca²⁺) and chloride ions (Cl⁻).",
        marks: 1,
        answer: { type: "text", accept: ["CaCl2", "CaCl₂"] },
        hints: ["The charges must balance to zero.", "You need two 1− ions to balance one 2+ ion."],
        solution: "CaCl₂",
      },
    ],
    exam: [
      {
        question: "Explain why sodium chloride has a high melting point.",
        marks: 3,
        answer: { type: "extended" },
        markScheme: [
          { point: "Giant ionic lattice", marks: 1 },
          { point: "Strong electrostatic forces between oppositely charged ions", marks: 1 },
          { point: "A lot of energy is needed to overcome these forces", marks: 1 },
        ],
        modelAnswer: "Sodium chloride has a giant ionic lattice. There are strong electrostatic forces of attraction between the oppositely charged ions in all directions, so a lot of energy is needed to overcome them.",
        mistakeTags: ["missing_key_term", "vague_language"],
      },
    ],
  },

  "relative-formula-mass": {
    style: "calculation",
    summary: "Calculate relative formula mass (Mr) by adding the relative atomic masses of every atom in a formula, and use it to find the percentage by mass of an element in a compound.",
    knowledge: [
      "Relative atomic mass (Ar) values are on the periodic table.",
      "Mr is the sum of the Ar values of all the atoms in the formula.",
      "A small number after a symbol multiplies that atom only; a number after a bracket multiplies everything inside.",
      "Percentage by mass = (Ar × number of atoms of the element) ÷ Mr × 100.",
    ],
    vocabulary: [
      { term: "Relative atomic mass (Ar)", meaning: "The average mass of an atom of an element compared with 1/12 of a carbon-12 atom." },
      { term: "Relative formula mass (Mr)", meaning: "The sum of the relative atomic masses of the atoms in a formula." },
    ],
    recognise: "Any question asking for Mr, 'relative formula mass', or the percentage of an element in a compound.",
    commandWords: [{ word: "Calculate", meaning: "Show the sum of Ar values, then the answer." }],
    method: [
      { title: "Count the atoms", detail: "List each element and how many atoms of it are in the formula, expanding brackets." },
      { title: "Multiply by Ar", detail: "Multiply each element's Ar by its number of atoms." },
      { title: "Add", detail: "Add the totals to get Mr. Mr has no units." },
    ],
    mistakes: [
      { tag: "arithmetic_slip", text: "Applying a bracket's number to only the first atom inside, e.g. Ca(OH)₂." },
      { tag: "misread_question", text: "Using the atomic number instead of the relative atomic mass." },
    ],
    worked: {
      question: "Calculate the relative formula mass of calcium hydroxide, Ca(OH)₂. (Ar: Ca = 40, O = 16, H = 1)",
      marks: 2,
      steps: [
        {
          prompt: "How many of each atom are there?",
          choices: [
            { text: "1 Ca, 2 O, 2 H", correct: true, feedback: "The 2 multiplies everything in the bracket." },
            { text: "1 Ca, 1 O, 2 H", correct: false, feedback: "The bracket's 2 applies to O as well as H.", tag: "arithmetic_slip" },
          ],
          reveal: "Ca × 1, O × 2, H × 2",
        },
        {
          prompt: "Add up the masses.",
          choices: [
            { text: "40 + (2 × 16) + (2 × 1) = 74", correct: true, feedback: "Mr = 74." },
            { text: "40 + 16 + 1 = 57", correct: false, feedback: "You need to count each atom.", tag: "arithmetic_slip" },
          ],
          reveal: "Mr = 74",
        },
      ],
      finalAnswer: "Mr of Ca(OH)₂ = 74",
    },
    guided: [
      {
        question: "Calculate the Mr of carbon dioxide, CO₂. (C = 12, O = 16)",
        marks: 1,
        answer: { type: "numeric", value: 44 },
        hints: ["There is 1 carbon and 2 oxygen atoms.", "12 + 2 × 16"],
        solution: "12 + 32 = 44",
      },
    ],
    exam: [
      {
        question: "Calculate the percentage by mass of oxygen in magnesium carbonate, MgCO₃. (Mg = 24, C = 12, O = 16). Give your answer to the nearest whole number.",
        marks: 3,
        answer: { type: "numeric", value: 57, tolerance: 0.5, unit: "%" },
        markScheme: [
          { point: "Mr = 24 + 12 + 48 = 84", marks: 1 },
          { point: "48 ÷ 84 × 100", marks: 1 },
          { point: "57%", marks: 1 },
        ],
        modelAnswer: "Mr = 84. Mass of oxygen = 3 × 16 = 48. 48 ÷ 84 × 100 = 57.1… ≈ 57%",
        mistakeTags: ["arithmetic_slip", "incomplete_method"],
      },
    ],
  },

  "factors-affecting-rate": {
    style: "explanation",
    summary: "Explain how temperature, concentration, pressure and surface area change the rate of a reaction, using collision theory: the frequency of collisions and the energy of particles.",
    knowledge: [
      "Reactions happen when particles collide with energy greater than or equal to the activation energy.",
      "Higher concentration or pressure: more particles in the same volume, so more frequent collisions.",
      "Larger surface area (smaller pieces): more particles exposed, so more frequent collisions.",
      "Higher temperature: particles move faster, so collide more often AND more collisions have enough energy to react.",
      "Rate depends on the frequency of successful collisions.",
    ],
    vocabulary: [
      { term: "Activation energy", meaning: "The minimum energy colliding particles need to react." },
      { term: "Successful collision", meaning: "A collision with enough energy to cause a reaction." },
    ],
    recognise: "A change in conditions (heating, more concentrated acid, powder instead of lumps) and 'explain the effect on the rate'.",
    commandWords: [{ word: "Explain", meaning: "Link the change to particles and collisions, then to rate." }],
    method: [
      { title: "Say what changes for the particles", detail: "More particles per volume, more exposed, or more energy." },
      { title: "Say what happens to collisions", detail: "Use 'more frequent collisions' — not just 'more collisions'." },
      { title: "For temperature, add energy", detail: "More particles have energy ≥ activation energy." },
      { title: "Conclude", detail: "So the rate of reaction increases." },
    ],
    mistakes: [
      { tag: "vague_language", text: "Writing 'more collisions' instead of 'more frequent collisions' (collisions per second)." },
      { tag: "missing_key_term", text: "For temperature, forgetting that more particles have at least the activation energy." },
    ],
    worked: {
      question: "Explain why increasing the temperature increases the rate of reaction between magnesium and hydrochloric acid. (3 marks)",
      marks: 3,
      steps: [
        {
          prompt: "What happens to the particles first?",
          choices: [
            { text: "They gain kinetic energy and move faster", correct: true, feedback: "Yes." },
            { text: "There are more particles", correct: false, feedback: "Heating doesn't add particles; that's concentration.", tag: "vague_language" },
          ],
          reveal: "The particles move faster.",
        },
        {
          prompt: "What does that do to collisions?",
          choices: [
            { text: "Collisions are more frequent", correct: true, feedback: "Right — more collisions per second." },
            { text: "Collisions are bigger", correct: false, feedback: "Use precise language: frequency and energy.", tag: "vague_language" },
          ],
          reveal: "More frequent collisions.",
        },
        {
          prompt: "What's the second, more important effect?",
          choices: [
            { text: "More collisions have energy greater than the activation energy", correct: true, feedback: "That's the mark many students miss." },
            { text: "The activation energy decreases", correct: false, feedback: "That's what a catalyst does, not temperature.", tag: "missing_key_term" },
          ],
          reveal: "A greater proportion of collisions are successful.",
        },
      ],
      finalAnswer: "Particles move faster (1) so collide more frequently (1), and more collisions have energy greater than or equal to the activation energy (1), so the rate increases.",
    },
    guided: [
      {
        question: "Powdered calcium carbonate reacts faster with acid than lumps of the same mass. Which statement explains why?",
        marks: 1,
        answer: { type: "choice", options: ["Powder has a larger surface area to volume ratio, so collisions are more frequent", "Powder has lower activation energy", "Powder particles move faster", "Powder contains more particles"], correct: 0 },
        hints: ["The total mass is the same.", "Think about how many particles are exposed to the acid."],
        solution: "Powder has a larger surface area to volume ratio, so more particles are exposed and collisions are more frequent.",
      },
    ],
    exam: [
      {
        question: "Explain how increasing the concentration of an acid affects the rate of its reaction with zinc.",
        marks: 3,
        answer: { type: "extended" },
        markScheme: [
          { point: "More acid particles in the same volume", marks: 1 },
          { point: "More frequent collisions", marks: 1 },
          { point: "Rate of reaction increases", marks: 1 },
        ],
        modelAnswer: "A more concentrated acid has more particles in the same volume, so collisions between acid particles and zinc are more frequent, and the rate increases.",
        mistakeTags: ["vague_language", "missing_key_term"],
      },
    ],
  },
};

export const PHYSICS_LESSONS: Record<string, Lesson> = {
  "speed-and-velocity": {
    style: "calculation",
    summary: "Calculate speed using distance = speed × time, convert units, and explain the difference between speed (a scalar) and velocity (a vector).",
    knowledge: [
      "distance travelled = speed × time (s = vt).",
      "Speed is a scalar; velocity is speed in a given direction (a vector).",
      "Typical speeds: walking about 1.5 m/s, cycling about 6 m/s, cars on a motorway about 30 m/s.",
      "Convert km to m (× 1000) and minutes to seconds (× 60) before calculating in m/s.",
    ],
    vocabulary: [
      { term: "Scalar", meaning: "A quantity with size only, such as speed or distance." },
      { term: "Vector", meaning: "A quantity with size and direction, such as velocity or displacement." },
    ],
    recognise: "Questions with a distance and a time, or asking for 'average speed'.",
    commandWords: [
      { word: "Calculate", meaning: "Write the equation, substitute, then give the answer with units." },
      { word: "Estimate", meaning: "Use typical values you know." },
    ],
    method: [
      { title: "Write the equation", detail: "distance = speed × time, rearranged for what you need." },
      { title: "Convert units", detail: "Use metres and seconds unless the question says otherwise." },
      { title: "Substitute and calculate", detail: "Show the numbers in the equation." },
      { title: "Give units", detail: "m/s for speed, m for distance, s for time." },
    ],
    mistakes: [
      { tag: "unit_conversion", text: "Dividing kilometres by minutes and calling it m/s." },
      { tag: "missing_units", text: "Leaving the unit off the answer." },
      { tag: "rearranging_error", text: "Multiplying when you should divide: speed = distance ÷ time." },
    ],
    worked: {
      question: "A cyclist travels 3.6 km in 10 minutes. Calculate her average speed in m/s. (3 marks)",
      marks: 3,
      steps: [
        {
          prompt: "Convert the units first.",
          choices: [
            { text: "3600 m and 600 s", correct: true, feedback: "Both in SI units." },
            { text: "3.6 m and 10 s", correct: false, feedback: "Kilometres and minutes need converting.", tag: "unit_conversion" },
            { text: "3600 m and 10 s", correct: false, feedback: "Minutes need converting to seconds too.", tag: "unit_conversion" },
          ],
          reveal: "distance = 3600 m, time = 600 s",
        },
        {
          prompt: "Choose the equation.",
          choices: [
            { text: "speed = distance ÷ time", correct: true, feedback: "Rearranged from s = vt." },
            { text: "speed = distance × time", correct: false, feedback: "That would give a huge number with the wrong units.", tag: "rearranging_error" },
          ],
          reveal: "speed = 3600 ÷ 600",
        },
        {
          prompt: "Calculate.",
          choices: [
            { text: "6 m/s", correct: true, feedback: "A typical cycling speed — a good sense check." },
            { text: "0.36 m/s", correct: false, feedback: "You've divided the original numbers.", tag: "unit_conversion" },
          ],
          reveal: "speed = 6 m/s",
        },
      ],
      finalAnswer: "6 m/s",
    },
    guided: [
      {
        question: "A car travels at 25 m/s for 40 s. How far does it travel, in metres?",
        marks: 2,
        answer: { type: "numeric", value: 1000, unit: "m" },
        hints: ["distance = speed × time", "25 × 40"],
        solution: "25 × 40 = 1000 m",
      },
    ],
    exam: [
      {
        question: "A train travels 150 km in 1.25 hours. Calculate its average speed in m/s.",
        marks: 3,
        answer: { type: "numeric", value: 33.3, tolerance: 0.05, unit: "m/s" },
        markScheme: [
          { point: "Converts to 150 000 m and 4500 s", marks: 1 },
          { point: "150 000 ÷ 4500", marks: 1 },
          { point: "33.3 m/s", marks: 1 },
        ],
        modelAnswer: "150 km = 150 000 m. 1.25 h = 4500 s. Speed = 150 000 ÷ 4500 = 33.3 m/s",
        mistakeTags: ["unit_conversion", "missing_units"],
      },
      {
        question: "Explain why a car driving around a roundabout at a constant speed does not have a constant velocity.",
        marks: 2,
        answer: { type: "extended" },
        markScheme: [
          { point: "Velocity is a vector / includes direction", marks: 1 },
          { point: "The car's direction is changing", marks: 1 },
        ],
        modelAnswer: "Velocity is speed in a given direction. On a roundabout the direction keeps changing, so the velocity changes even though the speed is constant.",
        mistakeTags: ["missing_key_term"],
      },
    ],
  },

  "kinetic-energy": {
    style: "calculation",
    summary: "Calculate the kinetic energy of a moving object using Eₖ = ½mv², rearrange it to find mass or speed, and see why doubling speed quadruples kinetic energy.",
    knowledge: [
      "Eₖ = ½ × m × v², with m in kg, v in m/s and Eₖ in joules (J).",
      "Only the speed is squared, not the mass or the ½.",
      "Doubling the speed makes the kinetic energy four times bigger.",
      "To find v: v = √(2Eₖ ÷ m).",
    ],
    vocabulary: [{ term: "Kinetic energy store", meaning: "Energy an object has because it is moving." }],
    recognise: "A moving object with a mass and a speed, or a question about energy when something speeds up or slows down.",
    commandWords: [{ word: "Calculate", meaning: "Write the equation, substitute, give the answer with units." }],
    method: [
      { title: "Convert", detail: "Mass in kg (g ÷ 1000), speed in m/s." },
      { title: "Square the speed first", detail: "Work out v² before multiplying." },
      { title: "Multiply by ½ and m", detail: "Give the answer in J." },
    ],
    mistakes: [
      { tag: "wrong_formula", text: "Squaring the whole of ½mv rather than just v." },
      { tag: "unit_conversion", text: "Using grams instead of kilograms." },
      { tag: "incomplete_method", text: "Forgetting the square root when finding v." },
    ],
    worked: {
      question: "A 1200 kg car travels at 15 m/s. Calculate its kinetic energy. (2 marks)",
      marks: 2,
      steps: [
        {
          prompt: "What's v²?",
          choices: [
            { text: "225", correct: true, feedback: "15² = 225." },
            { text: "30", correct: false, feedback: "Squaring isn't doubling.", tag: "arithmetic_slip" },
          ],
          reveal: "v² = 225",
        },
        {
          prompt: "Finish the calculation.",
          choices: [
            { text: "½ × 1200 × 225 = 135 000 J", correct: true, feedback: "Correct." },
            { text: "1200 × 225 = 270 000 J", correct: false, feedback: "Don't forget the ½.", tag: "wrong_formula" },
          ],
          reveal: "Eₖ = 135 000 J",
        },
      ],
      finalAnswer: "135 000 J (135 kJ)",
    },
    guided: [
      {
        question: "A 0.5 kg ball is thrown at 8 m/s. Calculate its kinetic energy in joules.",
        marks: 2,
        answer: { type: "numeric", value: 16, unit: "J" },
        hints: ["Square the speed: 8² = 64.", "½ × 0.5 × 64"],
        solution: "½ × 0.5 × 64 = 16 J",
      },
    ],
    exam: [
      {
        question: "A 60 kg runner has 1920 J of kinetic energy. Calculate her speed.",
        marks: 3,
        answer: { type: "numeric", value: 8, tolerance: 0.01, unit: "m/s" },
        markScheme: [
          { point: "v² = 2 × 1920 ÷ 60", marks: 1 },
          { point: "v² = 64", marks: 1 },
          { point: "v = 8 m/s", marks: 1 },
        ],
        modelAnswer: "v² = 2Eₖ ÷ m = 3840 ÷ 60 = 64, so v = 8 m/s",
        mistakeTags: ["rearranging_error", "incomplete_method"],
      },
    ],
  },

  "potential-difference-resistance": {
    style: "calculation",
    summary: "Use V = IR to calculate potential difference, current or resistance, and explain how increasing resistance reduces the current for the same potential difference.",
    knowledge: [
      "potential difference (V) = current (A) × resistance (Ω).",
      "For a fixed potential difference, a bigger resistance means a smaller current.",
      "An ammeter is placed in series; a voltmeter is placed in parallel with the component.",
      "Current in mA must be converted to A (÷ 1000).",
    ],
    vocabulary: [
      { term: "Potential difference", meaning: "The energy transferred per unit charge between two points, measured in volts." },
      { term: "Resistance", meaning: "How much a component opposes the current, measured in ohms (Ω)." },
    ],
    recognise: "Two of voltage, current and resistance are given and the third is asked for.",
    commandWords: [{ word: "Calculate", meaning: "Rearrange V = IR, substitute and give units." }],
    method: [
      { title: "Write V = IR", detail: "Then rearrange: I = V ÷ R or R = V ÷ I." },
      { title: "Convert", detail: "mA to A, kΩ to Ω." },
      { title: "Substitute and calculate", detail: "Give the unit: V, A or Ω." },
    ],
    mistakes: [
      { tag: "rearranging_error", text: "Working out R = I ÷ V instead of V ÷ I." },
      { tag: "unit_conversion", text: "Using milliamps as if they were amps." },
    ],
    worked: {
      question: "A current of 0.5 A flows through a resistor with a potential difference of 6 V across it. Calculate its resistance. (2 marks)",
      marks: 2,
      steps: [
        {
          prompt: "Rearrange V = IR for R.",
          choices: [
            { text: "R = V ÷ I", correct: true, feedback: "Correct." },
            { text: "R = I ÷ V", correct: false, feedback: "Divide both sides of V = IR by I.", tag: "rearranging_error" },
            { text: "R = V × I", correct: false, feedback: "That's the power equation's shape, not resistance.", tag: "wrong_formula" },
          ],
          reveal: "R = V ÷ I",
        },
        {
          prompt: "Calculate.",
          choices: [
            { text: "6 ÷ 0.5 = 12 Ω", correct: true, feedback: "Yes." },
            { text: "6 ÷ 0.5 = 3 Ω", correct: false, feedback: "Dividing by 0.5 doubles the number.", tag: "arithmetic_slip" },
          ],
          reveal: "R = 12 Ω",
        },
      ],
      finalAnswer: "12 Ω",
    },
    guided: [
      {
        question: "A 9 V battery is connected to a 45 Ω resistor. Calculate the current in amps.",
        marks: 2,
        answer: { type: "numeric", value: 0.2, unit: "A" },
        hints: ["I = V ÷ R", "9 ÷ 45"],
        solution: "I = 9 ÷ 45 = 0.2 A",
      },
    ],
    exam: [
      {
        question: "A current of 250 mA flows through a lamp of resistance 24 Ω. Calculate the potential difference across the lamp.",
        marks: 3,
        answer: { type: "numeric", value: 6, unit: "V" },
        markScheme: [
          { point: "Converts 250 mA to 0.25 A", marks: 1 },
          { point: "V = 0.25 × 24", marks: 1 },
          { point: "6 V", marks: 1 },
        ],
        modelAnswer: "I = 0.25 A. V = IR = 0.25 × 24 = 6 V",
        mistakeTags: ["unit_conversion", "missing_units"],
      },
    ],
  },
};
