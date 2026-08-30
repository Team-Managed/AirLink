/**
 * MarkdownText — Lightweight markdown renderer for React Native.
 * Handles the common subset of markdown emitted by LLM agents:
 *   block: headings (#/##/###), code fences (```), bullet/numbered lists,
 *          blockquotes (>), horizontal rules (---), paragraphs
 *   inline: **bold**, *italic*, `code`, ~~strikethrough~~
 *
 * No external dependencies — pure React Native Views and Text.
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

export interface MarkdownTextProps {
  content: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline parser — splits a text string into styled <Text> segments
// ─────────────────────────────────────────────────────────────────────────────
function renderInline(text: string, prefix: string): React.ReactNode[] {
  // Split on bold, italic, inline-code, strikethrough patterns
  const INLINE_RE = /(\*\*[\s\S]*?\*\*|__[\s\S]*?__|\*[\s\S]*?\*|_[\s\S]*?_|`[^`]+`|~~[\s\S]*?~~)/g;
  const parts = text.split(INLINE_RE);

  return parts.map((part, i) => {
    const key = `${prefix}-${i}`;

    if ((part.startsWith("**") && part.endsWith("**")) ||
        (part.startsWith("__") && part.endsWith("__"))) {
      return (
        <Text key={key} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
        (part.startsWith("_") && part.endsWith("_") && part.length > 2)) {
      return (
        <Text key={key} style={styles.italic}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Text key={key} style={styles.inlineCode}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return (
        <Text key={key} style={styles.strikethrough}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={key}>{part}</Text>;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Block parser — converts raw markdown string into React Native blocks
// ─────────────────────────────────────────────────────────────────────────────
type Block =
  | { kind: "h1" | "h2" | "h3"; text: string }
  | { kind: "bullet"; text: string; depth: number }
  | { kind: "numbered"; text: string; num: number }
  | { kind: "blockquote"; text: string }
  | { kind: "rule" }
  | { kind: "code"; text: string; lang?: string }
  | { kind: "paragraph"; text: string }
  | { kind: "blank" };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i++;
      }
      i++; // skip closing fence (or EOF)
      blocks.push({ kind: "code", text: codeLines.join("\n"), ...(lang ? { lang } : {}) });
      continue;
    }

    // Heading
    const h3Match = trimmed.match(/^###\s+(.*)/);
    const h2Match = trimmed.match(/^##\s+(.*)/);
    const h1Match = trimmed.match(/^#\s+(.*)/);
    if (h1Match) { blocks.push({ kind: "h1", text: h1Match[1] ?? "" }); i++; continue; }
    if (h2Match) { blocks.push({ kind: "h2", text: h2Match[1] ?? "" }); i++; continue; }
    if (h3Match) { blocks.push({ kind: "h3", text: h3Match[1] ?? "" }); i++; continue; }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ kind: "rule" });
      i++;
      continue;
    }

    // Blockquote
    const quoteMatch = trimmed.match(/^>\s*(.*)/);
    if (quoteMatch) {
      blocks.push({ kind: "blockquote", text: quoteMatch[1] ?? "" });
      i++;
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    if (bulletMatch) {
      const depth = Math.floor((bulletMatch[1]?.length ?? 0) / 2);
      blocks.push({ kind: "bullet", text: bulletMatch[2] ?? "", depth });
      i++;
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      blocks.push({ kind: "numbered", text: numMatch[2] ?? "", num: parseInt(numMatch[1] ?? "1", 10) });
      i++;
      continue;
    }

    // Blank line
    if (trimmed === "") {
      blocks.push({ kind: "blank" });
      i++;
      continue;
    }

    // Paragraph — merge consecutive non-special lines
    const paraLines: string[] = [line];
    i++;
    while (i < lines.length) {
      const next = lines[i] ?? "";
      const nt = next.trim();
      if (nt === "" || nt.startsWith("#") || nt.startsWith("```") ||
          nt.startsWith(">") || /^[-*+]\s/.test(nt) || /^\d+\.\s/.test(nt) ||
          /^[-*_]{3,}$/.test(nt)) {
        break;
      }
      paraLines.push(next);
      i++;
    }
    blocks.push({ kind: "paragraph", text: paraLines.join(" ").trim() });
  }

  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const MarkdownText: React.FC<MarkdownTextProps> = React.memo(({ content }) => {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <View style={styles.container}>
      {blocks.map((block, idx) => {
        const key = `block-${idx}`;

        switch (block.kind) {
          case "blank":
            return <View key={key} style={styles.blank} />;

          case "rule":
            return <View key={key} style={styles.rule} />;

          case "h1":
            return (
              <Text key={key} style={[styles.heading, styles.h1]}>
                {renderInline(block.text, key)}
              </Text>
            );
          case "h2":
            return (
              <Text key={key} style={[styles.heading, styles.h2]}>
                {renderInline(block.text, key)}
              </Text>
            );
          case "h3":
            return (
              <Text key={key} style={[styles.heading, styles.h3]}>
                {renderInline(block.text, key)}
              </Text>
            );

          case "blockquote":
            return (
              <View key={key} style={styles.blockquote}>
                <Text style={styles.blockquoteText}>
                  {renderInline(block.text, key)}
                </Text>
              </View>
            );

          case "code":
            return (
              <View key={key} style={styles.codeBlock}>
                {block.lang ? (
                  <Text style={styles.codeLang}>{block.lang}</Text>
                ) : null}
                <Text style={styles.codeText} selectable>{block.text}</Text>
              </View>
            );

          case "bullet": {
            const indent = block.depth * 12;
            return (
              <View key={key} style={[styles.listRow, { paddingLeft: 12 + indent }]}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>
                  {renderInline(block.text, key)}
                </Text>
              </View>
            );
          }

          case "numbered":
            return (
              <View key={key} style={styles.listRow}>
                <Text style={styles.numberedBullet}>{block.num}.</Text>
                <Text style={styles.listText}>
                  {renderInline(block.text, key)}
                </Text>
              </View>
            );

          case "paragraph":
          default:
            return (
              <Text key={key} style={styles.paragraph}>
                {renderInline(block.text, key)}
              </Text>
            );
        }
      })}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    gap: 5,
  },

  // Inline
  bold: {
    fontWeight: "800",
    color: "#ffffff",
  },
  italic: {
    fontStyle: "italic",
    color: "rgba(255, 255, 255, 0.9)",
  },
  inlineCode: {
    fontFamily: "monospace",
    fontSize: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    color: "#ffffff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  strikethrough: {
    textDecorationLine: "line-through",
    color: "rgba(255, 255, 255, 0.5)",
  },

  // Headings
  heading: {
    color: "#ffffff",
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 6,
  },
  h1: { fontSize: 18 },
  h2: { fontSize: 15.5 },
  h3: { fontSize: 13.5 },

  // Paragraph
  paragraph: {
    color: "#ffffff",
    fontSize: 13.5,
    lineHeight: 22,
  },

  // Blank spacer
  blank: { height: 6 },

  // Horizontal rule
  rule: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: 8,
  },

  // Blockquote
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#ffffff",
    paddingLeft: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderRadius: 6,
  },
  blockquoteText: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 20,
  },

  // Code block
  codeBlock: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    padding: 12,
    marginVertical: 4,
  },
  codeLang: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "lowercase",
  },
  codeText: {
    color: "#ffffff",
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 19,
  },

  // Lists
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingLeft: 8,
  },
  bullet: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 21,
    width: 10,
    fontWeight: "800",
  },
  numberedBullet: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 21,
    width: 18,
  },
  listText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 13.5,
    lineHeight: 21,
  },
});

export default MarkdownText;
