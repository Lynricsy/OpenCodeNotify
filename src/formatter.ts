/**
 * Telegram 仅支持以下 HTML 标签:
 * <b>, <i>, <u>, <s>, <code>, <pre>, <pre><code class="language-xxx">, <a href="">
 */

export function formatForTelegram(markdown: string): string {
  if (!markdown) {
    return '';
  }

  let result = markdown;

  // 处理流程：先保护代码块（避免被后续规则影响）→ 转义 HTML → 应用 Markdown 规则 → 恢复代码块
  const codeBlocks: string[] = [];
  const CODE_BLOCK_PLACEHOLDER = '\x00CODEBLOCK';
  
  // ```lang\ncode\n``` → <pre><code class="language-lang">code</code></pre>
  result = result.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const placeholder = `${CODE_BLOCK_PLACEHOLDER}${codeBlocks.length}\x00`;
    const escapedCode = escapeHtml(code.trim());
    if (lang) {
      codeBlocks.push(`<pre><code class="language-${lang}">${escapedCode}</code></pre>`);
    } else {
      codeBlocks.push(`<pre><code>${escapedCode}</code></pre>`);
    }
    return placeholder;
  });

  // `code` → <code>code</code>
  const inlineCodes: string[] = [];
  const INLINE_CODE_PLACEHOLDER = '\x00INLINECODE';
  
  result = result.replace(/`([^`]+)`/g, (_match, code) => {
    const placeholder = `${INLINE_CODE_PLACEHOLDER}${inlineCodes.length}\x00`;
    const escapedCode = escapeHtml(code);
    inlineCodes.push(`<code>${escapedCode}</code>`);
    return placeholder;
  });

  result = escapeHtml(result);

  // [text](url) → <a href="url">text</a>
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // **text** / __text__ → <b>text</b>
  result = result.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  result = result.replace(/__(.+?)__/g, '<b>$1</b>');

  // *text* / _text_ → <i>text</i> (避免匹配粗体标记)
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
  result = result.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<i>$1</i>');

  // ~~text~~ → <s>text</s>
  result = result.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // # heading → <b>heading</b>
  result = result.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');

  // - item / * item → • item
  result = result.replace(/^[\-\*]\s+(.+)$/gm, '• $1');

  result = result.replace(new RegExp(`${CODE_BLOCK_PLACEHOLDER}(\\d+)\x00`, 'g'), (_match, index) => {
    return codeBlocks[parseInt(index, 10)];
  });

  result = result.replace(new RegExp(`${INLINE_CODE_PLACEHOLDER}(\\d+)\x00`, 'g'), (_match, index) => {
    return inlineCodes[parseInt(index, 10)];
  });

  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
