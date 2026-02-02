interface OpenTag {
  tag: string;
  fullOpeningTag: string;
}

export function splitMessage(html: string, maxLength = 4000): string[] {
  if (html.length <= maxLength) {
    return [html];
  }

  const result: string[] = [];
  let remaining = html;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      result.push(remaining);
      break;
    }

    const { splitPos, tagStack } = findBestSplitPoint(remaining, maxLength);

    let firstPart = remaining.slice(0, splitPos);
    let secondPart = remaining.slice(splitPos);

    if (tagStack.length > 0) {
      const closingTags = tagStack.map(t => `</${t.tag}>`).reverse().join('');
      firstPart += closingTags;

      const openingTags = tagStack.map(t => t.fullOpeningTag).join('');
      secondPart = openingTags + secondPart;
    }

    result.push(firstPart);
    remaining = secondPart;
  }

  return result;
}

/**
 * 分割优先级（从高到低）：
 * 1. 段落边界 \n\n
 * 2. 换行符 \n
 * 3. 句号 `. ` 或 `。`
 * 4. 空格
 * 5. 强制在 maxLength 处分割
 */
function findBestSplitPoint(text: string, maxLength: number): {
  splitPos: number;
  tagStack: OpenTag[];
} {
  let splitPos = maxLength;

  const paragraphPos = text.lastIndexOf('\n\n', maxLength);
  if (paragraphPos > maxLength / 2) {
    splitPos = paragraphPos + 2;
  } else {
    const newlinePos = text.lastIndexOf('\n', maxLength);
    if (newlinePos > maxLength / 2) {
      splitPos = newlinePos + 1;
    } else {
      const periodPos1 = text.lastIndexOf('. ', maxLength);
      const periodPos2 = text.lastIndexOf('。', maxLength);
      const periodPos = Math.max(periodPos1, periodPos2);
      if (periodPos > maxLength / 2) {
        splitPos = periodPos + (text[periodPos] === '.' ? 2 : 1);
      } else {
        const spacePos = text.lastIndexOf(' ', maxLength);
        if (spacePos > maxLength / 2) {
          splitPos = spacePos + 1;
        } else {
          splitPos = maxLength;
        }
      }
    }
  }

  const tagStack = getTagStackAtPosition(text, splitPos);
  return { splitPos, tagStack };
}

function getTagStackAtPosition(text: string, position: number): OpenTag[] {
  const stack: OpenTag[] = [];
  const textUpToPos = text.slice(0, position);
  const supportedTags = ['b', 'i', 's', 'code', 'pre', 'a'];
  const tagRegex = /<\/?([a-z]+)(?:\s+[^>]*)?>/gi;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(textUpToPos)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    if (!supportedTags.includes(tagName)) {
      continue;
    }

    if (fullTag.startsWith('</')) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tagName) {
          stack.splice(i, 1);
          break;
        }
      }
    } else {
      stack.push({
        tag: tagName,
        fullOpeningTag: fullTag,
      });
    }
  }

  return stack;
}
