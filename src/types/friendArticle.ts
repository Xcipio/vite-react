export type FriendArticleCategory = "故事" | "专题" | "随笔";

export type FriendArticle = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  published_at: string;
  author_name: string;
  author_profile: string | null;
  author_avatar_url: string | null;
  author_homepage_url: string | null;
  author_social_label: string | null;
  author_social_url: string | null;
  original_url: string | null;
  category: FriendArticleCategory | null;
  tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
