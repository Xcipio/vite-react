import { Comment } from "../../types/comment";
import { CommentNode, findCommentById } from "./commentTree";

type CommentItemProps = {
  comment: CommentNode;
  depth: number;
  rootComments: CommentNode[];
  onReply: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  deletingCommentId: number | null;
  ownedCommentIds: Set<number>;
  language: "zh" | "en";
};

function CommentItem({
  comment,
  depth,
  rootComments,
  onReply,
  onDelete,
  deletingCommentId,
  ownedCommentIds,
  language,
}: CommentItemProps) {
  const nestingLevel = depth > 1 ? "comment-replies-nested" : "comment-replies-root";
  const replyTarget = findCommentById(rootComments, comment.parent_id);
  const isOwnComment = ownedCommentIds.has(comment.id);

  return (
    <article className={depth === 0 ? "comment-card" : "comment-reply-card"}>
      <div className="comment-meta">
        <strong className="comment-author">{comment.author_name}</strong>
        <span className="comment-date">
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
      </div>

      {replyTarget && (
        <p className="comment-reply-context">
          {language === "en"
            ? `${comment.author_name} replying to ${replyTarget.author_name}`
            : `${comment.author_name} 回复 ${replyTarget.author_name}`}
        </p>
      )}

      <p className="comment-content">{comment.content}</p>

      <div className="comment-actions">
        <button
          className="comment-reply-button"
          type="button"
          onClick={() => onReply(comment)}
        >
          {language === "en" ? "Reply" : "回复"}
        </button>
        {isOwnComment && (
          <button
            className="comment-reply-cancel"
            type="button"
            onClick={() => onDelete(comment)}
            disabled={deletingCommentId === comment.id}
          >
            {deletingCommentId === comment.id
              ? language === "en"
                ? "Deleting..."
                : "删除中..."
              : language === "en"
                ? "Delete"
                : "删除"}
          </button>
        )}
      </div>

      {comment.replies.length > 0 && (
        <div className={`comment-replies ${nestingLevel}`}>
          <p className="comment-replies-label">
            {language === "en" ? "Replies" : "回复"}
          </p>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={Math.min(depth + 1, 2)}
              rootComments={rootComments}
              onReply={onReply}
              onDelete={onDelete}
              deletingCommentId={deletingCommentId}
              ownedCommentIds={ownedCommentIds}
              language={language}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export default CommentItem;
