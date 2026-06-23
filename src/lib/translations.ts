export type Translations = {
  [key: string]: string | { [key: string]: string };
};

export const translations = {
  zh: {
    // Layout / Navigation
    siteTitle: "DIAGONAL | 对角线计划",
    siteDescription: "对角线计划 (Diagonal) - 行为艺术档案与跨学科研究项目",
    footer: "© 2026 DIAGONAL PROJECT",

    // Home
    projectStatus: "PROJECT STATUS: ACTIVE",
    heroIntro:
      "对角线计划，缘起从东北到西南的身体游走，游走构成了中国版图上一条从“草原森林平原”地区到“山地高地”地区的对应线，这条线也与当年胡焕庸的从东北黑河到西南腾冲线呼应。从自然地理到人文经济，从近百年前到当代社会，从农业传统到工业繁荣，我们试图寻找和关联共同的意象、符号、理念与精神，以艺术的形式呈现两个地区的多样风貌，实践与理论结合，并尝试总结一些有效的方法，以促进和影响在地生态的演进。",
    documentsTitle: "The Documents",
    documentsSubtitle: "文献展示系统 V1.2 // FIELD_RECORDS",
    totalRecords: "TOTAL_RECORDS",
    axis: "AXIS: SW_TO_NE",
    loadFullIndex: "LOAD FULL INDEX+",
    atlasLabel: "VISUAL_MAPPING / THE_ATLAS",
    atlasTitle: "THE ATLAS",
    atlasIntro:
      "“地图集”通过视觉碎片记录现场考察、物质遗存与空间叙事，构建起从西南到东北的艺术地理图谱。",
    scrollToDiscover: "SCROLL TO DISCOVER",

    // Archive
    backToHome: "HOME",
    fullArchiveIndex: "Full Archive Index",
    totalArchiveAccess: "TOTAL_ARCHIVE_ACCESS",
    archiveTitle: "THE<br />DOCUMENTS",
    archiveIntro:
      "这里记录了对角线计划（Diagonal）自启动以来的所有行为艺术现场回顾、跨学科研究文献及社会参与实践报告。",
    backToDocuments: "BACK_TO_DOCUMENTS",
    htmlRecord: "HTML_RECORD",
    endOfRecord: "End_of_Record",
    archiveSystemVersion: "DIAGONAL ARCHIVE SYSTEM V2.0 // STYLED_HTML_MODE",

    // Atlas
    backToAtlas: "BACK_TO_ATLAS",
    backToAtlasItem: "BACK_TO_{title}",
    investigator: "Investigator",
    timeline: "Timeline",
    noSubCollections: "NO_SUB_COLLECTIONS",
    openAtlas: "OPEN_ATLAS+",

    // Components
    archiveDataPending: "ARCHIVE DATA<br />[IMAGE PENDING]",
    noVisualRecord: "NO_VISUAL_RECORD",

    // Languages
    language: "语言",
    switchLanguage: "切换语言",
  },
  en: {
    // Layout / Navigation
    siteTitle: "DIAGONAL",
    siteDescription:
      "Diagonal - An independent project dedicated to interdisciplinary performance art research, archival cataloging, and field practice.",
    footer: "© 2026 DIAGONAL PROJECT",

    // Home
    projectStatus: "PROJECT STATUS: ACTIVE",
    heroIntro:
      "The Diagonal, which originated from the body from the northeast to the southwest, formed a corresponding line from the \"grassland, forest plain\" to the \"mountain highland\" area on the Chinese map, and this line also echoed Hu Huanyong's Tengchong line from the Heihe in the northeast to the southwest. From physical geography to human economy, from nearly a hundred years ago to contemporary society, from agricultural tradition to industrial prosperity, we try to find and relate common images, symbols, ideas and spirits, present the diverse features of the two regions in the form of art, combine practice and theory, and try to summarize some effective methods to promote and influence the evolution of local ecology. ",
    documentsTitle: "The Documents",
    documentsSubtitle: "DOCUMENT DISPLAY SYSTEM V1.2 // FIELD_RECORDS",
    totalRecords: "TOTAL_RECORDS",
    axis: "AXIS: SW_TO_NE",
    loadFullIndex: "LOAD FULL INDEX+",
    atlasLabel: "VISUAL_MAPPING / THE_ATLAS",
    atlasTitle: "THE ATLAS",
    atlasIntro:
      "“The Atlas” records field investigations, material remnants, and spatial narratives through visual fragments, constructing an artistic geography from the southwest to the northeast.",
    scrollToDiscover: "SCROLL TO DISCOVER",

    // Archive
    backToHome: "HOME",
    fullArchiveIndex: "Full Archive Index",
    totalArchiveAccess: "TOTAL_ARCHIVE_ACCESS",
    archiveTitle: "THE<br />DOCUMENTS",
    archiveIntro:
      "This archive records all performance art reviews, interdisciplinary research documents, and socially engaged practice reports since the launch of Diagonal.",
    backToDocuments: "BACK_TO_DOCUMENTS",
    htmlRecord: "HTML_RECORD",
    endOfRecord: "End_of_Record",
    archiveSystemVersion: "DIAGONAL ARCHIVE SYSTEM V2.0 // STYLED_HTML_MODE",
    // Atlas
    backToAtlas: "BACK_TO_ATLAS",
    backToAtlasItem: "BACK_TO_{title}",
    investigator: "Investigator",
    timeline: "Timeline",
    noSubCollections: "NO_SUB_COLLECTIONS",
    openAtlas: "OPEN_ATLAS+",

    // Components
    archiveDataPending: "ARCHIVE DATA<br />[IMAGE PENDING]",
    noVisualRecord: "NO_VISUAL_RECORD",

    // Languages
    language: "Language",
    switchLanguage: "Switch Language",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(lang: "zh" | "en", key: TranslationKey): string {
  return translations[lang][key] || translations.en[key];
}
