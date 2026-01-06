import React, { useState } from 'react';
import LatexRenderer from '../components/LatexRenderer';
import './LatexPreviewTool.css';

interface LatexCell {
  id: string;
  content: string;
}

const LatexPreviewTool: React.FC = () => {
  const [cells, setCells] = useState<LatexCell[]>([
    {
      id: '1',
      content: `Here's an inline equation: $E = mc^2$ and another one \\(a^2 + b^2 = c^2\\).

And here's a block equation:
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

You can also use display math:
\\[\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\\]`
    }
  ]);

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

  const addCell = () => {
    const newCell: LatexCell = {
      id: Date.now().toString(),
      content: ''
    };
    setCells([...cells, newCell]);
  };

  const removeCell = (id: string) => {
    setCells(cells.filter(cell => cell.id !== id));
  };

  const updateCell = (id: string, content: string) => {
    setCells(cells.map(cell => 
      cell.id === id ? { ...cell, content } : cell
    ));
  };

  const loadExample = (content: string) => {
    const newCell: LatexCell = {
      id: Date.now().toString(),
      content
    };
    setCells([...cells, newCell]);
  };

  return (
    <div className="latex-preview-tool">
      <div className="tool-header">
        <h1>LaTeX Preview Tool</h1>
        <p>Enter LaTeX code below to see how it renders. Supports inline math ($...$ or \\(...\\)) and block math ($$...$$ or \\[...\\])</p>
        <div className="header-actions">
          <button className="add-cell-btn" onClick={addCell}>
            + Add New Cell
          </button>
        </div>
      </div>

      <div className="examples-section-global">
        <h3>Quick Examples (Adds new cell)</h3>
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

      <div className="cells-container">
        {cells.map((cell, index) => (
          <div key={cell.id} className="latex-cell">
            <div className="cell-header">
              <h3>Cell {index + 1}</h3>
              <button 
                className="remove-cell-btn"
                onClick={() => removeCell(cell.id)}
                title="Remove this cell"
              >
                ×
              </button>
            </div>
            <div className="cell-content">
              <div className="cell-input-section">
                <textarea
                  className="latex-input"
                  value={cell.content}
                  onChange={(e) => updateCell(cell.id, e.target.value)}
                  placeholder="Enter LaTeX code here...&#10;&#10;Examples:&#10;Inline: $E = mc^2$ or \(a + b = c\)&#10;Block: $$\\int_0^1 x dx$$ or \[\\sum_{i=1}^n i\]"
                  spellCheck={false}
                />
              </div>
              <div className="cell-output-section">
                <div className="latex-output">
                  {cell.content ? (
                    <LatexRenderer content={cell.content} />
                  ) : (
                    <div className="empty-state">
                      <p>Enter LaTeX code to see the rendered output</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cells.length === 0 && (
        <div className="no-cells-message">
          <p>No cells yet. Click "Add New Cell" to get started!</p>
        </div>
      )}
    </div>
  );
};

export default LatexPreviewTool;

