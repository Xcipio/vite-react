export type DailyQuote = {
  id: number;
  quote: string;
  author: string | null;
  source: string | null;
  language: "zh" | "en";
  tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
