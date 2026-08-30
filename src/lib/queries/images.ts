/**
 * Image query functions — server-side data fetching.
 */
import { createServerClient } from "@/lib/supabase/server";
import type { GarmentImage } from "@/lib/supabase/types";

/** All images for a garment, ordered by display_order ascending. */
export async function getImagesByGarment(garmentId: string): Promise<GarmentImage[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("images")
    .select("*")
    .eq("garment_id", garmentId)
    .order("display_order", { ascending: true });

  if (error) throw new Error(`getImagesByGarment: ${error.message}`);
  return data ?? [];
}
