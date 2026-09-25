import assert from "node:assert/strict";
import { test } from "node:test";
import { K12_GRADE_LABELS } from "./createDefaults.ts";
import {
  orgSettingsHaveChanges,
  validateUpdateOrganization,
} from "./updateOrganization.ts";

const baseInput = {
  name: "Oak Co-op",
  slug: "oak-coop",
  orgType: "coop",
  gradeScheme: "k12",
  gradeLabels: [...K12_GRADE_LABELS],
  schoolDays: [1, 2, 3, 4, 5],
  about: "",
  address: "",
  website: "",
  contactEmail: "",
  phone: "",
  currentSlug: "oak-coop",
  confirmPermalinkChange: false,
};

test("validateUpdateOrganization allows none grade scheme with empty labels", () => {
  const parsed = validateUpdateOrganization({
    ...baseInput,
    gradeScheme: "none",
    gradeLabels: [],
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.gradeScheme, "none");
    assert.deepEqual(parsed.value.gradeLabels, []);
  }
});

test("validateUpdateOrganization requires at least one school day", () => {
  const parsed = validateUpdateOrganization({ ...baseInput, schoolDays: [] });
  assert.equal(parsed.ok, false);
  if (!parsed.ok) assert.equal(parsed.error, "Choose at least one school day.");
});

test("validateUpdateOrganization keeps profile fields", () => {
  const parsed = validateUpdateOrganization({
    ...baseInput,
    about: "We meet Tuesdays.",
    website: "oak.example",
    schoolDays: [2, 4],
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.about, "We meet Tuesdays.");
    assert.equal(parsed.value.website, "https://oak.example/");
    assert.deepEqual(parsed.value.schoolDays, [2, 4]);
  }
});

test("orgSettingsHaveChanges treats https-normalized website as unchanged", () => {
  assert.equal(
    orgSettingsHaveChanges(
      {
        name: "Oak Co-op",
        slug: "oak-coop",
        orgType: "coop",
        gradeScheme: "k12",
        gradeLabelsText: "",
        schoolDays: [1, 2, 3, 4, 5],
        about: "",
        address: "",
        website: "oak.example",
        contactEmail: "",
        phone: "",
      },
      {
        name: "Oak Co-op",
        slug: "oak-coop",
        orgType: "coop",
        gradeScheme: "k12",
        gradeLabels: [...K12_GRADE_LABELS],
        schoolDays: [1, 2, 3, 4, 5],
        about: null,
        address: null,
        website: "https://oak.example/",
        contactEmail: null,
        phone: null,
      },
    ),
    false,
  );
});
