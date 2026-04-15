import { Post } from "../types/post";

export const tagColorMap: Record<
  string,
  {
    background: string;
    border: string;
    color: string;
    lightBackground: string;
    lightBorder: string;
    lightColor: string;
  }
> = {
  随笔: {
    background: "rgba(255, 140, 66, 0.14)",
    border: "rgba(255, 140, 66, 0.34)",
    color: "#ff8c42",
    lightBackground: "rgba(255, 140, 66, 0.1)",
    lightBorder: "rgba(255, 140, 66, 0.28)",
    lightColor: "#d96a20",
  },
  思维模型: {
    background: "rgba(78, 168, 255, 0.14)",
    border: "rgba(78, 168, 255, 0.34)",
    color: "#4ea8ff",
    lightBackground: "rgba(78, 168, 255, 0.1)",
    lightBorder: "rgba(78, 168, 255, 0.28)",
    lightColor: "#1f7fe0",
  },
  文心雕侬: {
    background: "rgba(255, 77, 79, 0.14)",
    border: "rgba(255, 77, 79, 0.34)",
    color: "#ff4d4f",
    lightBackground: "rgba(255, 77, 79, 0.1)",
    lightBorder: "rgba(255, 77, 79, 0.28)",
    lightColor: "#d9363e",
  },
  卡片: {
    background: "rgba(46, 204, 113, 0.14)",
    border: "rgba(46, 204, 113, 0.34)",
    color: "#2ecc71",
    lightBackground: "rgba(46, 204, 113, 0.1)",
    lightBorder: "rgba(46, 204, 113, 0.28)",
    lightColor: "#209a53",
  },
  哲学透镜: {
    background: "rgba(168, 85, 247, 0.16)",
    border: "rgba(168, 85, 247, 0.36)",
    color: "#c084fc",
    lightBackground: "rgba(168, 85, 247, 0.1)",
    lightBorder: "rgba(168, 85, 247, 0.26)",
    lightColor: "#8b5cf6",
  },
  永恒之城: {
    background: "rgba(49, 46, 129, 0.18)",
    border: "rgba(99, 102, 241, 0.34)",
    color: "#818cf8",
    lightBackground: "rgba(79, 70, 229, 0.1)",
    lightBorder: "rgba(79, 70, 229, 0.22)",
    lightColor: "#3730a3",
  },
};

export function getTagStyle(tag: string, theme: "dark" | "light") {
  const preset = tagColorMap[tag];

  if (!preset) {
    return theme === "light"
      ? {
          background: "rgba(0,0,0,0.05)",
          border: "1px solid rgba(0,0,0,0.1)",
          color: "rgba(5,7,13,0.7)",
        }
      : {
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(245,247,251,0.85)",
        };
  }

  return theme === "light"
    ? {
        background: preset.lightBackground,
        border: `1px solid ${preset.lightBorder}`,
        color: preset.lightColor,
      }
    : {
        background: preset.background,
        border: `1px solid ${preset.border}`,
        color: preset.color,
      };
}

export function getPostTags(post: Post) {
  return [post.tag, post.tag_2].filter((tag): tag is string => Boolean(tag));
}

export function sortTags(tags: string[]) {
  const tagOrder = Object.keys(tagColorMap);

  return [...tags].sort((left, right) => {
    const leftIndex = tagOrder.indexOf(left);
    const rightIndex = tagOrder.indexOf(right);

    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right, "zh-CN");
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}
