import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type PostContentProps = {
  content: string;
};

function flattenChildrenText(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (React.isValidElement(child)) {
        return flattenChildrenText(child.props.children);
      }

      return "";
    })
    .join("")
    .trim();
}

function createHeadingId(prefix: string, children: React.ReactNode): string {
  const rawText = flattenChildrenText(children);
  const normalized = rawText
    .toLowerCase()
    .replace(/['".,!?():，。！？、“”‘’]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${prefix}-${normalized || "section"}`;
}

function PostContent({ content }: PostContentProps) {
  return (
    <div className="post-content">
      <ReactMarkdown
        components={{
          h1: ({ children }) => {
            const id = createHeadingId("section", children);
            return (
              <h1 id={id} className="post-content-heading post-content-heading-h1">
                {children}
              </h1>
            );
          },
          h2: ({ children }) => {
            const id = createHeadingId("section", children);
            return (
              <h2 id={id} className="post-content-heading post-content-heading-h2">
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const id = createHeadingId("section", children);
            return (
              <h3 id={id} className="post-content-heading post-content-heading-h3">
                {children}
              </h3>
            );
          },
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong>{children}</strong>,
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          code({
            className,
            children,
            ...props
          }: {
            className?: string;
            children?: React.ReactNode;
          }) {
            const match = /language-(\w+)/.exec(className || "");

            if (match) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }

            return (
              <code {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default PostContent;
