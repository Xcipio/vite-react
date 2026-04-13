import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type PostContentProps = {
  content: string;
};

function PostContent({ content }: PostContentProps) {
  return (
    <div
      style={{
        marginTop: "32px",
        lineHeight: 1.8,
        fontSize: "18px",
      }}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontSize: "36px", margin: "32px 0 16px" }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: "28px", margin: "28px 0 12px" }}>
              {children}
            </h2>
          ),
          p: ({ children }) => <p style={{ margin: "16px 0" }}>{children}</p>,
          ul: ({ children }) => (
            <ul style={{ margin: "16px 0", paddingLeft: "20px" }}>{children}</ul>
          ),
          li: ({ children }) => <li style={{ margin: "8px 0" }}>{children}</li>,
          strong: ({ children }) => (
            <strong style={{ fontWeight: 700 }}>{children}</strong>
          ),
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
              <code
                style={{
                  background: "#222",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
                {...props}
              >
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
