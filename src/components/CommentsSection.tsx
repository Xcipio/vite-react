import { FormEvent, useEffect, useState } from "react";
import { createComment, fetchApprovedComments } from "../lib/comments";
import { Comment } from "../types/comment";

type CommentsSectionProps = {
  postSlug: string;
};

type CommentNode = Comment & {
  replies: CommentNode[];
};

const COMMENT_SUBMIT_COOLDOWN_MS = 30_000;
const MIN_COMMENT_FILL_TIME_MS = 2_500;
const COMMENT_COOLDOWN_KEY = "comment-submit-last-at";

function buildCommentTree(comments: Comment[], parentId: number | null = null): CommentNode[] {
  return comments
    .filter((comment) => comment.parent_id === parentId)
    .map((comment) => ({
      ...comment,
      replies: buildCommentTree(comments, comment.id),
    }));
}

function CommentItem({
  comment,
  depth,
  onReply,
}: {
  comment: CommentNode;
  depth: number;
  onReply: (comment: Comment) => void;
}) {
  const nestingLevel = depth > 1 ? "comment-replies-nested" : "comment-replies-root";

  return (
    <article className={depth === 0 ? "comment-card" : "comment-reply-card"}>
      <div className="comment-meta">
        <strong className="comment-author">{comment.author_name}</strong>
        <span className="comment-date">
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
      </div>

      <p className="comment-content">{comment.content}</p>

      <div className="comment-actions">
        <button
          className="comment-reply-button"
          type="button"
          onClick={() => onReply(comment)}
        >
          Reply
        </button>
      </div>

      {comment.replies.length > 0 && (
        <div className={`comment-replies ${nestingLevel}`}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={Math.min(depth + 1, 2)}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function CommentsSection({ postSlug }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [formMountedAt] = useState(() => Date.now());

  useEffect(() => {
    const loadComments = async () => {
      const { data, error } = await fetchApprovedComments(postSlug);

      if (error) {
        console.error("Failed to fetch comments:", error);
        setErrorMessage("评论暂时无法加载。");
      } else {
        setComments(buildCommentTree(data ?? []));
      }

      setLoading(false);
    };

    loadComments();
  }, [postSlug]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (website.trim()) {
      setFeedback("提交失败，请稍后再试。");
      return;
    }

    if (Date.now() - formMountedAt < MIN_COMMENT_FILL_TIME_MS) {
      setFeedback("你提交得有点快，稍等片刻再试。");
      return;
    }

    const lastSubmittedAt = Number(
      window.localStorage.getItem(COMMENT_COOLDOWN_KEY) || "0",
    );

    if (Date.now() - lastSubmittedAt < COMMENT_SUBMIT_COOLDOWN_MS) {
      setFeedback("刚刚已经提交过一次了，稍后再试。");
      return;
    }

    if (!authorName.trim() || !content.trim()) {
      setFeedback("请先填写名字和评论内容。");
      return;
    }

    if (content.trim().length < 3) {
      setFeedback("评论内容太短了，再多写一点吧。");
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const { error } = await createComment({
      post_slug: postSlug,
      author_name: authorName.trim(),
      content: content.trim(),
      parent_id: replyTarget?.id ?? null,
    });

    if (error) {
      console.error("Failed to submit comment:", error);
      setFeedback("提交失败，请稍后再试。");
      setSubmitting(false);
      return;
    }

    setAuthorName("");
    setContent("");
    setWebsite("");
    setReplyTarget(null);
    window.localStorage.setItem(COMMENT_COOLDOWN_KEY, String(Date.now()));
    setFeedback(replyTarget ? "回复已发布。" : "留言已发布。");
    setSubmitting(false);

    const { data, error: refreshError } = await fetchApprovedComments(postSlug);

    if (refreshError) {
      console.error("Failed to refresh comments:", refreshError);
      return;
    }

    setComments(buildCommentTree(data ?? []));
  };

  return (
    <section className="comments-section">
      <div className="comments-header">
        <p className="section-label">THOUGHTS</p>
        <h2 className="section-title comments-title">评论区</h2>
        <p className="section-text comments-intro">
          如果这篇文章让你想起了什么，欢迎留下几句话。
        </p>
      </div>

      <div className="comments-shell">
        <div className="comments-list">
          {loading ? (
            <p className="comments-state">Loading comments...</p>
          ) : errorMessage ? (
            <p className="comments-state">{errorMessage}</p>
          ) : comments.length === 0 ? (
            <p className="comments-state">
              这里还很安静。你可以成为第一个留下想法的人。
            </p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                onReply={(targetComment) => {
                  setReplyTarget(targetComment);
                  setFeedback(null);
                }}
              />
            ))
          )}
        </div>

        <form className="comment-form" onSubmit={handleSubmit}>
          <label className="comment-field comment-honeypot" aria-hidden="true">
            <span className="comment-field-label">Website</span>
            <input
              className="comment-input"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="Leave this field empty"
            />
          </label>

          {replyTarget && (
            <div className="comment-replying">
              <span className="comment-replying-text">
                回复给 {replyTarget.author_name}
              </span>
              <button
                className="comment-reply-cancel"
                type="button"
                onClick={() => setReplyTarget(null)}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="comment-form-grid">
            <label className="comment-field">
              <span className="comment-field-label">Name</span>
              <input
                className="comment-input"
                type="text"
                maxLength={40}
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder="怎么称呼你？"
              />
            </label>
          </div>

          <label className="comment-field">
            <span className="comment-field-label">
              {replyTarget ? "Reply" : "Comment"}
            </span>
            <textarea
              className="comment-textarea"
              maxLength={1000}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={replyTarget ? "写下你的回复..." : "写下你的想法..."}
              rows={6}
            />
          </label>

          <div className="comment-form-footer">
            <button className="comment-submit" type="submit" disabled={submitting}>
              {submitting
                ? "Sending..."
                : replyTarget
                  ? "Post reply"
                  : "写评论"}
            </button>
            {feedback && <p className="comment-feedback">{feedback}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}

export default CommentsSection;
