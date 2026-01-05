import React, { useState } from 'react';
import LatexRenderer from '../components/LatexRenderer';
import './LatexPreviewTool.css';

const LatexPreviewTool: React.FC = () => {
  const [latexInput, setLatexInput] = useState(`Here's an inline equation: $E = mc^2$ and another one \\(a^2 + b^2 = c^2\\).

And here's a block equation:
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

You can also use display math:
\\[\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\\]`);

  const exampleLatex = [
    {
      name: 'Basic Math',
      content: 'The quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$'
    },
    {
      name: 'Integrals',
      content: '$$\\int_{0}^{\\infty} e^{-x} dx = 1$$'
    },
    {
      name: 'Matrices',
      content: '$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$'
    },
    {
      name: 'Greek Letters',
      content: 'Some Greek letters: $\\alpha, \\beta, \\gamma, \\Delta, \\Omega$'
    },
    {
      name: 'Complex Equation',
      content: '$$\\frac{\\partial f}{\\partial x} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$'
    }
  ];

  const loadExample = (content: string) => {
    setLatexInput(content);
  };

  return (
    <div className="latex-preview-tool">
      <div className="tool-header">
        <h1>LaTeX Preview Tool</h1>
        <p>Enter LaTeX code below to see how it renders. Supports inline math ($...$ or \\(...\\)) and block math ($$...$$ or \\[...\\])</p>
      </div>

      <div className="tool-container">
        <div className="input-section">
          <div className="section-header">
            <h2>Input</h2>
            <button 
              className="clear-btn"
              onClick={() => setLatexInput('')}
            >
              Clear
            </button>
          </div>
          <textarea
            className="latex-input"
            value={latexInput}
            onChange={(e) => setLatexInput(e.target.value)}
            placeholder="Enter LaTeX code here...&#10;&#10;Examples:&#10;Inline: $E = mc^2$ or \(a + b = c\)&#10;Block: $$\\int_0^1 x dx$$ or \[\\sum_{i=1}^n i\]"
            spellCheck={false}
          />
          
          <div className="examples-section">
            <h3>Quick Examples</h3>
            <div className="example-buttons">
              {exampleLatex.map((example, idx) => (
                <button
                  key={idx}
                  className="example-btn"
                  onClick={() => loadExample(example.content)}
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="output-section">
          <div className="section-header">
            <h2>Rendered Output</h2>
          </div>
          <div className="latex-output">
            {latexInput ? (
              <LatexRenderer content={latexInput} />
            ) : (
              <div className="empty-state">
                <p>Enter LaTeX code in the input field to see the rendered output</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatexPreviewTool;

