import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createComment,
  deleteOwnComment,
  fetchApprovedComments,
} from "../lib/comments";
import { getClientDeviceId } from "../lib/clientIdentity";
import {
  sendCommentNotification,
  sendReplyNotification,
} from "../lib/notifications";
import { Comment } from "../types/comment";
import CommentItem from "../features/comments/CommentItem";
import {
  readOwnedCommentsMap,
  removeOwnedCommentId,
  saveOwnedCommentId,
} from "../features/comments/commentStorage";
import { buildCommentTree, CommentNode } from "../features/comments/commentTree";

type CommentsSectionProps = {
  postSlug: string;
  postTitle: string;
  language?: "zh" | "en";
  variant?: "default" | "friends";
};

const COMMENT_SUBMIT_COOLDOWN_MS = 30_000;
const MIN_COMMENT_FILL_TIME_MS = 2_500;
const COMMENT_COOLDOWN_KEY = "comment-submit-last-at";

function CommentsSection({
  postSlug,
  postTitle,
  language = "zh",
  variant = "default",
}: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [formMountedAt] = useState(() => Date.now());
  const [currentDeviceId] = useState(() => getClientDeviceId());
  const [ownedCommentIds, setOwnedCommentIds] = useState<Set<number>>(() => new Set());
  const copy = {
    commentsTitle: language === "en" ? "Comments" : "评论区",
    intro:
      language === "en"
        ? variant === "friends"
          ? "If this contribution sparked a thought, leave a note for the author here."
          : "If this piece stirred a thought, leave a few words here."
        : variant === "friends"
          ? "如果这篇投稿让你想起了什么，欢迎在这里给作者留几句话。"
          : "如果这篇文章让你想起了什么，欢迎留下几句话。",
    loadError: language === "en" ? "Comments are unavailable right now." : "评论暂时无法加载。",
    submitError: language === "en" ? "Could not post right now. Try again in a moment." : "提交失败，请稍后再试。",
    tooFast:
      language === "en"
        ? "That was a little too fast. Wait a moment and try again."
        : "你提交得有点快，稍等片刻再试。",
    cooldown:
      language === "en"
        ? "You just posted a moment ago. Please wait before sending another."
        : "刚刚已经提交过一次了，稍后再试。",
    required:
      language === "en"
        ? "Please enter your name and comment first."
        : "请先填写名字和评论内容。",
    tooShort:
      language === "en"
        ? "Your comment is too short. Add a little more."
        : "评论内容太短了，再多写一点吧。",
    replyPosted: language === "en" ? "Reply posted." : "回复已发布。",
    commentPosted: language === "en" ? "Comment posted." : "留言已发布。",
    loading: language === "en" ? "Loading comments..." : "评论加载中...",
    empty:
      language === "en"
        ? "Nothing here yet. You can be the first to leave a thought."
        : "这里还很安静。你可以成为第一个留下想法的人。",
    honeypotPlaceholder: language === "en" ? "Leave this field empty" : "请留空",
    replyingTo: language === "en" ? "Replying to" : "回复给",
    cancel: language === "en" ? "Cancel" : "取消",
    name: language === "en" ? "Name" : "名字",
    namePlaceholder: language === "en" ? "What should I call you?" : "怎么称呼你？",
    reply: language === "en" ? "Reply" : "回复",
    comment: language === "en" ? "Comment" : "评论",
    replyPlaceholder: language === "en" ? "Write your reply..." : "写下你的回复...",
    commentPlaceholder: language === "en" ? "Write your thoughts..." : "写下你的想法...",
    sending: language === "en" ? "Sending..." : "发送中...",
    postReply: language === "en" ? "Post reply" : "发布回复",
    postComment: language === "en" ? "Post comment" : "写评论",
    deleteConfirm:
      language === "en"
        ? "Delete this comment?"
        : "确定删除这条评论吗？",
    deleteFailed:
      language === "en"
        ? "Could not delete this comment right now."
        : "暂时无法删除这条评论。",
    deleteSuccess:
      language === "en"
        ? "Comment deleted."
        : "评论已删除。",
  };

  const refreshComments = useCallback(async () => {
    const { data, error } = await fetchApprovedComments(postSlug);

    if (error) {
      console.error("Failed to fetch comments:", error);
      setErrorMessage(copy.loadError);
      return;
    }

    setComments(buildCommentTree(data ?? []));
    setErrorMessage(null);
  }, [copy.loadError, postSlug]);

  useEffect(() => {
    const loadComments = async () => {
      const ownedMap = readOwnedCommentsMap();
      setOwnedCommentIds(new Set(ownedMap[postSlug] ?? []));
      await refreshComments();
      setLoading(false);
    };

    void loadComments();
  }, [postSlug, refreshComments]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (website.trim()) {
      setFeedback(copy.submitError);
      return;
    }

    if (Date.now() - formMountedAt < MIN_COMMENT_FILL_TIME_MS) {
      setFeedback(copy.tooFast);
      return;
    }

    const lastSubmittedAt = Number(
      window.localStorage.getItem(COMMENT_COOLDOWN_KEY) || "0",
    );

    if (Date.now() - lastSubmittedAt < COMMENT_SUBMIT_COOLDOWN_MS) {
      setFeedback(copy.cooldown);
      return;
    }

    if (!authorName.trim() || !content.trim()) {
      setFeedback(copy.required);
      return;
    }

    if (content.trim().length < 3) {
      setFeedback(copy.tooShort);
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const { data, error } = await createComment({
      post_slug: postSlug,
      device_id: currentDeviceId,
      author_name: authorName.trim(),
      content: content.trim(),
      parent_id: replyTarget?.id ?? null,
    });

    if (error) {
      console.error("Failed to submit comment:", error);
      setFeedback(copy.submitError);
      setSubmitting(false);
      return;
    }

    setAuthorName("");
    setContent("");
    setWebsite("");
    setReplyTarget(null);
    window.localStorage.setItem(COMMENT_COOLDOWN_KEY, String(Date.now()));
    setFeedback(replyTarget ? copy.replyPosted : copy.commentPosted);
    setSubmitting(false);

    if (data?.id) {
      saveOwnedCommentId(postSlug, data.id);
      setOwnedCommentIds((currentIds) => new Set([...currentIds, data.id]));
    }

    const postUrl =
      language === "en"
        ? `${window.location.origin}/en/post/${postSlug}`
        : `${window.location.origin}/post/${postSlug}`;

    if (replyTarget) {
      const { error: notifyError } = await sendReplyNotification({
        postSlug,
        postTitle,
        replyAuthorName: authorName.trim(),
        replyContent: content.trim(),
        parentCommentId: replyTarget.id,
        parentAuthorName: replyTarget.author_name,
        postUrl,
      });

      if (notifyError) {
        console.error("Failed to send reply notification:", notifyError);
      }
    } else {
      const { error: notifyError } = await sendCommentNotification({
        postSlug,
        postTitle,
        commentAuthorName: authorName.trim(),
        commentContent: content.trim(),
        postUrl,
        language,
      });

      if (notifyError) {
        console.error("Failed to send comment notification:", notifyError);
      }
    }

    await refreshComments();
  };

  const handleDelete = async (comment: Comment) => {
    if (!window.confirm(copy.deleteConfirm)) {
      return;
    }

    setDeletingCommentId(comment.id);
    setFeedback(null);

    const { error } = await deleteOwnComment(comment.id);

    if (error) {
      console.error("Failed to delete comment:", error);
      setFeedback(copy.deleteFailed);
      setDeletingCommentId(null);
      return;
    }

    if (replyTarget?.id === comment.id) {
      setReplyTarget(null);
    }

    removeOwnedCommentId(postSlug, comment.id);
    setOwnedCommentIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(comment.id);
      return nextIds;
    });
    setFeedback(copy.deleteSuccess);
    setDeletingCommentId(null);
    await refreshComments();
  };

  return (
    <section className="comments-section">
      <div className="comments-header">
        <p className="section-label">THOUGHTS</p>
        <h2 className="section-title comments-title">{copy.commentsTitle}</h2>
        <p className="section-text comments-intro">{copy.intro}</p>
      </div>

      <div className="comments-shell">
        <div className="comments-list">
          {loading ? (
            <p className="comments-state">{copy.loading}</p>
          ) : errorMessage ? (
            <p className="comments-state">{errorMessage}</p>
          ) : comments.length === 0 ? (
            <p className="comments-state">{copy.empty}</p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                rootComments={comments}
                language={language}
                ownedCommentIds={ownedCommentIds}
                deletingCommentId={deletingCommentId}
                onReply={(targetComment) => {
                  setReplyTarget(targetComment);
                  setFeedback(null);
                }}
                onDelete={(targetComment) => {
                  void handleDelete(targetComment);
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
              placeholder={copy.honeypotPlaceholder}
            />
          </label>

          {replyTarget && (
            <div className="comment-replying">
              <span className="comment-replying-text">
                {copy.replyingTo} {replyTarget.author_name}
              </span>
              <button
                className="comment-reply-cancel"
                type="button"
                onClick={() => setReplyTarget(null)}
              >
                {copy.cancel}
              </button>
            </div>
          )}

          <div className="comment-form-grid">
            <label className="comment-field">
              <span className="comment-field-label">{copy.name}</span>
              <input
                className="comment-input"
                type="text"
                maxLength={40}
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder={copy.namePlaceholder}
              />
            </label>
          </div>

          <label className="comment-field">
            <span className="comment-field-label">
              {replyTarget ? copy.reply : copy.comment}
            </span>
            <textarea
              className="comment-textarea"
              maxLength={1000}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={replyTarget ? copy.replyPlaceholder : copy.commentPlaceholder}
              rows={6}
            />
          </label>

          <div className="comment-form-footer">
            <button className="comment-submit" type="submit" disabled={submitting}>
              {submitting ? copy.sending : replyTarget ? copy.postReply : copy.postComment}
            </button>
            {feedback && <p className="comment-feedback">{feedback}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}

export default CommentsSection;
