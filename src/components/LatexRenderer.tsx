import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
}

// Error boundary wrapper for KaTeX components
const SafeInlineMath: React.FC<{ math: string }> = ({ math }) => {
  try {
    return <InlineMath math={math} />;
  } catch {
    return <span className="latex-error" title="LaTeX error">${math}$</span>;
  }
};

const SafeBlockMath: React.FC<{ math: string }> = ({ math }) => {
  try {
    return <BlockMath math={math} />;
  } catch {
    return <div className="latex-error" title="LaTeX error">$${math}$$</div>;
  }
};

/**
 * Convert LaTeX document commands to HTML
 */
const convertLatexToHtml = (text: string): string => {
  let result = text;
  
  // Convert \begin{enumerate} ... \end{enumerate} to a marker
  result = result.replace(/\\begin\{enumerate\}/g, '___ENUM_START___');
  result = result.replace(/\\end\{enumerate\}/g, '___ENUM_END___');
  
  // Convert \begin{itemize} ... \end{itemize}
  result = result.replace(/\\begin\{itemize\}/g, '___LIST_START___');
  result = result.replace(/\\end\{itemize\}/g, '___LIST_END___');
  
  // Convert \item[(X)] to marked items
  result = result.replace(/\\item\[([^\]]*)\]/g, '___ITEM_LABEL_$1___');
  result = result.replace(/\\item/g, '___ITEM___');
  
  // Convert line breaks
  result = result.replace(/\\\\/g, '___NEWLINE___');
  result = result.replace(/\\newline/g, '___NEWLINE___');
  
  // Convert common text formatting
  result = result.replace(/\\textbf\{([^}]*)\}/g, '___BOLD_START___$1___BOLD_END___');
  result = result.replace(/\\textit\{([^}]*)\}/g, '___ITALIC_START___$1___ITALIC_END___');
  result = result.replace(/\\underline\{([^}]*)\}/g, '___UNDERLINE_START___$1___UNDERLINE_END___');
  
  // Convert \text{} inside math to just the text (will be handled later)
  result = result.replace(/\\text\{([^}]*)\}/g, '$1');
  
  // Convert \quad and \qquad to spaces
  result = result.replace(/\\qquad/g, '    ');
  result = result.replace(/\\quad/g, '  ');
  
  // Convert \, \; \: to thin spaces
  result = result.replace(/\\[,;:]/g, ' ');
  
  return result;
};

/**
 * Parse and render content with mixed LaTeX document commands and math
 */
