import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SitePhoto = { id: string; path: string; kind: string; sort: number; url: string };

export async function loadSitePhotos(): Promise<SitePhoto[]> {
  const { data } = await supabase.from("site_photos").select("*").order("sort").order("created_at", { ascending: false });
  const rows = data ?? [];
  if (!rows.length) return [];
  const { data: signed } = await supabase.storage.from("photos").createSignedUrls(rows.map((r) => r.path), 60 * 60 * 24 * 7);
  return rows.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl ?? "" })).filter((r) => r.url);
}

export function useSitePhotos() {
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  useEffect(() => { loadSitePhotos().then(setPhotos); }, []);
  return photos;
}
