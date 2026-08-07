import test from "node:test";
import assert from "node:assert/strict";
import { shouldSkipLinkedBugLookup } from "../functions/_lib/progress.js";

test("GSI-214 skips linked bug lookup by default", () => {
  assert.equal(shouldSkipLinkedBugLookup("GSI-214"), true);
  assert.equal(shouldSkipLinkedBugLookup("gsi-214"), true);
  assert.equal(shouldSkipLinkedBugLookup("GSI-215"), false);
});

test("linked bug skip list can be configured", () => {
  const env = { PROGRESS_SKIP_LINKED_BUGS: "GSI-214, GSI-999" };
  assert.equal(shouldSkipLinkedBugLookup("GSI-999", env), true);
  assert.equal(shouldSkipLinkedBugLookup("GSI-998", env), false);
});