const LatexRenderer: React.FC<LatexRendererProps> = ({ content }) => {
  if (!content) return null;

  // First, convert LaTeX document commands to markers
  const processedContent = convertLatexToHtml(content);
  
  // Split into segments based on our markers and math delimiters
  const renderContent = (text: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let currentText = text;
    let key = 0;
    
    // Process enumerate blocks
    const enumParts = currentText.split(/(___ENUM_START___|___ENUM_END___|___LIST_START___|___LIST_END___)/);
    
    let inList = false;
    let listItems: React.ReactNode[] = [];
    
    enumParts.forEach((part, partIdx) => {
      if (part === '___ENUM_START___' || part === '___LIST_START___') {
        inList = true;
        listItems = [];
        return;
      }
      
      if (part === '___ENUM_END___' || part === '___LIST_END___') {
        if (listItems.length > 0) {
          result.push(
            <div key={`list-${key++}`} className="latex-list">
              {listItems}
            </div>
          );
        }
        inList = false;
        return;
      }
      
      if (inList) {
        // Parse items within the list
        const itemParts = part.split(/(___ITEM_LABEL_[^_]*___|___ITEM___)/);
        itemParts.forEach((itemPart, itemIdx) => {
          if (itemPart.startsWith('___ITEM_LABEL_')) {
            const label = itemPart.replace('___ITEM_LABEL_', '').replace('___', '');
            // The content will be in the next part
            return;
          }
          if (itemPart === '___ITEM___') {
            return;
          }
          
          // Check if there was a label before this
          const prevPart = itemParts[itemIdx - 1] || '';
          let label = '';
          if (prevPart.startsWith('___ITEM_LABEL_')) {
            label = prevPart.replace('___ITEM_LABEL_', '').replace('___', '');
          } else if (prevPart === '___ITEM___') {
            label = '•';
          }
          
          const trimmedContent = itemPart.trim();
          if (trimmedContent && (label || itemIdx === 0)) {
            listItems.push(
              <div key={`item-${key++}`} className="latex-list-item">
                {label && <span className="latex-item-label">({label})</span>}
                <span className="latex-item-content">{renderInlineContent(trimmedContent)}</span>
              </div>
            );
          }
        });
      } else {
        // Regular text, not in a list
        const trimmed = part.trim();
        if (trimmed) {
          result.push(<span key={`text-${key++}`}>{renderInlineContent(trimmed)}</span>);
        }
      }
    });
    
    return result;
  };
  
  // Render inline content (text with possible math)
  const renderInlineContent = (text: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let key = 0;
    
    // Handle newlines
    let processedText = text.replace(/___NEWLINE___/g, '\n');
    
    // Handle text formatting
    processedText = processedText
      .replace(/___BOLD_START___/g, '<b>')
      .replace(/___BOLD_END___/g, '</b>')
      .replace(/___ITALIC_START___/g, '<i>')
      .replace(/___ITALIC_END___/g, '</i>')
      .replace(/___UNDERLINE_START___/g, '<u>')
      .replace(/___UNDERLINE_END___/g, '</u>');
    
    // Find all math expressions
    const mathPattern = /\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = mathPattern.exec(processedText)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        const textBefore = processedText.substring(lastIndex, match.index);
        result.push(...renderPlainText(textBefore, key));
        key += 10;
      }
      
      // Determine if block or inline math
      const blockMath = match[1] || match[3]; // $$...$$ or \[...\]
      const inlineMath = match[2] || match[4]; // $...$ or \(...\)
      
      if (blockMath) {
        result.push(
          <div key={`block-${key++}`} className="latex-block-math">
            <SafeBlockMath math={blockMath.trim()} />
          </div>
        );
      } else if (inlineMath) {
        result.push(
          <SafeInlineMath key={`inline-${key++}`} math={inlineMath.trim()} />
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < processedText.length) {
      result.push(...renderPlainText(processedText.substring(lastIndex), key));
    }
    
    return result;
  };
  
  // Render plain text with line breaks and formatting
  const renderPlainText = (text: string, startKey: number): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let key = startKey;
    
    // Split by newlines
    const lines = text.split('\n');
    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        result.push(<br key={`br-${key++}`} />);
      }
      
      // Handle HTML-like formatting markers
      if (line.includes('<b>') || line.includes('<i>') || line.includes('<u>')) {
        // Parse simple HTML-like tags
        const parts = line.split(/(<\/?[biu]>)/);
        let bold = false;
        let italic = false;
        let underline = false;
        
        parts.forEach((part, partIdx) => {
          if (part === '<b>') { bold = true; return; }
          if (part === '</b>') { bold = false; return; }
          if (part === '<i>') { italic = true; return; }
          if (part === '</i>') { italic = false; return; }
          if (part === '<u>') { underline = true; return; }
          if (part === '</u>') { underline = false; return; }
          
          if (part) {
            const style: React.CSSProperties = {};
            if (bold) style.fontWeight = 'bold';
            if (italic) style.fontStyle = 'italic';
            if (underline) style.textDecoration = 'underline';
            
            result.push(
              <span key={`fmt-${key++}`} style={Object.keys(style).length > 0 ? style : undefined}>
                {part}
              </span>
            );
          }
        });
      } else {
        if (line) {
          result.push(<span key={`line-${key++}`}>{line}</span>);
        }
      }
    });
    
    return result;
  };

  return (
    <div className="latex-renderer">
      {renderContent(processedContent)}
    </div>
  );
};

export default LatexRenderer;
