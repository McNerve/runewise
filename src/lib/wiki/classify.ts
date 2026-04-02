import { fetchMapping } from "../api/ge";
import { BOSSES } from "../data/bosses";
import { QUESTS } from "../data/quests";
import type { WikiGuideTemplate } from "./blocks";

export type WikiEntityKind = "item" | "boss" | "quest" | "reference";

export interface WikiPageClassification {
  canonicalTitle: string;
  entityKind: WikiEntityKind;
  template: WikiGuideTemplate;
  isStrategyPage: boolean;
  isRaid: boolean;
}

const RAID_TITLE_PATTERNS = [
  "chambers of xeric",
  "theatre of blood",
  "tombs of amascut",
] as const;

let itemNameSetPromise: Promise<Set<string>> | null = null;

export function normalizeWikiLookupKey(input: string): string {
  return input
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function stripStrategySuffix(input: string): string {
  return input
    .replace(/\/challenge mode\/strategies$/i, "")
    .replace(/\/strategies$/i, "")
    .trim();
}

function isRaidTitle(input: string): boolean {
  const normalized = normalizeWikiLookupKey(stripStrategySuffix(input));
  return RAID_TITLE_PATTERNS.some((title) => normalized === title);
}

const BOSS_NAME_SET = new Set(
  BOSSES.flatMap((boss) => [
    normalizeWikiLookupKey(boss.name),
    normalizeWikiLookupKey(
      decodeURIComponent(boss.wikiPage.split("/")[0]).replace(/_/g, " ")
    ),
    normalizeWikiLookupKey(stripStrategySuffix(boss.wikiPage)),
  ])
);

const QUEST_NAME_SET = new Set(
  QUESTS.map((quest) => normalizeWikiLookupKey(quest.name))
);

async function getItemNameSet(): Promise<Set<string>> {
  if (!itemNameSetPromise) {
    itemNameSetPromise = fetchMapping().then(
      (mapping) => new Set(mapping.map((item) => normalizeWikiLookupKey(item.name)))
    );
  }

  return itemNameSetPromise;
}

export async function classifyWikiPage(page: string): Promise<WikiPageClassification> {
  const canonicalTitle = stripStrategySuffix(page).replace(/_/g, " ").trim();
  const normalized = normalizeWikiLookupKey(canonicalTitle);
  const isStrategyPage = /\/strategies$/i.test(page) || /\/challenge mode\/strategies$/i.test(page);
  const isRaid = isRaidTitle(page);

  if (!normalized) {
    return {
      canonicalTitle,
      entityKind: "reference",
      template: "reference",
      isStrategyPage,
      isRaid,
    };
  }

  if (isRaid) {
    return {
      canonicalTitle,
      entityKind: "boss",
      template: "raid",
      isStrategyPage,
      isRaid: true,
    };
  }

  if (BOSS_NAME_SET.has(normalized)) {
    return {
      canonicalTitle,
      entityKind: "boss",
      template: "boss",
      isStrategyPage,
      isRaid: false,
    };
  }

  if (QUEST_NAME_SET.has(normalized)) {
    return {
      canonicalTitle,
      entityKind: "quest",
      template: "reference",
      isStrategyPage,
      isRaid: false,
    };
  }

  const itemNameSet = await getItemNameSet();
  if (itemNameSet.has(normalized)) {
    return {
      canonicalTitle,
      entityKind: "item",
      template: "reference",
      isStrategyPage,
      isRaid: false,
    };
  }

  return {
    canonicalTitle,
    entityKind: "reference",
    template: "reference",
    isStrategyPage,
    isRaid: false,
  };
}

export async function classifyWikiEntityKind(page: string): Promise<WikiEntityKind> {
  const classification = await classifyWikiPage(page);
  return classification.entityKind;
}
