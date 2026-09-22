export const ORG_ABOUT_MAX = 4000;
export const ORG_ADDRESS_MAX = 500;
export const ORG_WEBSITE_MAX = 200;
export const ORG_CONTACT_EMAIL_MAX = 200;
export const ORG_PHONE_MAX = 200;

const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type OrgProfileFields = {
  about: string | null;
  address: string | null;
  website: string | null;
  contactEmail: string | null;
  phone: string | null;
};

export function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function orgHasProfile(profile: OrgProfileFields): boolean {
  return Boolean(
    profile.about ||
      profile.address ||
      profile.website ||
      profile.contactEmail ||
      profile.phone,
  );
}

function parseCappedText(
  value: string,
  max: number,
  label: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = trimToNull(value);
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > max) {
    return { ok: false, error: `${label} must be ${max} characters or fewer.` };
  }
  return { ok: true, value: trimmed };
}

export function parseWebsite(
  value: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = trimToNull(value);
  if (!trimmed) return { ok: true, value: null };
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: "Website must be a valid web address." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Website must start with http:// or https://." };
  }
  const href = parsed.href;
  if (href.length > ORG_WEBSITE_MAX) {
    return { ok: false, error: `Website must be ${ORG_WEBSITE_MAX} characters or fewer.` };
  }
  return { ok: true, value: href };
}

export function parseContactEmail(
  value: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = trimToNull(value);
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > ORG_CONTACT_EMAIL_MAX) {
    return {
      ok: false,
      error: `Contact email must be ${ORG_CONTACT_EMAIL_MAX} characters or fewer.`,
    };
  }
  if (!CONTACT_EMAIL_PATTERN.test(trimmed)) {
    return { ok: false, error: "Contact email doesn’t look like an email address." };
  }
  return { ok: true, value: trimmed.toLowerCase() };
}

export function parseOrgProfile(input: {
  about: string;
  address: string;
  website: string;
  contactEmail: string;
  phone: string;
}): { ok: true; value: OrgProfileFields } | { ok: false; error: string } {
  const about = parseCappedText(input.about, ORG_ABOUT_MAX, "About");
  if (!about.ok) return about;
  const address = parseCappedText(input.address, ORG_ADDRESS_MAX, "Location");
  if (!address.ok) return address;
  const website = parseWebsite(input.website);
  if (!website.ok) return website;
  const contactEmail = parseContactEmail(input.contactEmail);
  if (!contactEmail.ok) return contactEmail;
  const phone = parseCappedText(input.phone, ORG_PHONE_MAX, "Phone");
  if (!phone.ok) return phone;
  return {
    ok: true,
    value: {
      about: about.value,
      address: address.value,
      website: website.value,
      contactEmail: contactEmail.value,
      phone: phone.value,
    },
  };
}

export function websiteDisplay(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function sameOptionalText(left: string, right: string | null): boolean {
  return (trimToNull(left) ?? null) === right;
}
