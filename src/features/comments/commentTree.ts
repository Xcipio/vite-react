import { Comment } from "../../types/comment";

export type CommentNode = Comment & {
  replies: CommentNode[];
};

export function buildCommentTree(
  comments: Comment[],
  parentId: number | null = null,
): CommentNode[] {
  return comments
    .filter((comment) => comment.parent_id === parentId)
    .map((comment) => ({
      ...comment,
      replies: buildCommentTree(comments, comment.id),
    }));
}

export function findCommentById(
  comments: CommentNode[],
  commentId: number | null,
): CommentNode | null {
  if (commentId === null) {
    return null;
  }

  for (const comment of comments) {
    if (comment.id === commentId) {
      return comment;
    }

    const nestedMatch = findCommentById(comment.replies, commentId);

    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}
