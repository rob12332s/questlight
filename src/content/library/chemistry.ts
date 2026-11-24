import type { SubjectLibrary } from "./types";

/**
 * GCSE Chemistry, following the DfE GCSE chemistry subject content shared by all boards.
 * "sep" marks content usually only in separate Chemistry; this varies by board, so all
 * entries stay "awaiting verification" until checked against a specification.
 */
export const CHEMISTRY_LIBRARY: SubjectLibrary = {
  subject: "chemistry",
  defaults: { coverage: "shared", verification: "awaiting_verification" },
  areas: [
    {
      area: "Atomic structure and the periodic table",
      flags: { quiz: "chemistry/atomic-structure" },
      groups: [
        {
          subtopic: "Atoms",
          topics: [
            ["atoms-elements-compounds", "Atoms, elements and compounds", "Tell atoms, elements, compounds and mixtures apart and name compounds", "recall", { d: "f" }],
            ["separating-mixtures", "Separating mixtures", "Choose filtration, crystallisation, distillation or chromatography to separate a mixture", "practical"],
            ["atomic-model-history", "Development of the atomic model", "Describe how the atomic model changed from the plum pudding model to the nuclear model", "explain"],
            ["subatomic-particles", "Protons, neutrons and electrons", "Use atomic number and mass number to find the numbers of subatomic particles", "calc", { d: "f" }],
            ["isotopes-and-relative-mass", "Isotopes and relative atomic mass", "Explain isotopes and calculate relative atomic mass from abundances", "calc"],
            ["size-of-atoms", "Size and mass of atoms", "Describe the sizes of atoms and nuclei and the relative masses of subatomic particles using standard form", "recall"],
            ["electron-configuration", "Electronic structure", "Write electronic structures for the first 20 elements and link them to the periodic table", "recall"],
          ],
        },
        {
          subtopic: "The periodic table",
          flags: { quiz: "combined-science/periodic-table" },
          topics: [
            ["periodic-table-history", "Developing the periodic table", "Explain how Mendeleev arranged the periodic table and why he left gaps", "explain"],
            ["metals-and-non-metals", "Metals and non-metals", "Compare the properties and positions of metals and non-metals", "compare", { d: "f" }],
            ["group-1", "Group 1: the alkali metals", "Explain the reactions and reactivity trend of the alkali metals", "explain"],
            ["group-7", "Group 7: the halogens", "Explain the properties, displacement reactions and reactivity trend of the halogens", "explain"],
            ["group-0", "Group 0: the noble gases", "Explain why the noble gases are unreactive and describe their boiling point trend", "explain", { d: "f" }],
            ["transition-metals", "Transition metals", "Compare transition metals with group 1 and describe their coloured compounds and catalytic uses", "compare", { sep: true }],
          ],
        },
      ],
    },
    {
      area: "Bonding, structure and properties",
      flags: { quiz: "chemistry/bonding-structure" },
      groups: [
        {
          subtopic: "Bonding",
          topics: [
            ["ionic-bonding", "Ionic bonding", "Explain ionic bonding with dot and cross diagrams and work out ionic formulae", "explain"],
            ["forming-ions", "Forming ions", "Work out the charge on an ion from its group and draw its electronic structure", "recall"],
            ["ionic-compounds", "Ionic compounds", "Explain the properties of giant ionic lattices", "explain"],
            ["covalent-bonding", "Covalent bonding", "Draw dot and cross diagrams for simple covalent molecules", "explain"],
            ["simple-molecules", "Simple molecular substances", "Explain why simple molecules have low melting points and don't conduct", "explain"],
            ["metallic-bonding", "Metallic bonding and alloys", "Explain metallic bonding, the properties of metals and why alloys are harder", "explain"],
          ],
        },
        {
          subtopic: "Structure and properties",
          topics: [
            ["states-of-matter", "States of matter and state symbols", "Use the particle model and state symbols, and explain its limitations", "recall", { d: "f" }],
            ["giant-covalent", "Diamond, graphite and silicon dioxide", "Explain the properties of giant covalent structures", "explain"],
            ["graphene-and-fullerenes", "Graphene and fullerenes", "Describe the structure and uses of graphene, fullerenes and nanotubes", "apply"],
            ["polymers-structure", "Polymers", "Describe polymer structure and link it to properties", "recall"],
            ["nanoparticles", "Nanoparticles", "Describe nanoparticles, their surface area to volume ratio, uses and risks", "evaluate", { sep: true }],
          ],
        },
      ],
    },
    {
      area: "Quantitative chemistry",
      flags: { quiz: "chemistry/quantitative-chemistry" },
      groups: [
        {
          subtopic: "Mass and moles",
          topics: [
            ["conservation-of-mass", "Conservation of mass", "Explain conservation of mass and apparent mass changes in open systems", "explain", { d: "f" }],
            ["balancing-equations", "Balancing equations", "Balance symbol equations, including half equations at higher tier", "recall"],
            ["relative-formula-mass", "Relative formula mass", "Calculate relative formula mass and percentage mass of an element", "calc", { d: "f" }],
            ["empirical-formulae", "Empirical formulae", "Find the empirical formula of a compound from reacting masses", "calc", { coverage: "general" }],
            ["moles", "The mole", "Use the Avogadro constant and calculate moles from mass", "calc", { t: "h" }],
            ["reacting-masses", "Reacting masses", "Calculate masses of reactants and products from balanced equations", "calc", { t: "h" }],
            ["limiting-reactants", "Limiting reactants", "Identify limiting reactants and their effect on the amount of product", "problem", { t: "h", d: "c" }],
            ["equations-from-masses", "Balancing equations from masses", "Use reacting masses and moles to work out the balanced equation for a reaction", "calc", { t: "h", d: "c" }],
          ],
        },
        {
          subtopic: "Solutions and yield",
          topics: [
            ["concentration", "Concentration of solutions", "Calculate concentration in g/dm³ and mol/dm³", "calc"],
            ["titration-calculations", "Titration calculations", "Calculate unknown concentrations from titration results", "calc", { sep: true, t: "h", d: "c" }],
            ["percentage-yield", "Percentage yield", "Calculate percentage yield and explain why it is below 100%", "calc", { sep: true }],
            ["atom-economy", "Atom economy", "Calculate atom economy and explain why it matters for sustainability", "calc", { sep: true }],
            ["gas-volumes", "Volumes of gases", "Use the molar volume of a gas at room temperature and pressure", "calc", { sep: true, t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Chemical changes",
      flags: { quiz: "chemistry/chemical-changes" },
      groups: [
        {
          subtopic: "Reactivity and extraction",
          topics: [
            ["reactivity-series", "The reactivity series", "Use the reactivity series to predict displacement reactions", "apply", { d: "f" }],
            ["extracting-metals", "Extracting metals", "Explain extraction by reduction with carbon and by electrolysis", "explain"],
            ["oxidation-and-reduction", "Oxidation and reduction", "Define oxidation and reduction in terms of oxygen and electrons, and write ionic equations", "explain", { t: "h" }],
          ],
        },
        {
          subtopic: "Acids and salts",
          topics: [
            ["acids-and-metals", "Acids and metals", "Describe reactions of acids with metals and name the salts produced", "recall", { d: "f" }],
            ["neutralisation", "Neutralisation", "Describe reactions of acids with bases and carbonates and write equations", "explain"],
            ["making-salts", "Making soluble salts", "Describe how to make a pure, dry soluble salt", "practical"],
            ["insoluble-salts", "Making insoluble salts", "Prepare an insoluble salt by precipitation using solubility rules", "practical", { coverage: "general" }],
            ["ph-scale", "The pH scale", "Use the pH scale and indicators and describe neutralisation using ions", "recall"],
            ["strong-and-weak-acids", "Strong and weak acids", "Explain the difference between strong, weak, concentrated and dilute acids and how pH relates to H⁺ concentration", "explain", { t: "h", d: "c" }],
            ["titration-practical", "Titration", "Describe how to carry out an accurate titration", "practical", { sep: true }],
          ],
        },
        {
          subtopic: "Electrolysis",
          topics: [
            ["electrolysis-basics", "Electrolysis", "Explain what happens at each electrode during electrolysis of molten compounds", "explain"],
            ["electrolysis-of-solutions", "Electrolysis of solutions", "Predict the products of electrolysing aqueous solutions", "apply"],
            ["aluminium-extraction", "Extracting aluminium", "Explain why cryolite is used and why the anodes must be replaced", "explain"],
            ["half-equations", "Half equations at electrodes", "Write half equations for reactions at the electrodes", "recall", { t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Energy changes",
      groups: [
        {
          subtopic: "Energy changes",
          topics: [
            ["exothermic-endothermic", "Exothermic and endothermic reactions", "Classify reactions as exothermic or endothermic and give examples", "recall", { d: "f" }],
            ["temperature-change-practical", "Measuring temperature changes", "Investigate the temperature change in reactions", "practical"],
            ["reaction-profiles", "Reaction profiles", "Draw reaction profiles showing activation energy and energy change", "graph"],
            ["bond-energies", "Bond energy calculations", "Calculate the energy change of a reaction from bond energies", "calc", { t: "h" }],
            ["cells-and-batteries", "Cells and batteries", "Describe how chemical cells and batteries produce a voltage", "explain", { sep: true }],
            ["fuel-cells", "Fuel cells", "Compare hydrogen fuel cells with rechargeable batteries", "evaluate", { sep: true }],
          ],
        },
      ],
    },
    {
      area: "Rates and equilibrium",
      flags: { quiz: "chemistry/rates-of-reaction" },
      groups: [
        {
          subtopic: "Rates of reaction",
          topics: [
            ["measuring-rate", "Measuring rates of reaction", "Calculate mean rate from data and the gradient of a tangent on a graph", "calc"],
            ["rate-graphs", "Interpreting rate graphs", "Interpret graphs of product formed against time and compare the rates of different reactions", "graph"],
            ["collision-theory", "Collision theory", "Explain rate using collision theory and activation energy", "explain"],
            ["factors-affecting-rate", "Factors affecting rate", "Explain how temperature, concentration, pressure and surface area affect rate", "explain"],
            ["catalysts", "Catalysts", "Explain how catalysts increase rate without being used up", "explain"],
            ["rate-practical", "Investigating rate", "Investigate how concentration affects rate by measuring gas or turbidity", "practical"],
          ],
        },
        {
          subtopic: "Reversible reactions",
          topics: [
            ["reversible-reactions", "Reversible reactions", "Describe reversible reactions and energy changes in each direction", "recall"],
            ["dynamic-equilibrium", "Dynamic equilibrium", "Describe dynamic equilibrium in a closed system", "explain"],
            ["le-chatelier", "Changing conditions at equilibrium", "Predict how temperature, pressure and concentration shift the position of equilibrium", "apply", { t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Organic chemistry",
      flags: { quiz: "chemistry/organic-chemistry" },
      groups: [
        {
          subtopic: "Hydrocarbons",
          topics: [
            ["crude-oil-and-alkanes", "Crude oil and alkanes", "Describe crude oil as a mixture of hydrocarbons and name the first four alkanes", "recall", { d: "f" }],
            ["fractional-distillation", "Fractional distillation", "Explain how fractional distillation separates crude oil and how properties change with chain length", "explain"],
            ["combustion", "Combustion of hydrocarbons", "Write equations for the complete combustion of hydrocarbons", "recall"],
            ["cracking", "Cracking and alkenes", "Describe cracking, the test for alkenes and why cracking is useful", "explain"],
          ],
        },
        {
          subtopic: "Reactions and polymers",
          flags: { sep: true },
          topics: [
            ["alkene-reactions", "Reactions of alkenes", "Describe addition reactions of alkenes with hydrogen, water and halogens", "explain"],
            ["alcohols", "Alcohols", "Describe the properties, reactions and uses of alcohols, including fermentation", "recall"],
            ["carboxylic-acids", "Carboxylic acids and esters", "Describe carboxylic acids and how esters form", "recall"],
            ["addition-polymerisation", "Addition polymerisation", "Draw repeating units for addition polymers", "explain"],
            ["condensation-polymerisation", "Condensation polymers", "Explain condensation polymerisation and compare it with addition polymerisation", "compare", { t: "h", d: "c" }],
            ["natural-polymers", "Natural polymers and DNA", "Describe amino acids, proteins, starch, cellulose and DNA as polymers", "recall"],
          ],
        },
      ],
    },
    {
      area: "Chemical analysis",
      groups: [
        {
          subtopic: "Analysis",
          topics: [
            ["pure-substances", "Pure substances and formulations", "Identify pure substances from melting points and describe formulations", "recall", { d: "f" }],
            ["chromatography", "Chromatography", "Carry out paper chromatography and calculate Rf values", "practical"],
            ["gas-tests", "Tests for gases", "Describe the tests for hydrogen, oxygen, carbon dioxide and chlorine", "recall", { d: "f" }],
            ["flame-tests", "Flame tests", "Identify metal ions using flame tests", "practical", { sep: true }],
            ["metal-hydroxides", "Metal hydroxide precipitates", "Identify metal ions using sodium hydroxide", "practical", { sep: true }],
            ["anion-tests", "Tests for anions", "Identify carbonate, halide and sulfate ions", "practical", { sep: true }],
            ["instrumental-analysis", "Instrumental analysis", "Describe the advantages of instrumental methods and interpret flame emission spectra", "data", { sep: true, d: "c" }],
          ],
        },
      ],
    },
    {
      area: "The atmosphere",
      groups: [
        {
          subtopic: "Earth's atmosphere",
          topics: [
            ["early-atmosphere", "The early atmosphere", "Explain how the atmosphere has changed over time", "explain"],
            ["greenhouse-gases", "Greenhouse gases", "Explain the greenhouse effect and which human activities increase greenhouse gases", "explain"],
            ["climate-change-chemistry", "Climate change", "Evaluate the evidence for and effects of climate change and ways to reduce emissions", "evaluate"],
            ["carbon-footprint", "Carbon footprints", "Explain what a carbon footprint is, why it is hard to measure and how it can be reduced", "evaluate"],
            ["atmospheric-pollutants", "Atmospheric pollutants", "Describe the sources and effects of carbon monoxide, sulfur dioxide, nitrogen oxides and particulates", "recall"],
          ],
        },
      ],
    },
    {
      area: "Using resources",
      flags: { quiz: "combined-science/using-resources" },
      groups: [
        {
          subtopic: "Resources and sustainability",
          topics: [
            ["sustainable-development", "Using Earth's resources", "Explain sustainable development and the role of chemistry", "explain", { d: "f" }],
            ["potable-water", "Potable water", "Describe how potable water is produced from fresh water and sea water", "explain"],
            ["waste-water", "Waste water treatment", "Describe the stages of sewage treatment", "recall"],
            ["phytomining-bioleaching", "Phytomining and bioleaching", "Describe alternative methods of extracting metals from low-grade ores", "explain", { t: "h" }],
            ["life-cycle-assessment", "Life cycle assessments", "Carry out and evaluate simple life cycle assessments", "evaluate"],
            ["recycling", "Reduce, reuse, recycle", "Evaluate ways of reducing the use of resources", "evaluate"],
            ["corrosion", "Corrosion and its prevention", "Explain rusting and how barriers and sacrificial protection prevent it", "explain", { sep: true }],
            ["alloys-uses", "Alloys as useful materials", "Describe the composition and uses of bronze, brass, gold alloys, steels and aluminium alloys", "recall", { sep: true }],
            ["ceramics-composites", "Ceramics, polymers and composites", "Compare the properties and uses of glass, ceramics, composites and thermosoftening and thermosetting polymers", "compare", { sep: true }],
            ["haber-process", "The Haber process", "Explain the conditions used in the Haber process as a compromise", "evaluate", { sep: true, t: "h", d: "c" }],
            ["npk-fertilisers", "NPK fertilisers", "Describe how fertilisers are made in the lab and industry", "recall", { sep: true }],
          ],
        },
      ],
    },
    {
      area: "Working scientifically",
      flags: { coverage: "general" },
      groups: [
        {
          subtopic: "Skills for chemistry",
          topics: [
            ["hazards-and-risk", "Hazards and risk assessment", "Identify hazards in practicals and describe how to reduce risk", "practical", { d: "f" }],
            ["chemistry-data", "Data and uncertainty in chemistry", "Calculate means and uncertainty and spot anomalies", "data"],
            ["six-mark-answers-chemistry", "Writing six-mark answers", "Plan extended answers that link observations to chemical explanations", "explain", { d: "c" }],
          ],
        },
      ],
    },
  ],
};
