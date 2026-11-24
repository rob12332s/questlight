import type { SubjectLibrary } from "./types";

/**
 * GCSE Physics, following the DfE GCSE physics subject content shared by all boards.
 * "sep" marks content usually only in separate Physics; this varies by board, so all
 * entries stay "awaiting verification" until checked against a specification.
 */
export const PHYSICS_LIBRARY: SubjectLibrary = {
  subject: "physics",
  defaults: { coverage: "shared", verification: "awaiting_verification" },
  areas: [
    {
      area: "Energy",
      flags: { quiz: "physics/energy" },
      groups: [
        {
          subtopic: "Energy stores and transfers",
          topics: [
            ["energy-stores", "Energy stores and systems", "Describe energy stores and how energy is transferred when a system changes", "recall", { d: "f" }],
            ["kinetic-energy", "Kinetic energy", "Calculate kinetic energy using Eₖ = ½mv²", "calc"],
            ["gravitational-potential-energy", "Gravitational potential energy", "Calculate changes in gravitational potential energy using Eₚ = mgh", "calc"],
            ["elastic-potential-energy", "Elastic potential energy", "Calculate elastic potential energy using Eₑ = ½ke²", "calc"],
            ["specific-heat-capacity", "Specific heat capacity", "Use ΔE = mcΔθ and describe the practical to measure specific heat capacity", "practical"],
            ["power", "Power", "Define power and calculate it from energy or work done and time", "calc"],
            ["conservation-and-dissipation", "Conservation and dissipation of energy", "Explain that energy is conserved but dissipated, and how to reduce unwanted transfers", "explain"],
            ["efficiency", "Efficiency", "Calculate efficiency as a decimal or percentage and suggest how to improve it", "calc"],
            ["combined-energy-problems", "Combining energy equations", "Solve problems that link kinetic, gravitational and elastic energy stores", "problem", { d: "c" }],
            ["thermal-insulation", "Thermal conductivity and insulation", "Explain how thermal conductivity and wall thickness affect the rate of cooling of a building", "explain", { d: "f" }],
          ],
        },
        {
          subtopic: "Energy resources",
          topics: [
            ["energy-resources", "Energy resources", "Describe renewable and non-renewable energy resources and how each is used", "recall", { d: "f" }],
            ["evaluating-resources", "Evaluating energy resources", "Evaluate the reliability and environmental impact of different energy resources", "evaluate"],
            ["energy-trends", "Trends in energy use", "Interpret data on how the use of energy resources has changed", "data"],
          ],
        },
      ],
    },
    {
      area: "Electricity",
      flags: { quiz: "physics/electricity" },
      groups: [
        {
          subtopic: "Circuits",
          topics: [
            ["circuit-symbols", "Circuit symbols", "Recognise and draw standard circuit symbols", "recall", { d: "f" }],
            ["charge-and-current", "Charge and current", "Use Q = It and describe current as a flow of charge", "calc"],
            ["potential-difference-resistance", "Potential difference and resistance", "Use V = IR and describe how resistance affects current", "calc"],
            ["iv-characteristics", "I–V characteristics", "Interpret I–V graphs for a resistor, a filament lamp and a diode", "graph"],
            ["ldrs-and-thermistors", "LDRs and thermistors", "Describe how LDRs and thermistors respond to light and temperature and their uses", "apply"],
            ["series-circuits", "Series circuits", "Apply the rules for current, potential difference and resistance in series circuits", "problem"],
            ["parallel-circuits", "Parallel circuits", "Apply the rules for current and potential difference in parallel circuits and explain why total resistance falls", "problem"],
            ["resistance-practicals", "Resistance practicals", "Investigate how length of wire and circuit arrangement affect resistance", "practical"],
          ],
        },
        {
          subtopic: "Domestic electricity",
          topics: [
            ["ac-and-dc", "Direct and alternating current", "Compare a.c. and d.c. and state the UK mains frequency and voltage", "recall", { d: "f" }],
            ["mains-wiring", "Mains electricity and plugs", "Describe the live, neutral and earth wires and why the live wire is dangerous", "explain"],
            ["fuses-and-earthing", "Fuses and earthing", "Explain how fuses, circuit breakers and the earth wire protect people from electric shock", "explain", { coverage: "general" }],
            ["electrical-power", "Electrical power and energy", "Use P = VI, P = I²R and E = QV to calculate power and energy transferred", "calc"],
            ["appliances-energy", "Energy transfers in appliances", "Describe energy transfers in everyday appliances and compare their power ratings", "apply", { d: "f" }],
            ["national-grid", "The National Grid", "Explain how transformers in the National Grid make transmission efficient", "explain"],
            ["static-electricity", "Static electricity and electric fields", "Explain charging by friction, sparks and electric fields", "explain", { sep: true }],
          ],
        },
      ],
    },
    {
      area: "Particle model of matter",
      flags: { quiz: "combined-science/particles-and-matter" },
      groups: [
        {
          subtopic: "Particles and density",
          topics: [
            ["density", "Density", "Calculate density using ρ = m/V and explain density differences with the particle model", "calc"],
            ["density-practical", "Measuring density", "Measure the density of regular and irregular objects and liquids", "practical", { d: "f" }],
            ["changes-of-state", "Changes of state", "Describe changes of state as physical changes in which mass is conserved", "recall", { d: "f" }],
            ["internal-energy", "Internal energy", "Describe internal energy as the total kinetic and potential energy of particles", "explain"],
            ["specific-latent-heat", "Specific latent heat", "Use E = mL and interpret heating and cooling graphs", "calc"],
            ["gas-pressure", "Particle motion in gases", "Explain how temperature affects gas pressure at constant volume", "explain"],
            ["pressure-and-volume", "Pressure and volume of gases", "Use pV = constant and explain why doing work on a gas raises its temperature", "calc", { sep: true, t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Atomic structure",
      flags: { quiz: "physics/radioactivity" },
      groups: [
        {
          subtopic: "Atoms and radiation",
          topics: [
            ["atom-model-physics", "The structure of the atom", "Describe the nuclear model and how electrons change energy level by absorbing or emitting radiation", "recall"],
            ["isotopes-and-ions", "Isotopes and ions", "Describe isotopes and explain how atoms become ions", "recall", { d: "f" }],
            ["rutherford-scattering", "Developing the atomic model", "Explain how alpha scattering led to the nuclear model", "explain"],
            ["types-of-radiation", "Alpha, beta and gamma", "Compare the properties of alpha, beta and gamma radiation", "compare"],
            ["random-decay", "Random decay and activity", "Explain that radioactive decay is random and measure activity in becquerels", "explain"],
            ["nuclear-equations", "Nuclear equations", "Balance nuclear equations for alpha and beta decay", "calc"],
            ["half-life", "Half-life", "Calculate half-life from graphs and data and find net decline as a ratio", "calc"],
            ["contamination-and-irradiation", "Contamination and irradiation", "Compare contamination and irradiation and how to protect against them", "compare"],
            ["background-radiation", "Background radiation", "Describe sources of background radiation and radiation dose in sieverts", "recall", { sep: true }],
            ["medical-uses-radiation", "Uses of nuclear radiation", "Evaluate the uses of radiation in medicine for imaging and treatment", "evaluate", { sep: true }],
            ["fission-and-fusion", "Fission and fusion", "Describe nuclear fission, chain reactions and nuclear fusion", "explain", { sep: true }],
          ],
        },
      ],
    },
    {
      area: "Forces",
      flags: { quiz: "physics/forces" },
      groups: [
        {
          subtopic: "Forces and interactions",
          topics: [
            ["scalars-and-vectors", "Scalars and vectors", "Tell scalar and vector quantities apart and represent vectors as arrows", "recall", { d: "f" }],
            ["contact-and-non-contact", "Contact and non-contact forces", "Classify forces as contact or non-contact and draw free body diagrams", "recall", { d: "f" }],
            ["weight-and-mass", "Weight and mass", "Use W = mg and explain the difference between weight and mass", "calc"],
            ["resultant-forces", "Resultant forces", "Calculate resultant forces along a line and find resultants of forces at angles with scale drawings", "problem", { t: "h" }],
            ["resolving-forces", "Resolving forces", "Resolve a force into two components at right angles using a scale drawing", "geometry", { t: "h", d: "c" }],
            ["work-done", "Work done", "Calculate work done using W = Fs and link it to energy transfer", "calc"],
            ["springs-and-hookes-law", "Forces and elasticity", "Use F = ke and investigate the extension of a spring", "practical"],
            ["moments", "Moments, levers and gears", "Calculate moments and apply the principle of moments", "calc", { sep: true }],
            ["pressure-in-fluids", "Pressure in fluids and upthrust", "Calculate pressure in liquids and explain upthrust and floating", "explain", { sep: true, t: "h", d: "c" }],
          ],
        },
        {
          subtopic: "Motion",
          flags: { quiz: "combined-science/speed-and-motion" },
          topics: [
            ["speed-and-velocity", "Speed and velocity", "Calculate speed and recall typical speeds for walking, cycling and cars", "calc", { d: "f" }],
            ["distance-time-graphs", "Distance–time graphs", "Interpret distance–time graphs and find speed from the gradient", "graph"],
            ["acceleration", "Acceleration", "Calculate acceleration and use v² − u² = 2as", "calc"],
            ["velocity-time-graphs", "Velocity–time graphs", "Find acceleration and distance travelled from velocity–time graphs", "graph"],
            ["terminal-velocity", "Terminal velocity", "Explain the motion of a falling object reaching terminal velocity", "explain"],
            ["newtons-first-law", "Newton's first law", "Apply Newton's first law and explain inertia", "explain"],
            ["newtons-second-law", "Newton's second law", "Use F = ma and investigate how force affects acceleration", "practical"],
            ["newtons-third-law", "Newton's third law", "Identify equal and opposite force pairs", "apply"],
            ["stopping-distance", "Stopping distances", "Explain how thinking and braking distances are affected by different factors", "explain"],
            ["braking-forces", "Braking and deceleration", "Estimate the forces involved in braking and explain the dangers of large decelerations", "apply", { t: "h", d: "c" }],
            ["reaction-time-physics", "Reaction time and driving", "Measure reaction time and explain how tiredness, drugs, alcohol and distractions affect it", "practical"],
            ["momentum", "Momentum", "Calculate momentum and use conservation of momentum in collisions", "calc", { t: "h" }],
            ["force-and-momentum-change", "Force and rate of change of momentum", "Explain how airbags, seat belts and crumple zones reduce force", "apply", { sep: true, t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Waves",
      flags: { quiz: "physics/waves" },
      groups: [
        {
          subtopic: "Properties of waves",
          topics: [
            ["transverse-and-longitudinal", "Transverse and longitudinal waves", "Compare transverse and longitudinal waves with examples", "compare", { d: "f" }],
            ["wave-properties", "Wave properties", "Define amplitude, wavelength, frequency and period", "recall", { d: "f" }],
            ["wave-equation", "The wave equation", "Use v = fλ and measure the speed of waves in a ripple tank or a solid", "calc"],
            ["reflection-refraction", "Reflection and refraction", "Draw ray diagrams for reflection and refraction and explain refraction using wavefronts", "explain"],
            ["waves-at-boundaries", "Waves at boundaries", "Describe how waves are absorbed, transmitted or reflected at a boundary between materials", "explain"],
            ["sound-and-ultrasound", "Sound and ultrasound", "Describe how sound travels and how ultrasound and echoes are used", "apply", { sep: true }],
            ["seismic-waves", "Seismic waves", "Explain how P- and S-waves give evidence for the structure of the Earth", "explain", { sep: true, t: "h" }],
          ],
        },
        {
          subtopic: "Electromagnetic waves",
          topics: [
            ["em-spectrum", "The electromagnetic spectrum", "Order the electromagnetic spectrum by wavelength and frequency", "recall"],
            ["uses-of-em-waves", "Uses of EM waves", "Explain why each type of EM wave suits its uses", "apply"],
            ["dangers-of-em-waves", "Dangers of EM waves", "Describe the hazards of ultraviolet, X-rays and gamma rays", "recall"],
            ["radio-waves-and-circuits", "Radio waves and circuits", "Explain how radio waves are produced and absorbed by oscillations in electrical circuits", "explain", { t: "h" }],
            ["infrared-practical", "Infrared radiation practical", "Investigate how surface type affects infrared emission and absorption", "practical"],
            ["lenses", "Lenses", "Draw ray diagrams for convex and concave lenses and calculate magnification", "geometry", { sep: true }],
            ["visible-light-and-colour", "Visible light and colour", "Explain the colour of objects and the effect of filters", "explain", { sep: true }],
            ["black-body-radiation", "Black body radiation", "Explain how the temperature of a body depends on absorption and emission of radiation", "explain", { sep: true, t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Magnetism and electromagnetism",
      flags: { quiz: "physics/magnetism" },
      groups: [
        {
          subtopic: "Magnetism",
          topics: [
            ["magnets-and-fields", "Magnets and magnetic fields", "Describe permanent and induced magnets and plot magnetic field lines", "recall", { d: "f" }],
            ["compasses-and-earths-field", "Compasses and the Earth's field", "Explain how a compass shows that the Earth has a magnetic field", "explain", { d: "f" }],
            ["electromagnets", "Electromagnets", "Describe the field around a wire and a solenoid and how to make an electromagnet stronger", "explain"],
            ["motor-effect", "The motor effect", "Use Fleming's left-hand rule and F = BIl", "calc", { t: "h" }],
            ["electric-motors", "Electric motors", "Explain how a simple d.c. motor works", "explain", { t: "h" }],
            ["loudspeakers", "Loudspeakers and microphones", "Explain how loudspeakers and microphones work", "explain", { sep: true, t: "h" }],
            ["generator-effect", "Induced potential and generators", "Explain the generator effect, alternators and dynamos", "explain", { sep: true, t: "h", d: "c" }],
            ["transformers", "Transformers", "Use the transformer equation and explain how transformers work", "calc", { sep: true, t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Space physics",
      flags: { sep: true },
      groups: [
        {
          subtopic: "Space",
          topics: [
            ["solar-system", "The solar system", "Describe the solar system and how it formed", "recall", { d: "f" }],
            ["life-cycle-of-stars", "The life cycle of a star", "Describe the life cycle of stars of different masses", "explain"],
            ["orbital-motion", "Orbital motion", "Explain how gravity keeps planets and satellites in orbit", "explain", { t: "h" }],
            ["satellites", "Natural and artificial satellites", "Describe natural and artificial satellites and compare their orbits", "recall"],
            ["red-shift", "Red-shift and the Big Bang", "Explain how red-shift supports the Big Bang theory", "explain"],
            ["dark-matter-and-energy", "Unexplained observations", "Describe observations not yet explained, such as dark mass and dark energy", "explain", { t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Working scientifically",
      flags: { coverage: "general" },
      groups: [
        {
          subtopic: "Skills for physics",
          topics: [
            ["si-units-and-prefixes", "SI units and prefixes", "Use SI units and convert between prefixes such as milli, kilo and mega", "calc", { d: "f" }],
            ["recalling-equations", "Recalling and rearranging equations", "Recall the physics equations you must learn and rearrange them", "algebra"],
            ["physics-graphs", "Graphs in physics", "Plot graphs, draw lines of best fit and calculate gradients", "graph"],
            ["accuracy-and-precision", "Accuracy, precision and uncertainty", "Distinguish accuracy, precision, repeatability and reproducibility and estimate uncertainty", "practical"],
            ["estimating-quantities", "Estimating physical quantities", "Make order-of-magnitude estimates of everyday physical quantities", "calc"],
            ["six-mark-answers-physics", "Writing six-mark answers", "Plan extended answers for practical methods and explanations", "explain", { d: "c" }],
          ],
        },
      ],
    },
  ],
};
