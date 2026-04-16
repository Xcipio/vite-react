export type Artwork = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string;
  image_urls: string[];
  medium: string | null;
  year: number | null;
  series: string | null;
  tag: string | null;
  tag_2: string | null;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
};
