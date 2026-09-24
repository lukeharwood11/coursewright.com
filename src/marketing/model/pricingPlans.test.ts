import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatUsd,
  planPriceLabel,
  publicPlans,
  savingsCompareLabel,
  savingsLabel,
  yearlySavings,
} from "./pricingPlans.ts";

test("public ladder is Family, Co-op, and School — Family Pro stays off the page", () => {
  assert.deepEqual(
    publicPlans.map((plan) => plan.id),
    ["family", "coop", "school"],
  );
});

test("Family is free on both intervals", () => {
  const family = publicPlans[0];
  assert.equal(planPriceLabel(family, "monthly"), "Free");
  assert.equal(planPriceLabel(family, "yearly"), "Free");
  assert.equal(yearlySavings(family), null);
});

test("yearly Co-op saves $158 against $948", () => {
  const coop = publicPlans[1];
  assert.equal(planPriceLabel(coop, "monthly"), "$79");
  assert.equal(planPriceLabel(coop, "yearly"), "$790");
  const savings = yearlySavings(coop);
  assert.ok(savings);
  assert.equal(savings.monthlyTimesTwelveUsd, 948);
  assert.equal(savings.saveUsd, 158);
  assert.equal(savings.aboutMonths, 2);
  assert.equal(savingsLabel(savings), "Save $158 (~2 months)");
  assert.equal(savingsCompareLabel(savings), "$948 if paid monthly");
});

test("yearly School saves $198 against $1,188", () => {
  const school = publicPlans[2];
  assert.equal(planPriceLabel(school, "monthly"), "$99");
  assert.equal(planPriceLabel(school, "yearly"), "$990");
  const savings = yearlySavings(school);
  assert.ok(savings);
  assert.equal(formatUsd(savings.monthlyTimesTwelveUsd), "$1,188");
  assert.equal(savings.saveUsd, 198);
  assert.equal(savings.aboutMonths, 2);
  assert.equal(savingsLabel(savings), "Save $198 (~2 months)");
  assert.equal(savingsCompareLabel(savings), "$1,188 if paid monthly");
});
