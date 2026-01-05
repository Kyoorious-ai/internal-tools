import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
}

/**
 * LatexRenderer component that parses and renders LaTeX expressions
 * Supports:
 * - Inline math: $...$ or \(...\)
 * - Block math: $$...$$ or \[...\]
 */
const LatexRenderer: React.FC<LatexRendererProps> = ({ content }) => {
  if (!content) return null;

  // Regular expressions for LaTeX delimiters
  const blockPattern = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g;

  // First, find all block math expressions
  const blockMatches: Array<{ start: number; end: number; content: string }> = [];
  let match;
  
  // Reset regex
  blockPattern.lastIndex = 0;
  while ((match = blockPattern.exec(content)) !== null) {
    const mathContent = match[1] || match[2]; // $$...$$ or \[...\]
    if (mathContent) {
      blockMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: mathContent.trim()
      });
    }
  }

  // Reconstruct with block math placeholders
  const partsWithBlocks: Array<{ type: 'text' | 'block'; content: string; originalIndex?: number }> = [];
  let textStart = 0;

  blockMatches
    .sort((a, b) => a.start - b.start)
    .forEach((block, idx) => {
      if (block.start > textStart) {
        partsWithBlocks.push({
          type: 'text',
          content: content.substring(textStart, block.start)
        });
      }
      partsWithBlocks.push({
        type: 'block',
        content: block.content,
        originalIndex: idx
      });
      textStart = block.end;
    });

  if (textStart < content.length) {
    partsWithBlocks.push({
      type: 'text',
      content: content.substring(textStart)
    });
  }

  // Render each part
  return (
    <div className="latex-renderer">
      {partsWithBlocks.map((part, idx) => {
        if (part.type === 'block') {
          return (
            <BlockMath key={`block-${idx}`} math={part.content} />
          );
        }

        // Process inline math in text parts
        const textParts: Array<React.ReactNode> = [];
        const textContent = part.content;
        const inlineMatches: Array<{ start: number; end: number; content: string }> = [];

        // Find inline math: $...$ (but not $$...$$)
        // Use a pattern that avoids lookbehind for better compatibility
        const inlinePattern2 = /\$(?!\$)([^$\n]+?)\$(?!\$)/g;
        let inlineMatch;
        while ((inlineMatch = inlinePattern2.exec(textContent)) !== null) {
          // Check that it's not part of a block math ($$...$$)
          const beforeChar = inlineMatch.index > 0 ? textContent[inlineMatch.index - 1] : '';
          if (beforeChar !== '$') {
            inlineMatches.push({
              start: inlineMatch.index,
              end: inlineMatch.index + inlineMatch[0].length,
              content: inlineMatch[1].trim()
            });
          }
        }

        // Also find \(...\)
        const parenPattern = /\\\(([\s\S]*?)\\\)/g;
        while ((inlineMatch = parenPattern.exec(textContent)) !== null) {
          inlineMatches.push({
            start: inlineMatch.index,
            end: inlineMatch.index + inlineMatch[0].length,
            content: inlineMatch[1].trim()
          });
        }

        // Sort and merge inline matches
        inlineMatches.sort((a, b) => a.start - b.start);

        let lastTextPos = 0;
        inlineMatches.forEach((inline, inlineIdx) => {
          // Add text before inline math
          if (inline.start > lastTextPos) {
            textParts.push(
              <span key={`text-${idx}-${inlineIdx}`}>
                {textContent.substring(lastTextPos, inline.start)}
              </span>
            );
          }
          // Add inline math
          textParts.push(
            <InlineMath key={`inline-${idx}-${inlineIdx}`} math={inline.content} />
          );
          lastTextPos = inline.end;
        });

        // Add remaining text
        if (lastTextPos < textContent.length) {
          textParts.push(
            <span key={`text-${idx}-end`}>
              {textContent.substring(lastTextPos)}
            </span>
          );
        }

        // If no inline math found, return text as is
        if (textParts.length === 0) {
          return <span key={`text-${idx}`}>{textContent}</span>;
        }

        return <span key={`text-part-${idx}`}>{textParts}</span>;
      })}
    </div>
  );
};

export default LatexRenderer;

