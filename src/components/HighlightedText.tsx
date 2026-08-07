import { Text, type StyleProp, type TextStyle } from "react-native";

// Fold one character to lowercase without diacritics, preserving length so the
// highlight range maps back onto the original string 1:1. A char that folds
// away (a lone combining mark) becomes a sentinel that never matches.
function foldChar(c: string): string {
  const folded = c.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return folded.length > 0 ? folded[0] : "￿";
}

function fold(value: string): string {
  return Array.from(value).map(foldChar).join("");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Renders `text`, bolding the first case/diacritic-insensitive occurrence of
 * `query` at a word boundary (start of string or after a non-letter) — the same
 * rule the backend matches on (BOOK-68).
 */
export function HighlightedText({
  text,
  query,
  style,
  highlightStyle,
  numberOfLines,
}: {
  text: string;
  query: string;
  style?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const q = query.trim();
  const foldedQuery = fold(q);

  let start = -1;
  if (foldedQuery.length > 0) {
    const re = new RegExp(`(^|[^\\p{L}])${escapeRegExp(foldedQuery)}`, "u");
    const m = re.exec(fold(text));
    if (m) start = m.index + m[1].length;
  }

  if (start < 0) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const chars = Array.from(text);
  const before = chars.slice(0, start).join("");
  const match = chars.slice(start, start + foldedQuery.length).join("");
  const after = chars.slice(start + foldedQuery.length).join("");

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {before}
      <Text style={[{ fontWeight: "700" }, highlightStyle]}>{match}</Text>
      {after}
    </Text>
  );
}
