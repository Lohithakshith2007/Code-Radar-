function renderInline(text) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g);
  return tokens.filter(Boolean).map((token, index) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={index}>{token.slice(1, -1)}</code>;
    }
    if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }
    if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      return <em key={index}>{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

const isBlockStart = (line) => /^(#{1,3}\s|```|>\s?|[-*+]\s+|\d+[.)]\s+)/.test(line);

export default function FormattedResponse({ text = '' }) {
  const lines = String(text).replace(/\r/g, '').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    const fence = line.match(/^```\s*([\w+-]*)/);
    if (fence) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) codeLines.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push(<pre key={`code-${index}`}><code className={fence[1] ? `language-${fence[1]}` : undefined}>{codeLines.join('\n')}</code></pre>);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Tag = `h${heading[1].length}`;
      blocks.push(<Tag key={`heading-${index}`}>{renderInline(heading[2])}</Tag>);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quoteLines.push(lines[index++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={`quote-${index}`}>{quoteLines.map((part, partIndex) => <p key={partIndex}>{renderInline(part)}</p>)}</blockquote>);
      continue;
    }

    const listMatch = line.match(/^\s*([-*+]\s+|\d+[.)]\s+)/);
    if (listMatch) {
      const ordered = /^\d/.test(listMatch[1]);
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*([-*+]\s+|\d+[.)]\s+)(.+)$/);
        if (!item || /^\d/.test(item[1]) !== ordered) break;
        items.push(<li key={index}>{renderInline(item[2])}</li>);
        index += 1;
      }
      const List = ordered ? 'ol' : 'ul';
      blocks.push(<List key={`list-${index}`}>{items}</List>);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) paragraph.push(lines[index++]);
    blocks.push(<p key={`paragraph-${index}`}>{paragraph.map((part, partIndex) => <span key={partIndex}>{partIndex > 0 && <br />}{renderInline(part)}</span>)}</p>);
  }

  return <div className="formatted-response">{blocks}</div>;
}
