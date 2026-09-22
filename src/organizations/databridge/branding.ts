import {
  brandIconObjectPath,
  brandIconPublicUrl,
  type BrandIconExtension,
} from "@/organizations/model/brand";
import { requireSupabase } from "./client";

export const ORG_BRAND_BUCKET = "org-brand";

export type OrganizationBranding = {
  accentColor: string | null;
  iconPath: string | null;
  iconUrl: string | null;
  updatedAt: string;
};

type BrandingRow = {
  accent_color: string | null;
  icon_path: string | null;
  updated_at: string;
};

export async function getOrganizationBranding(
  organizationId: number,
): Promise<OrganizationBranding | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("organization_branding")
    .select("accent_color, icon_path, updated_at")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toBranding(data);
}

export async function saveOrganizationBranding(input: {
  organizationId: number;
  accentColor: string | null;
  iconFile: File | null;
  iconExtension: BrandIconExtension | null;
  removeIcon: boolean;
  currentIconPath: string | null;
}): Promise<void> {
  const db = requireSupabase();
  let iconPath = input.removeIcon ? null : input.currentIconPath;
  let uploadedPath: string | null = null;

  if (input.iconFile && input.iconExtension) {
    iconPath = brandIconObjectPath(input.organizationId, input.iconExtension);
    const { error } = await db.storage.from(ORG_BRAND_BUCKET).upload(iconPath, input.iconFile, {
      upsert: true,
      contentType: input.iconFile.type || undefined,
      cacheControl: "3600",
    });
    if (error) {
      throw new Error("Couldn’t upload that icon. Try a smaller PNG, JPEG, or WebP.");
    }
    uploadedPath = iconPath;
  }

  try {
    if (!input.accentColor && !iconPath) {
      const { error } = await db
        .from("organization_branding")
        .delete()
        .eq("organization_id", input.organizationId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("organization_branding").upsert(
        {
          organization_id: input.organizationId,
          accent_color: input.accentColor,
          icon_path: iconPath,
        },
        { onConflict: "organization_id" },
      );
      if (error) throw new Error(error.message);
    }
  } catch (error) {
    if (uploadedPath && uploadedPath !== input.currentIconPath) {
      await db.storage.from(ORG_BRAND_BUCKET).remove([uploadedPath]);
    }
    throw error;
  }

  if (input.currentIconPath && input.currentIconPath !== iconPath) {
    await db.storage.from(ORG_BRAND_BUCKET).remove([input.currentIconPath]);
  }
}

export async function clearOrganizationBranding(
  organizationId: number,
  iconPath: string | null,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("organization_branding")
    .delete()
    .eq("organization_id", organizationId);
  if (error) throw new Error(error.message);
  if (iconPath) {
    await db.storage.from(ORG_BRAND_BUCKET).remove([iconPath]);
  }
}

function toBranding(row: BrandingRow): OrganizationBranding {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return {
    accentColor: row.accent_color,
    iconPath: row.icon_path,
    iconUrl:
      row.icon_path && supabaseUrl
        ? brandIconPublicUrl(supabaseUrl, row.icon_path, row.updated_at)
        : null,
    updatedAt: row.updated_at,
  };
}
