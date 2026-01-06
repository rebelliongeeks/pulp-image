export const getBanner = (version) => {
  const title = `🍊 pulp-image v${version}`;
  const subtitle = `Image processing made simple`;
  
  // Calculate width: use the longest line + padding
  const contentWidth = Math.max(title.length, subtitle.length);
  const padding = 4; // 2 spaces on each side
  const width = contentWidth + padding;
  
  // Generate borders
  const topBorder = `╔${'═'.repeat(width)}╗`;
  const bottomBorder = `╚${'═'.repeat(width)}╝`;
  const emptyLine = `║${' '.repeat(width)}║`;
  
  // Center the text lines
  const centerText = (text, totalWidth) => {
    const spaces = totalWidth - text.length;
    const leftPad = Math.floor(spaces / 2);
    const rightPad = spaces - leftPad;
    return `║${' '.repeat(leftPad)}${text}${' '.repeat(rightPad)}║`;
  };
  
  return `
${topBorder}
${emptyLine}
${centerText(title, width)}
${emptyLine}
${centerText(subtitle, width)}
${emptyLine}
${bottomBorder}
`;
};

