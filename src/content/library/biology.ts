import type { SubjectLibrary } from "./types";

/**
 * GCSE Biology. Topics follow the DfE GCSE biology subject content that all boards
 * share; board order and paper split differ, so no paper is given. "sep" marks content
 * taught in separate Biology but not Combined Science — this is board-dependent, so every
 * entry stays "awaiting verification" until checked against the chosen specification.
 */
export const BIOLOGY_LIBRARY: SubjectLibrary = {
  subject: "biology",
  defaults: { coverage: "shared", verification: "awaiting_verification" },
  areas: [
    {
      area: "Cell biology",
      flags: { quiz: "biology/cell-biology" },
      groups: [
        {
          subtopic: "Cell structure",
          topics: [
            ["animal-and-plant-cells", "Animal and plant cells", "Describe the parts of animal and plant cells and the function of each", "recall", { d: "f" }],
            ["eukaryotes-and-prokaryotes", "Eukaryotic and prokaryotic cells", "Compare eukaryotic and prokaryotic cells, including the size and structure of bacteria", "compare"],
            ["specialised-cells", "Specialised cells", "Explain how sperm, nerve, muscle, root hair, xylem and phloem cells are adapted to their functions", "explain"],
            ["cell-differentiation", "Cell differentiation", "Explain how cells differentiate and how this differs in animals and plants", "explain"],
            ["microscopy", "Microscopy and magnification", "Compare light and electron microscopes and calculate magnification, including in standard form", "calc"],
            ["culturing-microorganisms", "Culturing microorganisms", "Describe aseptic technique and calculate bacterial growth and the area of inhibition zones", "practical", { sep: true }],
          ],
        },
        {
          subtopic: "Cell division",
          topics: [
            ["chromosomes", "Chromosomes and genes", "Describe chromosomes, genes and DNA in the nucleus", "recall", { d: "f" }],
            ["mitosis-and-cell-cycle", "Mitosis and the cell cycle", "Describe the stages of the cell cycle and explain the role of mitosis in growth and repair", "explain"],
            ["stem-cells", "Stem cells", "Describe embryonic, adult and plant stem cells and evaluate their use in medicine", "evaluate"],
          ],
        },
        {
          subtopic: "Transport in cells",
          topics: [
            ["diffusion", "Diffusion", "Explain diffusion and the factors that affect its rate, including surface area to volume ratio", "explain"],
            ["osmosis", "Osmosis", "Explain osmosis and analyse results from the potato osmosis practical", "practical"],
            ["active-transport", "Active transport", "Explain active transport and compare it with diffusion and osmosis", "compare"],
            ["exchange-surfaces", "Adaptations of exchange surfaces", "Explain how exchange surfaces such as alveoli, villi and gills are adapted for efficient exchange", "apply", { d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Organisation",
      flags: { quiz: "biology/organisation" },
      groups: [
        {
          subtopic: "Digestion and enzymes",
          topics: [
            ["levels-of-organisation", "Cells, tissues, organs and systems", "Describe the levels of organisation in multicellular organisms", "recall", { d: "f" }],
            ["digestive-system", "The digestive system", "Describe how the organs of the digestive system work together to digest and absorb food", "explain"],
            ["enzymes-lock-and-key", "Enzymes and the lock and key model", "Explain enzyme action using the lock and key model and why enzymes denature", "explain"],
            ["enzyme-rate-practical", "Factors affecting enzyme activity", "Investigate and explain how temperature and pH affect the rate of enzyme activity", "practical"],
            ["digestive-enzymes", "Digestive enzymes and bile", "Describe the roles of carbohydrases, proteases, lipases and bile", "recall"],
            ["food-tests", "Food tests", "Describe the tests for starch, sugars, protein and lipids", "practical", { d: "f" }],
          ],
        },
        {
          subtopic: "Heart, blood and lungs",
          topics: [
            ["the-heart", "The heart", "Describe the structure of the heart and the route blood takes through it", "explain"],
            ["blood-vessels", "Blood vessels", "Compare arteries, veins and capillaries and link structure to function", "compare"],
            ["blood-components", "Blood", "Describe the functions of red blood cells, white blood cells, platelets and plasma", "recall"],
            ["gas-exchange-lungs", "The lungs and gas exchange", "Explain how the lungs are adapted for gas exchange", "explain"],
            ["heart-rate-and-pacemaker", "Heart rate and pacemakers", "Explain how heart rate is controlled and calculate cardiac output or rates from data", "data"],
            ["coronary-heart-disease", "Coronary heart disease and treatments", "Evaluate treatments for heart disease, including stents, statins and transplants", "evaluate"],
          ],
        },
        {
          subtopic: "Health and disease",
          topics: [
            ["health-and-disease", "Health and non-communicable disease", "Describe how communicable and non-communicable diseases and lifestyle factors affect health", "explain"],
            ["cancer", "Cancer", "Describe benign and malignant tumours and risk factors for cancer", "recall"],
            ["risk-factors-data", "Interpreting health data", "Interpret data on risk factors and explain correlation versus causation", "data", { d: "c" }],
          ],
        },
        {
          subtopic: "Plant tissues and transport",
          topics: [
            ["plant-tissues", "Plant tissues and the leaf", "Describe the tissues in a leaf and how they are adapted", "recall"],
            ["xylem-and-phloem", "Xylem and phloem", "Compare transport in the xylem and phloem", "compare"],
            ["transpiration", "Transpiration", "Explain transpiration and how temperature, humidity, light and air movement affect its rate", "explain"],
            ["stomata", "Stomata and guard cells", "Explain how guard cells control gas exchange and water loss", "explain"],
          ],
        },
      ],
    },
    {
      area: "Infection and response",
      flags: { quiz: "biology/infection-and-response" },
      groups: [
        {
          subtopic: "Pathogens and disease",
          topics: [
            ["pathogens", "Pathogens and how they spread", "Describe how viruses, bacteria, fungi and protists cause disease and spread", "recall", { d: "f" }],
            ["viral-diseases", "Viral diseases", "Describe measles, HIV and tobacco mosaic virus and how they are controlled", "recall"],
            ["bacterial-diseases", "Bacterial diseases", "Describe salmonella and gonorrhoea, their symptoms and control", "recall"],
            ["fungal-and-protist-diseases", "Fungal and protist diseases", "Describe rose black spot and malaria and how their spread is reduced", "recall"],
            ["plant-disease-defences", "Plant diseases and defences", "Describe signs of plant disease and plants' physical, chemical and mechanical defences", "explain", { sep: true }],
          ],
        },
        {
          subtopic: "Defence and treatment",
          topics: [
            ["non-specific-defences", "The body's first defences", "Describe how the skin, nose, trachea and stomach stop pathogens entering", "recall"],
            ["immune-system", "The immune system", "Explain how white blood cells use phagocytosis, antibodies and antitoxins", "explain"],
            ["vaccination", "Vaccination", "Explain how vaccination gives immunity and how herd immunity protects populations", "explain"],
            ["antibiotics-and-painkillers", "Antibiotics and painkillers", "Explain why antibiotics treat bacterial but not viral infections, and the rise of resistance", "explain"],
            ["drug-development", "Developing new drugs", "Describe preclinical and clinical trials, including double-blind trials and placebos", "evaluate"],
            ["monoclonal-antibodies", "Monoclonal antibodies", "Describe how monoclonal antibodies are produced and used in diagnosis and treatment", "apply", { sep: true, t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Bioenergetics",
      flags: { quiz: "biology/bioenergetics" },
      groups: [
        {
          subtopic: "Photosynthesis",
          topics: [
            ["photosynthesis-equation", "Photosynthesis", "Write the word and symbol equations for photosynthesis and explain why it is endothermic", "recall"],
            ["limiting-factors", "Limiting factors", "Explain how light, carbon dioxide and temperature limit the rate of photosynthesis", "explain"],
            ["photosynthesis-practical", "Investigating photosynthesis", "Investigate light intensity and photosynthesis and use the inverse square law", "practical", { d: "c" }],
            ["uses-of-glucose", "Uses of glucose in plants", "Describe how plants use the glucose made in photosynthesis", "recall", { d: "f" }],
          ],
        },
        {
          subtopic: "Respiration",
          topics: [
            ["aerobic-respiration", "Aerobic respiration", "Write the equation for aerobic respiration and explain why organisms need energy", "recall"],
            ["anaerobic-respiration", "Anaerobic respiration", "Compare anaerobic respiration in muscles, plants and yeast with aerobic respiration", "compare"],
            ["response-to-exercise", "Exercise and oxygen debt", "Explain how the body responds to exercise, including oxygen debt", "explain"],
            ["metabolism", "Metabolism", "Describe metabolism as the sum of all reactions and give examples", "recall"],
          ],
        },
      ],
    },
    {
      area: "Homeostasis and response",
      flags: { quiz: "biology/homeostasis-response" },
      groups: [
        {
          subtopic: "Nervous system",
          topics: [
            ["homeostasis", "Homeostasis", "Explain homeostasis and the roles of receptors, coordination centres and effectors", "explain", { d: "f" }],
            ["nervous-system", "The nervous system", "Describe how impulses travel from receptors to effectors", "explain"],
            ["reflex-arc", "Reflex actions", "Explain the reflex arc and why reflexes are fast and automatic", "explain"],
            ["reaction-time-practical", "Investigating reaction time", "Plan and evaluate an investigation into reaction time", "practical"],
            ["the-brain", "The brain", "Describe the functions of the cerebral cortex, cerebellum and medulla and how the brain is studied", "recall", { sep: true }],
            ["the-eye", "The eye", "Explain accommodation and how myopia and hyperopia are corrected", "explain", { sep: true }],
            ["thermoregulation", "Controlling body temperature", "Explain how the body responds when it is too hot or too cold", "explain", { sep: true }],
          ],
        },
        {
          subtopic: "Hormones",
          topics: [
            ["endocrine-system", "The endocrine system", "Describe the main endocrine glands and compare hormonal and nervous control", "compare"],
            ["blood-glucose", "Controlling blood glucose", "Explain how insulin and glucagon control blood glucose concentration", "explain"],
            ["diabetes", "Diabetes", "Compare type 1 and type 2 diabetes and their treatment", "compare"],
            ["kidneys-and-water", "The kidneys and water balance", "Explain how the kidneys and ADH control water balance, and compare dialysis with transplants", "explain", { sep: true, d: "c" }],
            ["menstrual-cycle", "Hormones in reproduction", "Describe the hormones of the menstrual cycle and how they interact", "explain"],
            ["contraception", "Contraception", "Evaluate hormonal and non-hormonal methods of contraception", "evaluate"],
            ["infertility-treatment", "Treating infertility", "Describe IVF and evaluate its benefits and problems", "evaluate", { t: "h" }],
            ["adrenaline-and-thyroxine", "Adrenaline and thyroxine", "Describe the effects of adrenaline and how thyroxine levels are controlled by negative feedback", "explain", { t: "h" }],
          ],
        },
        {
          subtopic: "Plant responses",
          topics: [
            ["plant-hormones", "Plant hormones and tropisms", "Explain phototropism and gravitropism using auxin", "explain"],
            ["uses-of-plant-hormones", "Uses of plant hormones", "Describe uses of auxins, ethene and gibberellins in agriculture and horticulture", "apply", { sep: true }],
          ],
        },
      ],
    },
    {
      area: "Inheritance, variation and evolution",
      flags: { quiz: "biology/inheritance-evolution" },
      groups: [
        {
          subtopic: "Reproduction and genetics",
          topics: [
            ["sexual-and-asexual", "Sexual and asexual reproduction", "Compare sexual and asexual reproduction and their advantages", "compare", { d: "f" }],
            ["meiosis", "Meiosis", "Explain how meiosis produces genetically different gametes", "explain"],
            ["dna-and-genome", "DNA and the genome", "Describe the structure of DNA and why studying the human genome matters", "recall"],
            ["protein-synthesis", "Protein synthesis and mutations", "Explain how the base sequence codes for proteins and how mutations can affect them", "explain", { sep: true, t: "h", d: "c" }],
            ["genetic-inheritance", "Genetic inheritance", "Use the terms allele, dominant, recessive, homozygous, heterozygous, genotype and phenotype", "recall"],
            ["punnett-squares", "Punnett squares", "Use Punnett squares to predict outcomes of crosses as ratios and probabilities", "calc"],
            ["inherited-disorders", "Inherited disorders", "Describe polydactyly and cystic fibrosis and evaluate embryo screening", "evaluate"],
            ["sex-determination", "Sex determination", "Explain how sex is determined by the X and Y chromosomes", "recall", { d: "f" }],
          ],
        },
        {
          subtopic: "Variation and evolution",
          topics: [
            ["variation", "Variation", "Explain genetic and environmental variation and the role of mutations", "explain"],
            ["natural-selection", "Evolution by natural selection", "Explain evolution by natural selection step by step", "explain"],
            ["selective-breeding", "Selective breeding", "Describe selective breeding and evaluate its benefits and risks", "evaluate"],
            ["genetic-engineering", "Genetic engineering", "Describe genetic engineering and evaluate its uses in agriculture and medicine", "evaluate"],
            ["cloning", "Cloning", "Describe tissue culture, cuttings, embryo transplants and adult cell cloning", "recall", { sep: true }],
            ["darwin-and-wallace", "Darwin, Wallace and speciation", "Describe the work of Darwin and Wallace and explain how new species form", "explain", { sep: true }],
            ["evidence-for-evolution", "Fossils and evidence for evolution", "Explain how fossils and antibiotic resistance provide evidence for evolution", "explain"],
            ["extinction", "Extinction", "Explain the causes of extinction", "explain", { d: "f" }],
            ["resistant-bacteria", "Antibiotic-resistant bacteria", "Explain how resistant strains develop and how their spread can be reduced", "apply"],
            ["classification", "Classification", "Describe the Linnaean system and the three-domain system", "recall"],
          ],
        },
      ],
    },
    {
      area: "Ecology",
      flags: { quiz: "combined-science/ecology" },
      groups: [
        {
          subtopic: "Ecosystems",
          topics: [
            ["communities", "Communities and interdependence", "Explain interdependence, competition and stable communities", "explain", { d: "f" }],
            ["abiotic-and-biotic", "Abiotic and biotic factors", "Explain how abiotic and biotic factors affect communities", "explain"],
            ["adaptations", "Adaptations", "Describe structural, behavioural and functional adaptations, including extremophiles", "apply"],
            ["food-chains", "Food chains and predator–prey cycles", "Interpret food chains and predator–prey cycles", "data"],
            ["sampling-quadrats", "Sampling with quadrats and transects", "Estimate population size and distribution using quadrats and transects", "practical"],
            ["carbon-and-water-cycles", "Carbon and water cycles", "Describe the carbon and water cycles and the role of microorganisms", "explain"],
            ["decomposition", "Decomposition", "Explain how temperature, water and oxygen affect the rate of decay", "practical", { sep: true }],
          ],
        },
        {
          subtopic: "Biodiversity and human impact",
          topics: [
            ["biodiversity", "Biodiversity", "Explain why biodiversity matters and how human activity reduces it", "explain"],
            ["waste-and-pollution", "Waste and pollution", "Describe pollution of water, air and land", "recall"],
            ["land-use-and-deforestation", "Land use and deforestation", "Explain the effects of peat bog destruction and deforestation", "explain"],
            ["global-warming-biology", "Global warming and living things", "Explain the biological consequences of global warming", "apply"],
            ["maintaining-biodiversity", "Maintaining biodiversity", "Evaluate programmes that protect biodiversity", "evaluate"],
            ["trophic-levels", "Trophic levels and pyramids of biomass", "Describe trophic levels and construct pyramids of biomass", "data", { sep: true }],
            ["biomass-transfer", "Efficiency of biomass transfer", "Calculate the efficiency of biomass transfer between trophic levels", "calc", { sep: true }],
            ["food-security", "Food security and farming", "Explain threats to food security and evaluate intensive farming and sustainable fisheries", "evaluate", { sep: true, d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Working scientifically",
      flags: { coverage: "general" },
      groups: [
        {
          subtopic: "Skills for biology",
          topics: [
            ["variables-and-fair-tests", "Variables and fair tests", "Identify independent, dependent and control variables and plan fair tests", "practical", { d: "f" }],
            ["biology-graphs", "Graphs and data in biology", "Plot graphs, calculate means and percentage change, and spot anomalies", "data"],
            ["six-mark-answers-biology", "Writing six-mark answers", "Plan a logically ordered extended answer using key biological terms", "explain", { d: "c" }],
          ],
        },
      ],
    },
  ],
};
