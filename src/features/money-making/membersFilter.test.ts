import { describe, it, expect } from "vitest";
import type { MoneyMethod } from "../../lib/data/money-methods";

/** Pure members filter matching MoneyMaking include-members semantics. */
export function filterByMembers(
  methods: Pick<MoneyMethod, "members">[],
  includeMembers: boolean
): typeof methods {
  if (includeMembers) return methods;
  return methods.filter((m) => !m.members);
}

describe("include members filter", () => {
  const methods = [
    { members: true, name: "p2p" },
    { members: false, name: "f2p" },
  ];

  it("checked (include members) shows F2P + P2P", () => {
    expect(filterByMembers(methods, true)).toHaveLength(2);
  });

  it("unchecked shows F2P only", () => {
    const out = filterByMembers(methods, false);
    expect(out).toHaveLength(1);
    expect(out[0]!.members).toBe(false);
  });
});
