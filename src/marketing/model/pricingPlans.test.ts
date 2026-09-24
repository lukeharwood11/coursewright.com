import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatUsd,
  planPeriodLabel,
  planPriceLabel,
  planYearlyTotalLabel,
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

test("every plan explains its audience and included features", () => {
  for (const plan of publicPlans) {
    assert.ok(plan.detailIntro.length > 40);
    assert.ok(plan.features.length > 0);
    for (const feature of plan.features) {
      assert.ok(feature.title.length > 0);
      assert.ok(feature.description.length > 30);
    }
  }

  assert.deepEqual(
    publicPlans[0].features.map((feature) => feature.title),
    ["Course builder", "Weekly planning", "Sharing and print", "Reuse courses"],
  );
  assert.equal(publicPlans[1].features[0]?.title, "Everything in Family");
  assert.equal(publicPlans[2].features[0]?.title, "Everything in Family Pro");
  assert.equal(publicPlans[3].features[0]?.title, "Everything in Microschool");
});

test("every paid yearly plan costs ten months and saves two", () => {
  for (const plan of publicPlans) {
    if (plan.monthlyUsd == null || plan.yearlyUsd == null) continue;
    assert.equal(plan.yearlyUsd, plan.monthlyUsd * 10);
    assert.equal(yearlySavings(plan)?.monthsSaved, 2);
  }
});

test("Family is free with two students, one collaborator, and 1 GB", () => {
  const family = publicPlans[0];
  assert.equal(planPriceLabel(family, "monthly"), "Free");
  assert.equal(planPriceLabel(family, "yearly"), "Free");
  assert.equal(planYearlyTotalLabel(family, "yearly"), null);
  assert.equal(yearlySavings(family), null);
  assert.deepEqual(family.caps, ["Up to 2 student profiles", "1 collaborator", "1 GB storage"]);
  assert.equal(
    family.caps.some((line) => line.toLowerCase().includes("staff")),
    false,
  );
});

test("Family Pro shows its monthly rate and yearly total", () => {
  const pro = publicPlans[1];
  assert.equal(planPriceLabel(pro, "monthly"), "$6");
  assert.equal(planPeriodLabel(pro, "monthly"), "per month");
  assert.equal(planPriceLabel(pro, "yearly"), "$5");
  assert.equal(planPeriodLabel(pro, "yearly"), "per month");
  assert.equal(planYearlyTotalLabel(pro, "yearly"), "$60 billed yearly");
  const savings = yearlySavings(pro);
  assert.ok(savings);
  assert.equal(savings.monthlyTimesTwelveUsd, 72);
  assert.equal(savings.saveUsd, 12);
});

test("Microschool is $72/mo and $60/mo billed yearly", () => {
  const microschool = publicPlans[2];
  assert.equal(planPriceLabel(microschool, "monthly"), "$72");
  assert.equal(planPeriodLabel(microschool, "monthly"), "per month");
  assert.equal(planPriceLabel(microschool, "yearly"), "$60");
  assert.equal(planPeriodLabel(microschool, "yearly"), "per month");
  assert.equal(planYearlyTotalLabel(microschool, "yearly"), "$720 billed yearly");
  const savings = yearlySavings(microschool);
  assert.ok(savings);
  assert.equal(savings.monthlyTimesTwelveUsd, 864);
  assert.equal(savings.saveUsd, 144);
});

test("yearly School shows $85/mo and saves two months", () => {
  const school = publicPlans[3];
  assert.equal(planPriceLabel(school, "monthly"), "$102");
  assert.equal(planPriceLabel(school, "yearly"), "$85");
  assert.equal(planYearlyTotalLabel(school, "yearly"), "$1,020 billed yearly");
  const savings = yearlySavings(school);
  assert.ok(savings);
  assert.equal(formatUsd(savings.monthlyTimesTwelveUsd), "$1,224");
  assert.equal(savings.saveUsd, 204);
  assert.equal(savings.monthsSaved, 2);
  assert.equal(savingsLabel(savings), "Save $204 (2 months)");
  assert.equal(savingsCompareLabel(savings), "$1,224 if paid monthly");
});
