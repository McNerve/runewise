export type WikiGuideTemplate = "boss" | "raid" | "reference";

export type WikiGuideBlockType =
  | "summary"
  | "facts"
  | "requirements"
  | "skills"
  | "loadout"
  | "encounters"
  | "mechanics"
  | "drops"
  | "table"
  | "article"
  | "links";

export interface WikiGuideBlockBase {
  id: string;
  title: string;
  type: WikiGuideBlockType;
}

export interface WikiGuideSummaryBlock extends WikiGuideBlockBase {
  type: "summary";
  text: string | null;
}

export interface WikiGuideFactsBlock extends WikiGuideBlockBase {
  type: "facts";
  facts: Array<{ label: string; value: string }>;
}

export interface WikiGuideListBlock extends WikiGuideBlockBase {
  type: "requirements" | "skills" | "links";
  items: string[];
}

export interface WikiGuideLoadoutBlock extends WikiGuideBlockBase {
  type: "loadout";
  variants: string[];
}

export interface WikiGuideArticleBlock extends WikiGuideBlockBase {
  type: "article" | "mechanics" | "encounters" | "drops" | "table";
  html: string;
}

export type WikiGuideBlock =
  | WikiGuideSummaryBlock
  | WikiGuideFactsBlock
  | WikiGuideListBlock
  | WikiGuideLoadoutBlock
  | WikiGuideArticleBlock;
