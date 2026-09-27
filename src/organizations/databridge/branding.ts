import {
  brandIconObjectPath,
  brandIconPublicUrl,
  brandLogoObjectPath,
  type BrandIconExtension,
} from "@/organizations/model/brand";
import { requireSupabase } from "./client";

export const ORG_BRAND_BUCKET = "org-brand";

export type OrganizationBranding = {
  accentColor: string | null;
  iconPath: string | null;
  iconUrl: string | null;
  logoPath: string | null;
  logoUrl: string | null;
  logoAccentBackground: boolean;
  updatedAt: string;
};

type BrandingRow = {
  accent_color: string | null;
  icon_path: string | null;
  logo_path: string | null;
  logo_accent_background: boolean;
  updated_at: string;
};

export async function getOrganizationBranding(
  organizationId: number,
): Promise<OrganizationBranding | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("organization_branding")
    .select("accent_color, icon_path, logo_path, logo_accent_background, updated_at")
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
  logoFile: File | null;
  logoExtension: BrandIconExtension | null;
  removeLogo: boolean;
  currentLogoPath: string | null;
  logoAccentBackground: boolean;
}): Promise<void> {
  const db = requireSupabase();
  let iconPath = input.removeIcon ? null : input.currentIconPath;
  let logoPath = input.removeLogo ? null : input.currentLogoPath;
  const uploadedPaths: string[] = [];

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
    uploadedPaths.push(iconPath);
  }

  if (input.logoFile && input.logoExtension) {
    logoPath = brandLogoObjectPath(input.organizationId, input.logoExtension);
    const { error } = await db.storage.from(ORG_BRAND_BUCKET).upload(logoPath, input.logoFile, {
      upsert: true,
      contentType: input.logoFile.type || undefined,
      cacheControl: "3600",
    });
    if (error) {
      throw new Error("Couldn’t upload that logo. Try a smaller PNG, JPEG, or WebP.");
    }
    uploadedPaths.push(logoPath);
  }

  const previousIconPath = input.currentIconPath;
  const previousLogoPath = input.currentLogoPath;

  try {
    if (!input.accentColor && !iconPath && !logoPath) {
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
          logo_path: logoPath,
          logo_accent_background: logoPath ? input.logoAccentBackground : false,
        },
        { onConflict: "organization_id" },
      );
      if (error) throw new Error(error.message);
    }
  } catch (error) {
    for (const path of uploadedPaths) {
      if (path !== previousIconPath && path !== previousLogoPath) {
        await db.storage.from(ORG_BRAND_BUCKET).remove([path]);
      }
    }
    throw error;
  }

  const pathsToRemove: string[] = [];
  if (previousIconPath && previousIconPath !== iconPath) pathsToRemove.push(previousIconPath);
  if (previousLogoPath && previousLogoPath !== logoPath) pathsToRemove.push(previousLogoPath);
  if (pathsToRemove.length > 0) {
    await db.storage.from(ORG_BRAND_BUCKET).remove(pathsToRemove);
  }
}

export async function clearOrganizationBranding(
  organizationId: number,
  iconPath: string | null,
  logoPath: string | null,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("organization_branding")
    .delete()
    .eq("organization_id", organizationId);
  if (error) throw new Error(error.message);
  const paths = [iconPath, logoPath].filter((path): path is string => Boolean(path));
  if (paths.length > 0) {
    await db.storage.from(ORG_BRAND_BUCKET).remove(paths);
  }
}

function toBranding(row: BrandingRow): OrganizationBranding {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const updatedAt = row.updated_at;
  return {
    accentColor: row.accent_color,
    iconPath: row.icon_path,
    iconUrl:
      row.icon_path && supabaseUrl
        ? brandIconPublicUrl(supabaseUrl, row.icon_path, updatedAt)
        : null,
    logoPath: row.logo_path,
    logoUrl:
      row.logo_path && supabaseUrl
        ? brandIconPublicUrl(supabaseUrl, row.logo_path, updatedAt)
        : null,
    logoAccentBackground: row.logo_accent_background,
    updatedAt,
  };
}
