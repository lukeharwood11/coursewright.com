import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatUsd,
  planPeriodLabel,
  planPriceLabel,
  publicPlans,
  savingsCompareLabel,
  savingsLabel,
  yearlySavings,
} from "./pricingPlans.ts";

test("public ladder is Family, Family Pro, Microschool, and School", () => {
  assert.deepEqual(
    publicPlans.map((plan) => plan.name),
    ["Family", "Family Pro", "Microschool", "School"],
  );
});

test("Family is free on both intervals and says collaborators", () => {
  const family = publicPlans[0];
  assert.equal(planPriceLabel(family, "monthly"), "Free");
  assert.equal(planPriceLabel(family, "yearly"), "Free");
  assert.equal(yearlySavings(family), null);
  assert.ok(family.caps.some((line) => line.includes("collaborators")));
  assert.equal(
    family.caps.some((line) => line.toLowerCase().includes("staff")),
    false,
  );
});

test("Family Pro is $5/mo and $49/yr", () => {
  const pro = publicPlans[1];
  assert.equal(planPriceLabel(pro, "monthly"), "$5");
  assert.equal(planPeriodLabel(pro, "monthly"), "per month");
  assert.equal(planPriceLabel(pro, "yearly"), "$49");
  assert.equal(planPeriodLabel(pro, "yearly"), "per year");
  const savings = yearlySavings(pro);
  assert.ok(savings);
  assert.equal(savings.monthlyTimesTwelveUsd, 60);
  assert.equal(savings.saveUsd, 11);
});

test("Microschool yearly display is $695/mo and monthly stays $79", () => {
  const microschool = publicPlans[2];
  assert.equal(planPriceLabel(microschool, "monthly"), "$79");
  assert.equal(planPeriodLabel(microschool, "monthly"), "per month");
  assert.equal(planPriceLabel(microschool, "yearly"), "$695/mo");
  assert.equal(planPeriodLabel(microschool, "yearly"), null);
  assert.equal(yearlySavings(microschool), null);
});

test("yearly School saves $198 against $1,188", () => {
  const school = publicPlans[3];
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
