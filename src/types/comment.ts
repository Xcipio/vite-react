export type Comment = {
  id: number;
  post_slug: string;
  author_name: string;
  author_email: string | null;
  content: string;
  parent_id: number | null;
  is_approved: boolean;
  created_at: string;
};

export type CommentInsert = {
  post_slug: string;
  author_name: string;
  author_email?: string | null;
  content: string;
  parent_id?: number | null;
};
