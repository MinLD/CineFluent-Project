export function tokenizeText(text: string) {
  // Split by spaces but keep punctuation separate
  // Regex:
  // \s+ : matches spaces (separator)
  // | : OR
  // (?=[.,!?;:"()]+)|(?<=[.,!?;:"()]+) : lookahead/lookbehind to split around punctuation

  // A simpler approach for "Clickable words" vs "Punctuation":
  // We want to wrap "words" in spans, and leave punctuation/spaces as is or in separate spans.

  // Strategy: Split by a regex that captures delimiters.
  // The regex `(/([.,!?;:"()]+|\s+)/)` will split and keep the delimiters.

  const tokens = text.split(/([.,!?;:"()]+|\s+)/).filter((t) => t.length > 0);

  return tokens.map((token, index) => {
    // Check if it's a word (alphanumeric) or punctuation/space
    const isWord = /^[a-zA-Z0-9']/.test(token);
    return {
      text: token,
      isWord,
      id: index,
    };
  });
}
