import type { WikiGuideTemplate } from "./blocks";
import type { WikiPageClassification } from "./classify";

export interface WikiTemplateDescriptor {
  id: WikiGuideTemplate;
  label: string;
  description: string;
  sections: string[];
}

export const WIKI_TEMPLATE_DESCRIPTORS: Record<WikiGuideTemplate, WikiTemplateDescriptor> = {
  boss: {
    id: "boss",
    label: "Boss Guide",
    description: "Mechanics-first packaging for standard bosses and encounter pages.",
    sections: [
      "overview",
      "requirements",
      "skills",
      "loadouts",
      "mechanics",
      "phases",
      "drops",
      "related tools",
    ],
  },
  raid: {
    id: "raid",
    label: "Raid Guide",
    description: "Encounter-by-encounter packaging for raids and multi-room strategies.",
    sections: [
      "overview",
      "team prep",
      "requirements",
      "loadouts",
      "rooms",
      "encounters",
      "final boss",
      "rewards",
    ],
  },
  reference: {
    id: "reference",
    label: "Reference Guide",
    description: "General wiki packaging for items, places, shops, and linked knowledge pages.",
    sections: [
      "summary",
      "facts",
      "tables",
      "links",
      "full article",
    ],
  },
};

export function getWikiTemplateDescriptor(
  value: WikiGuideTemplate | WikiPageClassification
): WikiTemplateDescriptor {
  const key = typeof value === "string" ? value : value.template;
  return WIKI_TEMPLATE_DESCRIPTORS[key];
}
