import type { BoardId, LibraryGroup, SubjectLibrary, TopicTuple } from "./types";

/**
 * GCSE History. Historical skills are required by the DfE subject content for every
 * board ("shared"). Units are board-specific options: students only see the units they
 * study. AQA 8145 and Edexcel 1HI0 units are included; OCR units are planned.
 * Every unit stays "awaiting verification" until checked against the specification.
 */
const AQA_P1 = "Paper 1: Understanding the modern world";
const AQA_P2 = "Paper 2: Shaping the nation";
const EDX_P1 = "Paper 1: Thematic study and historic environment";
const EDX_P2 = "Paper 2: Period study and British depth study";
const EDX_P3 = "Paper 3: Modern depth study";

const unit = (board: BoardId, opt: string, subtopic: string, p: string, topics: TopicTuple[], quiz?: string): LibraryGroup => ({
  subtopic,
  flags: { opt, p, coverage: "board_specific", boards: [board], ...(quiz ? { quiz } : {}) },
  topics,
});

export const HISTORY_LIBRARY: SubjectLibrary = {
  subject: "history",
  defaults: { coverage: "shared", verification: "awaiting_verification" },
  areas: [
    {
      area: "Historical skills",
      groups: [
        {
          subtopic: "Sources and interpretations",
          topics: [
            ["source-provenance", "Provenance: nature, origin and purpose", "Use who made a source, when and why to judge its usefulness", "source", { d: "f" }],
            ["source-usefulness", "How useful is a source?", "Judge a source's usefulness using its content, provenance and your own knowledge", "source"],
            ["source-inference", "Making inferences from sources", "Make supported inferences from what a source suggests", "source", { d: "f" }],
            ["interpretations-differ", "Why interpretations differ", "Explain how and why historians' interpretations differ", "interpretation"],
            ["interpretation-convincing", "How convincing is an interpretation?", "Judge how convincing an interpretation is using your own knowledge", "interpretation", { d: "c" }],
          ],
        },
        {
          subtopic: "Second-order concepts",
          topics: [
            ["causation", "Explaining causes", "Explain why an event happened, linking causes to the outcome", "cause"],
            ["consequence", "Explaining consequences", "Explain the short- and long-term consequences of an event", "cause"],
            ["change-and-continuity", "Change and continuity", "Explain what changed, what stayed the same and why", "cause"],
            ["significance", "Significance", "Judge the significance of an individual or event using clear criteria", "evaluate"],
            ["narrative-accounts", "Narrative accounts", "Write an analytical account that links events in sequence", "narrative"],
            ["how-far-do-you-agree", "How far do you agree?", "Write a balanced essay that reaches a sustained, supported judgement", "evaluate", { d: "c" }],
          ],
        },
      ],
    },
    {
      area: "AQA period studies",
      groups: [
        unit("aqa", "aqa-germany-1890-1945", "Germany, 1890–1945: Democracy and dictatorship", AQA_P1, [
          ["aqa-germany-kaiser", "Kaiser Wilhelm II and the difficulties of ruling", "Explain the challenges of governing Germany before and during the First World War", "cause", { d: "f" }],
          ["aqa-germany-weimar", "The Weimar Republic", "Explain the problems Weimar faced, including the Treaty of Versailles and hyperinflation", "cause"],
          ["aqa-germany-stresemann", "The Stresemann era", "Assess how far Weimar recovered between 1924 and 1929", "evaluate"],
          ["aqa-germany-rise-of-hitler", "Hitler's rise to power", "Explain how Hitler became chancellor and then Führer", "cause"],
          ["aqa-germany-control", "Nazi control and terror", "Explain how the Nazis used terror, propaganda and policies to keep control", "explain"],
          ["aqa-germany-life", "Life in Nazi Germany", "Explain the experiences of women, young people and persecuted minorities", "explain"],
        ], "history/germany-1918-1939"),
        unit("aqa", "aqa-america-1920-1973", "America, 1920–1973: Opportunity and inequality", AQA_P1, [
          ["aqa-america-boom", "The American boom", "Explain the causes of the 1920s boom and who did not share in it", "cause", { d: "f" }],
          ["aqa-america-depression", "Bust and the New Deal", "Explain the Wall Street Crash, the Depression and the impact of the New Deal", "cause"],
          ["aqa-america-post-war", "Post-war America", "Explain the impact of the Second World War and post-war prosperity", "explain"],
          ["aqa-america-civil-rights", "Civil rights", "Explain the progress of the civil rights movement and its methods", "evaluate"],
        ]),
        unit("aqa", "aqa-russia-1894-1945", "Russia, 1894–1945: Tsardom and communism", AQA_P1, [
          ["aqa-russia-tsar", "Nicholas II's Russia", "Explain the problems facing the Tsar and the 1905 Revolution", "cause", { d: "f" }],
          ["aqa-russia-1917", "The 1917 revolutions", "Explain why the Tsar fell and how the Bolsheviks took power", "cause"],
          ["aqa-russia-lenin", "Lenin's new society", "Explain the Civil War, War Communism and the New Economic Policy", "explain"],
          ["aqa-russia-stalin", "Stalin's USSR", "Explain collectivisation, industrialisation and the purges", "explain"],
        ]),
        unit("aqa", "aqa-america-1840-1895", "America, 1840–1895: Expansion and consolidation", AQA_P1, [
          ["aqa-west-expansion", "Expansion west", "Explain why Americans moved west and the impact on the Plains Indians", "cause", { d: "f" }],
          ["aqa-west-civil-war", "Conflict across America", "Explain the causes and consequences of the Civil War", "cause"],
          ["aqa-west-consolidation", "Consolidation and the end of the frontier", "Explain how the West was settled and the Plains Indians' way of life ended", "explain"],
        ]),
      ],
    },
    {
      area: "AQA wider world depth studies",
      groups: [
        unit("aqa", "aqa-conflict-1894-1918", "Conflict and tension, 1894–1918", AQA_P1, [
          ["aqa-ww1-alliances", "The alliance system and rivalries", "Explain how alliances and rivalries raised tension before 1914", "cause", { d: "f" }],
          ["aqa-ww1-outbreak", "The outbreak of war", "Explain how the assassination at Sarajevo led to war", "narrative"],
          ["aqa-ww1-stalemate", "Stalemate on the Western Front", "Explain why the war became a stalemate and the key battles", "explain"],
          ["aqa-ww1-ending", "Ending the war", "Explain why the war ended in 1918", "cause"],
        ], "history/first-world-war"),
        unit("aqa", "aqa-conflict-1918-1939", "Conflict and tension, 1918–1939", AQA_P1, [
          ["aqa-interwar-versailles", "The peace settlement", "Explain the aims of the Big Three and the terms of the Treaty of Versailles", "explain", { d: "f" }],
          ["aqa-interwar-league", "The League of Nations", "Explain the League's successes and why it failed in Manchuria and Abyssinia", "evaluate"],
          ["aqa-interwar-road-to-war", "The road to war", "Explain Hitler's aims, appeasement and the outbreak of war in 1939", "cause"],
        ]),
        unit("aqa", "aqa-cold-war-1945-1972", "Conflict and tension between East and West, 1945–1972", AQA_P1, [
          ["aqa-cold-war-origins", "Origins of the Cold War", "Explain how the wartime alliance broke down", "cause", { d: "f" }],
          ["aqa-cold-war-berlin", "Berlin: blockade and the Wall", "Explain the Berlin Blockade and the building of the Berlin Wall", "narrative"],
          ["aqa-cold-war-cuba", "The Cuban Missile Crisis", "Explain the causes, events and consequences of the Cuban Missile Crisis", "narrative"],
          ["aqa-cold-war-czechoslovakia", "Tension in Eastern Europe", "Explain the Hungarian Uprising and the Prague Spring", "explain"],
        ], "history/cold-war"),
        unit("aqa", "aqa-asia-1950-1975", "Conflict and tension in Asia, 1950–1975", AQA_P1, [
          ["aqa-asia-korea", "The Korean War", "Explain the causes and course of the Korean War", "cause", { d: "f" }],
          ["aqa-asia-vietnam-escalation", "Escalation in Vietnam", "Explain why the USA became involved in Vietnam", "cause"],
          ["aqa-asia-vietnam-ending", "The end of the Vietnam War", "Explain why the USA withdrew from Vietnam", "cause"],
        ]),
      ],
    },
    {
      area: "AQA thematic studies",
      groups: [
        unit("aqa", "aqa-health-and-the-people", "Britain: Health and the people, c1000 to the present day", AQA_P2, [
          ["aqa-health-medieval", "Medieval medicine", "Explain medieval ideas about the causes and treatment of disease", "explain", { d: "f" }],
          ["aqa-health-renaissance", "The medical Renaissance", "Explain the impact of Vesalius, Harvey and the Great Plague", "change"],
          ["aqa-health-germ-theory", "Germ theory and the 19th century", "Explain the importance of germ theory, anaesthetics and antiseptics", "change"],
          ["aqa-health-modern", "Modern medicine", "Explain the development of penicillin, the NHS and modern treatments", "change"],
          ["aqa-health-factors", "Factors in medical progress", "Judge the role of war, science, government and individuals in medical change", "evaluate", { d: "c" }],
        ], "history/medicine-through-time"),
        unit("aqa", "aqa-power-and-the-people", "Britain: Power and the people, c1170 to the present day", AQA_P2, [
          ["aqa-power-magna-carta", "Challenging authority in the Middle Ages", "Explain Magna Carta, the first Parliament and the Peasants' Revolt", "explain", { d: "f" }],
          ["aqa-power-reformation", "Challenges to royal authority", "Explain the Pilgrimage of Grace and the English Revolution", "explain"],
          ["aqa-power-reform", "Reform and reformers", "Explain the campaigns for parliamentary reform and the abolition of slavery", "change"],
          ["aqa-power-equality", "Equality and rights", "Explain the campaigns for women's suffrage, workers' rights and minority rights", "change"],
        ]),
        unit("aqa", "aqa-migration-empires", "Britain: Migration, empires and the people, c790 to the present day", AQA_P2, [
          ["aqa-migration-conquest", "Conquered and conquerors", "Explain the impact of Viking and Norman migration", "explain", { d: "f" }],
          ["aqa-migration-empire", "Expansion and empire", "Explain how the British Empire grew and its impact on people", "explain"],
          ["aqa-migration-modern", "Britain in the modern era", "Explain decolonisation and migration to Britain after 1945", "change"],
        ]),
      ],
    },
    {
      area: "AQA British depth studies",
      groups: [
        unit("aqa", "aqa-norman-england", "Norman England, c1066–c1100", AQA_P2, [
          ["aqa-norman-conquest", "The Norman Conquest", "Explain the succession crisis and why William won at Hastings", "cause", { d: "f" }],
          ["aqa-norman-control", "Establishing control", "Explain how William used castles, the feudal system and the Harrying of the North", "explain"],
          ["aqa-norman-life", "Life under the Normans", "Explain changes to government, Domesday and everyday life", "change"],
          ["aqa-norman-church", "The Norman Church and monasticism", "Explain how Lanfranc and the Normans reformed the Church", "explain"],
        ], "history/norman-england"),
        unit("aqa", "aqa-elizabethan-england", "Elizabethan England, c1568–1603", AQA_P2, [
          ["aqa-eliz-court", "Elizabeth's court and Parliament", "Explain how Elizabeth governed and the issue of marriage and succession", "explain", { d: "f" }],
          ["aqa-eliz-life", "Life in Elizabethan times", "Explain the Golden Age, the poor and exploration", "explain"],
          ["aqa-eliz-troubles", "Troubles at home and abroad", "Explain the threat from Mary, Queen of Scots, Catholic plots and the Armada", "cause"],
          ["aqa-eliz-historic-environment", "The historic environment", "Apply knowledge to the year's specified historic site", "apply", { d: "c" }],
        ], "history/elizabethan-england"),
        unit("aqa", "aqa-edward-i", "Medieval England: the reign of Edward I, 1272–1307", AQA_P2, [
          ["aqa-edward-government", "Edward I's government", "Explain Edward I's power, government and relations with Parliament", "explain", { d: "f" }],
          ["aqa-edward-wars", "Edward I's wars", "Explain Edward's conquest of Wales and wars with Scotland", "cause"],
        ]),
        unit("aqa", "aqa-restoration-england", "Restoration England, 1660–1685", AQA_P2, [
          ["aqa-restoration-settlement", "The Restoration settlement", "Explain how Charles II was restored and the settlement that followed", "explain", { d: "f" }],
          ["aqa-restoration-society", "Restoration society and threats", "Explain the plague, the Great Fire and religious tension in Restoration England", "explain"],
        ]),
      ],
    },
    {
      area: "Edexcel thematic studies",
      groups: [
        unit("edexcel", "edx-medicine", "Medicine in Britain, c1250–present, and the Western Front", EDX_P1, [
          ["edx-medicine-medieval", "Medicine c1250–c1500", "Explain medieval ideas of disease, treatment and the Black Death", "explain", { d: "f" }],
          ["edx-medicine-renaissance", "Medicine c1500–c1700", "Explain the impact of the Renaissance, Vesalius, Harvey and the Great Plague", "change"],
          ["edx-medicine-18-19th", "Medicine c1700–c1900", "Explain Jenner, germ theory, Snow and public health reform", "change"],
          ["edx-medicine-modern", "Medicine c1900–present", "Explain modern diagnosis, treatment and the NHS", "change"],
          ["edx-western-front", "The Western Front, 1914–18", "Explain medical conditions and treatment on the Western Front and how to use sources about it", "source"],
        ], "history/medicine-through-time"),
        unit("edexcel", "edx-crime", "Crime and punishment in Britain, c1000–present, and Whitechapel", EDX_P1, [
          ["edx-crime-medieval", "Crime and punishment c1000–c1500", "Explain Anglo-Saxon and Norman law, crime and punishment", "explain", { d: "f" }],
          ["edx-crime-early-modern", "Crime and punishment c1500–c1700", "Explain changes in crime, the Bloody Code and witch-hunts", "change"],
          ["edx-crime-modern", "Crime and punishment c1700–present", "Explain the development of policing and prisons and modern crimes", "change"],
          ["edx-whitechapel", "Whitechapel, c1870–c1900", "Explain policing in Whitechapel and how to use sources about it", "source"],
        ]),
        unit("edexcel", "edx-warfare", "Warfare and British society, c1250–present, and London in WW2", EDX_P1, [
          ["edx-warfare-change", "Change in warfare", "Explain how weapons, armies and tactics changed from the medieval period to today", "change", { d: "f" }],
          ["edx-london-ww2", "London and the Second World War", "Explain the Blitz and how to use sources about London in the war", "source"],
        ]),
      ],
    },
    {
      area: "Edexcel British depth studies",
      groups: [
        unit("edexcel", "edx-anglo-saxon-norman", "Anglo-Saxon and Norman England, c1060–88", EDX_P2, [
          ["edx-anglo-saxon-england", "Anglo-Saxon England and the Norman Conquest", "Explain Anglo-Saxon society and the succession crisis of 1066", "cause", { d: "f" }],
          ["edx-norman-resistance", "William I in power", "Explain resistance to William and how he secured control", "explain"],
          ["edx-norman-government", "Norman England", "Explain Norman government, the Church and Domesday Book", "change"],
        ], "history/norman-england"),
        unit("edexcel", "edx-early-elizabethan", "Early Elizabethan England, 1558–88", EDX_P2, [
          ["edx-eliz-settlement", "Queen, government and religion", "Explain the religious settlement and the challenges Elizabeth faced in 1558", "explain", { d: "f" }],
          ["edx-eliz-challenges", "Challenges at home and abroad", "Explain plots, Mary, Queen of Scots, and war with Spain", "cause"],
          ["edx-eliz-society", "Elizabethan society", "Explain education, leisure, poverty and exploration", "explain"],
        ], "history/elizabethan-england"),
        unit("edexcel", "edx-henry-viii", "Henry VIII and his ministers, 1509–40", EDX_P2, [
          ["edx-henry-wolsey", "Henry VIII and Wolsey", "Explain Wolsey's rise, policies and fall", "explain", { d: "f" }],
          ["edx-henry-cromwell", "Cromwell and the break with Rome", "Explain the Reformation, the dissolution of the monasteries and Cromwell's fall", "cause"],
        ]),
        unit("edexcel", "edx-richard-john", "The reigns of King Richard I and King John, 1189–1216", EDX_P2, [
          ["edx-richard-crusade", "Richard I and the Crusade", "Explain Richard's government and the Third Crusade", "explain", { d: "f" }],
          ["edx-john-magna-carta", "King John and Magna Carta", "Explain John's problems, the loss of Normandy and Magna Carta", "cause"],
        ]),
      ],
    },
    {
      area: "Edexcel period studies",
      groups: [
        unit("edexcel", "edx-cold-war", "Superpower relations and the Cold War, 1941–91", EDX_P2, [
          ["edx-cold-war-origins", "The origins of the Cold War", "Explain the breakdown of the Grand Alliance from 1941 to 1958", "cause", { d: "f" }],
          ["edx-cold-war-crises", "Cold War crises", "Explain Berlin, Cuba and Czechoslovakia as Cold War crises", "narrative"],
          ["edx-cold-war-end", "The end of the Cold War", "Explain détente, its collapse and the end of the Cold War", "cause"],
        ], "history/cold-war"),
        unit("edexcel", "edx-american-west", "The American West, c1835–c1895", EDX_P2, [
          ["edx-west-plains-indians", "The Plains Indians and early settlement", "Explain the Plains Indians' way of life and early migration west", "explain", { d: "f" }],
          ["edx-west-development", "Development of the Plains", "Explain the impact of the railroad, cattle industry and homesteaders", "change"],
          ["edx-west-conflict", "Conflict and conquest", "Explain the conflict that ended the Plains Indians' way of life", "cause"],
        ]),
        unit("edexcel", "edx-spain-new-world", "Spain and the 'New World', c1490–c1555", EDX_P2, [
          ["edx-spain-voyages", "Spanish voyages of exploration", "Explain the voyages of Columbus and the early Spanish colonies", "explain", { d: "f" }],
          ["edx-spain-conquest", "Conquest of the Aztecs and Incas", "Explain how Spain conquered the Aztec and Inca empires", "cause"],
        ]),
        unit("edexcel", "edx-british-america", "British America, 1713–83: empire and revolution", EDX_P2, [
          ["edx-british-america-colonies", "The thirteen colonies", "Explain life in the colonies and their relationship with Britain", "explain", { d: "f" }],
          ["edx-british-america-revolution", "The War of Independence", "Explain the causes and outcome of the American War of Independence", "cause"],
        ]),
        unit("edexcel", "edx-middle-east", "Conflict in the Middle East, 1945–95", EDX_P2, [
          ["edx-middle-east-israel", "The creation of Israel", "Explain the end of the British Mandate and the creation of Israel", "cause", { d: "f" }],
          ["edx-middle-east-peace", "Wars and the search for peace", "Explain the Arab–Israeli wars and attempts at peace", "change"],
        ]),
      ],
    },
    {
      area: "Edexcel modern depth studies",
      groups: [
        unit("edexcel", "edx-weimar-nazi", "Weimar and Nazi Germany, 1918–39", EDX_P3, [
          ["edx-weimar-origins", "The Weimar Republic, 1918–29", "Explain Weimar's early problems and recovery under Stresemann", "cause", { d: "f" }],
          ["edx-hitler-rise", "Hitler's rise to power, 1919–33", "Explain the growth of the Nazi Party and how Hitler became chancellor", "cause"],
          ["edx-nazi-control", "Nazi control and dictatorship, 1933–39", "Explain how the Nazis created a dictatorship and controlled Germany", "explain"],
          ["edx-nazi-life", "Life in Nazi Germany, 1933–39", "Explain Nazi policies towards women, young people, workers and minorities", "explain"],
        ], "history/germany-1918-1939"),
        unit("edexcel", "edx-russia-1917-41", "Russia and the Soviet Union, 1917–41", EDX_P3, [
          ["edx-russia-revolution", "Revolution and civil war", "Explain the revolutions of 1917 and the Civil War", "cause", { d: "f" }],
          ["edx-russia-stalin", "Stalin's Soviet Union", "Explain Stalin's rise, purges and economic policies", "explain"],
        ]),
        unit("edexcel", "edx-usa-1954-75", "The USA, 1954–75: conflict at home and abroad", EDX_P3, [
          ["edx-usa-civil-rights", "The civil rights movement", "Explain the progress of civil rights from 1954 to 1975", "change", { d: "f" }],
          ["edx-usa-vietnam", "The Vietnam War", "Explain US involvement in Vietnam and reactions at home", "cause"],
          ["edx-usa-protest", "Protest and opposition", "Explain the methods and impact of protest movements", "evaluate"],
        ]),
        unit("edexcel", "edx-mao", "Mao's China, 1945–76", EDX_P3, [
          ["edx-mao-power", "Mao's rise and consolidation of power", "Explain how the Communists won the civil war and secured control", "cause", { d: "f" }],
          ["edx-mao-policies", "The Great Leap Forward and Cultural Revolution", "Explain Mao's economic and social policies and their effects", "explain"],
        ]),
      ],
    },
  ],
};
