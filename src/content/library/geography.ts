import type { SubjectLibrary } from "./types";

/**
 * GCSE Geography. Physical and human themes, skills and fieldwork appear in every board's
 * specification, but the exact topics and case studies differ, so content is "general"
 * until mapped to a board. Optional landscapes, environments and resources are options:
 * students choose the ones they study. Only the AQA 8035 issue evaluation is board-specific.
 */
export const GEOGRAPHY_LIBRARY: SubjectLibrary = {
  subject: "geography",
  defaults: { coverage: "general", verification: "awaiting_verification" },
  areas: [
    {
      area: "Natural hazards",
      flags: { quiz: "geography/natural-hazards" },
      groups: [
        {
          subtopic: "Hazards and risk",
          topics: [
            ["hazard-types", "Types of natural hazard", "Classify natural hazards as tectonic, atmospheric or geomorphological", "recall", { d: "f" }],
            ["hazard-risk", "Hazard risk", "Explain the factors that affect hazard risk, such as wealth, population density and preparation", "explain"],
          ],
        },
        {
          subtopic: "Tectonic hazards",
          topics: [
            ["plate-structure", "The Earth's structure and plates", "Describe the Earth's layers and the global distribution of plates, volcanoes and earthquakes", "map", { d: "f" }],
            ["plate-margins", "Plate margins", "Explain the processes at constructive, destructive and conservative plate margins", "explain"],
            ["volcanoes", "Volcanoes", "Explain how different types of volcano form and their hazards", "explain"],
            ["earthquake-effects", "Effects of and responses to tectonic hazards", "Compare primary and secondary effects and immediate and long-term responses in places of contrasting wealth", "case_study"],
            ["living-near-tectonic-hazards", "Why people live near tectonic hazards", "Explain why people continue to live in areas at risk", "explain"],
            ["reducing-tectonic-risk", "Reducing tectonic risk", "Evaluate monitoring, prediction, protection and planning", "evaluate"],
            ["tectonic-case-studies", "Tectonic case studies", "Use two contrasting earthquake case studies with precise facts and figures", "case_study", { d: "c" }],
          ],
        },
        {
          subtopic: "Weather hazards",
          topics: [
            ["atmospheric-circulation", "Global atmospheric circulation", "Explain the circulation cells, pressure belts and surface winds", "explain"],
            ["tropical-storm-formation", "Tropical storm formation", "Explain where and how tropical storms form and their structure", "explain"],
            ["tropical-storm-effects", "Effects of tropical storms", "Explain the effects of and responses to a named tropical storm", "case_study"],
            ["storms-and-climate-change", "Tropical storms and climate change", "Explain how climate change might affect tropical storms", "apply", { d: "c" }],
            ["reducing-storm-risk", "Reducing the effects of tropical storms", "Evaluate monitoring, prediction, protection and planning for storms", "evaluate"],
            ["uk-weather-hazards", "UK weather hazards", "Describe the weather hazards that affect the UK", "recall", { d: "f" }],
            ["uk-extreme-weather", "An extreme weather event in the UK", "Explain the causes, impacts and management of a recent extreme UK weather event", "case_study"],
          ],
        },
        {
          subtopic: "Climate change",
          flags: { quiz: "geography/climate-change" },
          topics: [
            ["climate-evidence", "Evidence for climate change", "Describe evidence for climate change from the Quaternary period to the present", "data"],
            ["natural-causes-climate", "Natural causes of climate change", "Explain orbital changes, solar output and volcanic activity", "explain"],
            ["human-causes-climate", "Human causes of climate change", "Explain how fossil fuels, agriculture and deforestation enhance the greenhouse effect", "explain"],
            ["effects-of-climate-change", "Effects of climate change", "Explain the effects of climate change on people and the environment", "explain"],
            ["managing-climate-change", "Mitigation and adaptation", "Evaluate mitigation and adaptation strategies", "evaluate", { d: "c" }],
          ],
        },
      ],
    },
    {
      area: "The living world",
      groups: [
        {
          subtopic: "Ecosystems",
          topics: [
            ["ecosystem-components", "Ecosystems", "Describe the producers, consumers, decomposers and food webs in an ecosystem", "recall", { d: "f" }],
            ["small-scale-ecosystem", "A small-scale UK ecosystem", "Explain how a small UK ecosystem such as a pond works and how change affects it", "case_study"],
            ["global-biomes", "Global ecosystems", "Describe the distribution and characteristics of the world's major biomes", "map"],
            ["nutrient-cycling", "Nutrient cycling", "Explain nutrient cycling and interdependence in ecosystems", "explain"],
          ],
        },
        {
          subtopic: "Tropical rainforests",
          topics: [
            ["rainforest-characteristics", "Rainforest characteristics", "Describe the climate, layers and soils of tropical rainforests", "recall", { d: "f" }],
            ["rainforest-adaptations", "Rainforest adaptations", "Explain how plants and animals are adapted to the rainforest", "explain"],
            ["deforestation-causes", "Causes of deforestation", "Explain the causes of deforestation in a named rainforest", "case_study"],
            ["deforestation-impacts", "Impacts of deforestation", "Explain the environmental and economic impacts of deforestation", "explain"],
            ["rainforest-value", "Why rainforests matter", "Explain the value of rainforests to people and the environment", "explain"],
            ["sustainable-rainforest", "Sustainable rainforest management", "Evaluate strategies such as selective logging, ecotourism and debt reduction", "evaluate", { d: "c" }],
          ],
        },
        {
          subtopic: "Hot deserts",
          flags: { opt: "hot-deserts" },
          topics: [
            ["desert-characteristics", "Hot desert characteristics", "Describe the climate, soils and interdependence of hot deserts", "recall", { d: "f" }],
            ["desert-adaptations", "Desert adaptations", "Explain how plants and animals adapt to hot deserts", "explain"],
            ["desert-development", "Opportunities and challenges in hot deserts", "Explain development opportunities and challenges in a named hot desert", "case_study"],
            ["desertification", "Desertification", "Explain the causes of desertification and strategies to reduce it", "evaluate"],
          ],
        },
        {
          subtopic: "Cold environments",
          flags: { opt: "cold-environments" },
          topics: [
            ["cold-characteristics", "Cold environment characteristics", "Describe the climate, permafrost and soils of polar and tundra areas", "recall", { d: "f" }],
            ["cold-adaptations", "Cold environment adaptations", "Explain how plants and animals adapt to cold environments", "explain"],
            ["cold-development", "Opportunities and challenges in cold environments", "Explain development opportunities and challenges in a named cold environment", "case_study"],
            ["protecting-cold-environments", "Protecting cold environments", "Evaluate strategies to protect fragile cold environments", "evaluate"],
          ],
        },
      ],
    },
    {
      area: "Physical landscapes in the UK",
      groups: [
        {
          subtopic: "UK landscapes",
          topics: [
            ["uk-relief", "UK relief and landscapes", "Describe the location of upland, lowland and river landscapes in the UK", "map", { d: "f" }],
          ],
        },
        {
          subtopic: "Coastal landscapes",
          flags: { opt: "coasts", quiz: "geography/coasts" },
          topics: [
            ["waves-and-coastal-processes", "Waves and coastal processes", "Compare constructive and destructive waves and describe weathering and mass movement", "explain", { d: "f" }],
            ["coastal-erosion-processes", "Coastal erosion and transport", "Explain hydraulic action, abrasion, attrition, solution and longshore drift", "explain"],
            ["coastal-erosion-landforms", "Landforms of coastal erosion", "Explain the formation of headlands, bays, caves, arches, stacks and wave-cut platforms", "explain"],
            ["coastal-deposition-landforms", "Landforms of coastal deposition", "Explain the formation of beaches, spits, bars and sand dunes", "explain"],
            ["coastal-landforms-example", "A UK coastline", "Use a named UK coastline to identify major landforms", "case_study"],
            ["coastal-management", "Coastal management", "Evaluate hard engineering, soft engineering and managed retreat", "evaluate"],
            ["coastal-management-scheme", "A coastal management scheme", "Explain the reasons for, effects of and conflicts over a named coastal management scheme", "case_study", { d: "c" }],
          ],
        },
        {
          subtopic: "River landscapes",
          flags: { opt: "rivers", quiz: "geography/rivers" },
          topics: [
            ["river-long-profile", "The long profile of a river", "Describe how a river's long profile and cross profile change downstream", "recall", { d: "f" }],
            ["river-erosion-landforms", "Landforms of river erosion", "Explain the formation of waterfalls, gorges and interlocking spurs", "explain"],
            ["meanders-and-ox-bows", "Meanders and ox-bow lakes", "Explain how meanders and ox-bow lakes form", "explain"],
            ["river-deposition-landforms", "Landforms of river deposition", "Explain the formation of levees, floodplains and estuaries", "explain"],
            ["flood-hydrographs", "Flood hydrographs", "Interpret flood hydrographs and explain physical and human causes of flooding", "data"],
            ["flood-management", "Flood management", "Evaluate hard and soft engineering for managing flood risk", "evaluate"],
            ["flood-management-scheme", "A flood management scheme", "Explain the reasons for, effects of and conflicts over a named UK flood scheme", "case_study", { d: "c" }],
          ],
        },
        {
          subtopic: "Glacial landscapes",
          flags: { opt: "glacial" },
          topics: [
            ["glacial-processes", "Glacial processes", "Explain freeze–thaw weathering, abrasion, plucking and glacial transport", "explain", { d: "f" }],
            ["glacial-landforms", "Glacial landforms", "Explain the formation of corries, arêtes, pyramidal peaks and U-shaped valleys", "explain"],
            ["glacial-land-use", "Land use in glaciated areas", "Explain economic activity and conflicts in glaciated upland areas", "case_study"],
            ["glacial-tourism", "Tourism in glaciated areas", "Evaluate strategies to manage tourism in a named glaciated area", "evaluate"],
          ],
        },
      ],
    },
    {
      area: "Urban issues and challenges",
      flags: { quiz: "geography/urban-issues" },
      groups: [
        {
          subtopic: "Urban growth",
          topics: [
            ["urbanisation-trends", "Global urbanisation", "Explain global patterns of urbanisation and the growth of megacities", "data", { d: "f" }],
            ["rural-urban-migration", "Causes of urban growth", "Explain push and pull factors and natural increase", "explain"],
            ["lic-nee-city-opportunities", "A city in an LIC or NEE: opportunities", "Explain the social and economic opportunities in a named city in a lower-income country", "case_study"],
            ["lic-nee-city-challenges", "A city in an LIC or NEE: challenges", "Explain the challenges of slums, services and pollution in that city", "case_study"],
            ["urban-planning-poor", "Urban planning for the urban poor", "Evaluate a scheme that improves life for the urban poor", "evaluate", { d: "c" }],
          ],
        },
        {
          subtopic: "Cities in the UK",
          topics: [
            ["uk-city-case-study", "A major UK city", "Explain the location, importance, opportunities and challenges of a named UK city", "case_study"],
            ["urban-regeneration", "Urban regeneration", "Explain the reasons for and features of a named regeneration project", "case_study"],
            ["sustainable-urban-living", "Sustainable urban living", "Explain features of sustainable cities, including water, energy and green space", "explain"],
            ["urban-transport", "Urban transport strategies", "Evaluate strategies that reduce traffic congestion", "evaluate"],
          ],
        },
      ],
    },
    {
      area: "The changing economic world",
      flags: { quiz: "geography/development" },
      groups: [
        {
          subtopic: "Development",
          topics: [
            ["measuring-development", "Measuring development", "Compare economic and social measures of development, including HDI", "data", { d: "f" }],
            ["demographic-transition", "The demographic transition model", "Link the stages of the demographic transition model to development", "data"],
            ["uneven-development-causes", "Causes of uneven development", "Explain the physical, economic and historical causes of uneven development", "explain"],
            ["reducing-the-gap", "Reducing the development gap", "Evaluate aid, fair trade, debt relief, tourism and investment", "evaluate"],
            ["nee-case-study", "Economic development in an NEE", "Explain how a named NEE is developing, including its trade, TNCs and aid", "case_study", { d: "c" }],
            ["globalisation-and-tncs", "Globalisation and TNCs", "Evaluate the advantages and disadvantages of transnational corporations", "evaluate"],
          ],
        },
        {
          subtopic: "The UK economy",
          topics: [
            ["uk-economic-change", "Economic change in the UK", "Explain deindustrialisation and the move to a post-industrial economy", "explain"],
            ["uk-north-south", "The north–south divide", "Explain the north–south divide and strategies to reduce it", "evaluate"],
            ["uk-rural-change", "Changing rural landscapes", "Explain population and economic change in UK rural areas", "explain"],
            ["uk-place-in-world", "The UK's place in the wider world", "Explain the UK's links through trade, culture, transport and communication", "explain"],
          ],
        },
      ],
    },
    {
      area: "The challenge of resource management",
      groups: [
        {
          subtopic: "Resources",
          topics: [
            ["resource-inequality", "Global resource inequality", "Explain the uneven distribution and consumption of food, water and energy", "data", { d: "f" }],
            ["uk-resources", "Resources in the UK", "Explain the changing demand for food, water and energy in the UK", "explain"],
          ],
        },
        {
          subtopic: "Food",
          flags: { opt: "food" },
          topics: [
            ["food-security", "Food security", "Explain the causes and impacts of food insecurity", "explain", { d: "f" }],
            ["increasing-food-supply", "Increasing food supply", "Evaluate irrigation, hydroponics and the new green revolution", "evaluate"],
            ["sustainable-food", "Sustainable food supplies", "Explain a sustainable food scheme in a named area", "case_study"],
          ],
        },
        {
          subtopic: "Water",
          flags: { opt: "water" },
          topics: [
            ["water-security", "Water security", "Explain the causes and impacts of water insecurity", "explain", { d: "f" }],
            ["increasing-water-supply", "Increasing water supply", "Evaluate dams, water transfers and desalination", "evaluate"],
            ["sustainable-water", "Sustainable water supplies", "Explain a local water scheme in a lower-income country", "case_study"],
          ],
        },
        {
          subtopic: "Energy",
          flags: { opt: "energy" },
          topics: [
            ["energy-security", "Energy security", "Explain the causes and impacts of energy insecurity", "explain", { d: "f" }],
            ["increasing-energy-supply", "Increasing energy supply", "Evaluate renewable and non-renewable options for increasing supply", "evaluate"],
            ["sustainable-energy", "Sustainable energy", "Explain a local renewable energy scheme in a lower-income country", "case_study"],
          ],
        },
      ],
    },
    {
      area: "Geographical skills and fieldwork",
      groups: [
        {
          subtopic: "Geographical skills",
          topics: [
            ["grid-references", "Grid references and OS maps", "Use four- and six-figure grid references, map symbols and scale", "map", { d: "f" }],
            ["contours-and-relief", "Contours and relief", "Interpret contours and spot heights to describe relief", "map"],
            ["map-types", "Choropleth, flow-line and dot maps", "Read and draw choropleth, isoline, flow-line and dot maps", "map"],
            ["geography-graphs", "Graphs and charts", "Choose, draw and interpret graphs, including climate graphs and population pyramids", "data"],
            ["geography-statistics", "Statistics in geography", "Calculate mean, median, mode, range, interquartile range and percentage change", "calc"],
            ["photos-and-gis", "Photographs and GIS", "Interpret photographs, satellite images and GIS layers", "map"],
            ["describing-patterns", "Describing distributions and patterns", "Describe a pattern on a map using general trend, examples and anomalies", "map", { d: "f" }],
          ],
        },
        {
          subtopic: "Fieldwork and enquiry",
          topics: [
            ["enquiry-questions", "Enquiry questions and hypotheses", "Write a suitable enquiry question and hypothesis for fieldwork", "fieldwork", { d: "f" }],
            ["data-collection", "Collecting primary data", "Choose sampling methods and justify data collection techniques", "fieldwork"],
            ["presenting-fieldwork", "Presenting fieldwork data", "Choose and justify methods to present fieldwork data", "fieldwork"],
            ["analysing-fieldwork", "Analysing and concluding", "Analyse fieldwork results and reach supported conclusions", "fieldwork"],
            ["evaluating-fieldwork", "Evaluating fieldwork", "Evaluate the reliability of fieldwork methods and conclusions", "evaluate", { d: "c" }],
          ],
        },
        {
          subtopic: "AQA issue evaluation",
          flags: { coverage: "board_specific", boards: ["aqa"], p: "Paper 3: Geographical applications" },
          topics: [
            ["aqa-pre-release", "Using the pre-release resource booklet", "Prepare for the issue evaluation using the pre-release booklet", "apply"],
            ["aqa-decision-making", "Making and justifying a decision", "Choose an option and justify it against the alternatives using evidence", "evaluate", { d: "c" }],
          ],
        },
      ],
    },
  ],
};
