/**
 * Database TypeScript types — generated from Supabase schema.
 *
 * HOW TO REGENERATE after running migrations:
 *   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/types.ts
 *
 * The placeholder below gives the full shape based on PLAN.md §2.
 * Replace this file with the real generated output once the schema is live.
 */

export type PriceType = "fixed" | "starting_from" | "on_enquiry";
export type GarmentStatus = "published" | "hidden";

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          display_order: number;
          cover_image_url: string | null;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          display_order?: number;
          cover_image_url?: string | null;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          display_order?: number;
          cover_image_url?: string | null;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      garments: {
        Row: {
          id: string;
          title: string;
          slug: string;
          category_id: string;
          fabric: string | null;
          description: string | null;
          price: number | null;
          price_type: PriceType;
          is_featured: boolean;
          status: GarmentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          category_id: string;
          fabric?: string | null;
          description?: string | null;
          price?: number | null;
          price_type?: PriceType;
          is_featured?: boolean;
          status?: GarmentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          category_id?: string;
          fabric?: string | null;
          description?: string | null;
          price?: number | null;
          price_type?: PriceType;
          is_featured?: boolean;
          status?: GarmentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      images: {
        Row: {
          id: string;
          garment_id: string;
          url: string;
          thumbnail_url: string;
          alt_text: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          garment_id: string;
          url: string;
          thumbnail_url: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          garment_id?: string;
          url?: string;
          thumbnail_url?: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience row types — import these in components and queries
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export type Garment = Database["public"]["Tables"]["garments"]["Row"];
export type GarmentInsert = Database["public"]["Tables"]["garments"]["Insert"];
export type GarmentUpdate = Database["public"]["Tables"]["garments"]["Update"];

export type GarmentImage = Database["public"]["Tables"]["images"]["Row"];
export type GarmentImageInsert = Database["public"]["Tables"]["images"]["Insert"];
export type GarmentImageUpdate = Database["public"]["Tables"]["images"]["Update"];

// Garment with joined category name — used in public pages
export type GarmentWithCategory = Garment & {
  categories: Pick<Category, "name" | "slug"> | null;
};

// Garment with its images — used on the detail page
export type GarmentWithImages = Garment & {
  images: GarmentImage[];
  categories: Pick<Category, "name" | "slug"> | null;
};
