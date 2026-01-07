import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import LatexRenderer from '../components/LatexRenderer';
import './ExcelQuestionViewer.css';

interface Question {
  id: number;
  [key: string]: string | number;
}

interface AIState {
  prompt: string;
  isLoading: boolean;
  error: string | null;
}

const ExcelQuestionViewer: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [questionTextColumn, setQuestionTextColumn] = useState<string>('');
  const [aiStates, setAIStates] = useState<Record<number, AIState>>({});

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet);
      
      if (jsonData.length > 0) {
        const cols = Object.keys(jsonData[0]);
        setColumns(cols);
        
        // Auto-detect question text column with better heuristics
        const findBestQuestionColumn = () => {
          // Normalize column name for comparison (remove colons, extra spaces, lowercase)
          const normalize = (col: string) => col.toLowerCase().replace(/[:\s]+/g, ' ').trim();
          
          // Priority 1: Column containing both "question" and "text" (like "Question Text", "Question Text :")
          const questionTextCol = cols.find(col => {
            const norm = normalize(col);
            return norm.includes('question') && norm.includes('text');
          });
          if (questionTextCol) return questionTextCol;
          
          // Priority 2: Column with "text" but NOT "number", "id", "no", "type"
          const textCol = cols.find(col => {
            const norm = normalize(col);
            return norm.includes('text') && 
                   !norm.includes('number') && 
                   !norm.includes('id') && 
                   !norm.includes(' no') &&
                   !norm.includes('type');
          });
          if (textCol) return textCol;
          
          // Priority 3: Column with "content", "description", or "body"
          const contentCol = cols.find(col => {
            const norm = normalize(col);
            return norm.includes('content') || norm.includes('description') || norm.includes('body');
          });
          if (contentCol) return contentCol;
          
          // Priority 4: Find column with longest average string content (likely the text column)
          // Also check if content contains LaTeX markers ($, \, etc.)
          const colWithLongestContent = cols.reduce((best, col) => {
            const stats = jsonData.reduce((acc, row) => {
              const val = row[col];
              if (typeof val === 'string') {
                acc.totalLength += val.length;
                if (val.includes('$') || val.includes('\\')) {
                  acc.hasLatex = true;
                }
              }
              return acc;
            }, { totalLength: 0, hasLatex: false });
            
            const avgLength = stats.totalLength / jsonData.length;
            
            // Prioritize columns with LaTeX content
            const score = avgLength + (stats.hasLatex ? 1000 : 0);
            
            if (score > (best.score || 0)) {
              return { col, score };
            }
            return best;
          }, { col: cols[0], score: 0 });
          
          return colWithLongestContent.col;
        };
        
        setQuestionTextColumn(findBestQuestionColumn());
        
        const questionsWithId = jsonData.map((row, index) => ({
          id: index + 1,
          ...row
        }));
        setQuestions(questionsWithId);
        setFileName(file.name);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      processExcelFile(file);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetFile = () => {
    setQuestions([]);
    setColumns([]);
    setFileName('');
    setQuestionTextColumn('');
  };

  // Update question text when edited
  const updateQuestionText = (questionId: number, newText: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === questionId 
          ? { ...q, [questionTextColumn]: newText }
          : q
      )
    );
  };

  // Get AI state for a question
  const getAIState = (questionId: number): AIState => {
    return aiStates[questionId] || { prompt: '', isLoading: false, error: null };
  };

  // Update AI prompt for a question
  const updateAIPrompt = (questionId: number, prompt: string) => {
    setAIStates(prev => ({
      ...prev,
      [questionId]: { ...getAIState(questionId), prompt, error: null }
    }));
  };

  // Call AI API to modify LaTeX
  const handleAIModify = async (questionId: number, currentLatex: string) => {
    const state = getAIState(questionId);
    if (!state.prompt.trim() || state.isLoading) return;

    // Set loading state
    setAIStates(prev => ({
      ...prev,
      [questionId]: { ...state, isLoading: true, error: null }
    }));

    try {
      const response = await fetch('http://localhost:3000/api/latex/modify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latexCode: currentLatex,
          modification: state.prompt
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Update the question text with the modified LaTeX
      if (data.modifiedCode) {
        updateQuestionText(questionId, data.modifiedCode);
      }

      // Clear prompt and loading state on success
      setAIStates(prev => ({
        ...prev,
        [questionId]: { prompt: '', isLoading: false, error: null }
      }));
    } catch (error) {
      // Set error state
      setAIStates(prev => ({
        ...prev,
        [questionId]: { 
          ...state, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to modify LaTeX'
        }
      }));
    }
  };

  // Render upload screen
  if (questions.length === 0) {
    return (
      <div className="excel-viewer">
        <div className="upload-container">
          <div className="upload-header">
            <h1>Question LaTeX Viewer</h1>
            <p>Upload an Excel file to view questions with LaTeX rendering</p>
          </div>
          
          <div 
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="drop-zone-content">
              <div className="upload-icon">📄</div>
              <h2>Drop your Excel file here</h2>
              <p>or</p>
              <label className="file-input-label">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="file-input"
                />
                Browse Files
              </label>
              <p className="file-types">Supports .xlsx, .xls, .csv</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render questions view
  return (
    <div className="excel-viewer">
      <div className="viewer-header">
        <div className="header-left">
          <h1>Question LaTeX Viewer</h1>
          <span className="file-badge">{fileName}</span>
          <span className="count-badge">{questions.length} questions</span>
        </div>
        <div className="header-right">
          <div className="column-selector">
            <label>Question Text Column:</label>
            <select 
              value={questionTextColumn} 
              onChange={(e) => setQuestionTextColumn(e.target.value)}
            >
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <button className="reset-btn" onClick={resetFile}>
            Upload New File
          </button>
        </div>
      </div>

      <div className="questions-container">
        {questions.map((question, index) => {
          const questionText = String(question[questionTextColumn] || '');
          const otherFields = Object.entries(question).filter(
            ([key]) => key !== 'id' && key !== questionTextColumn
          );
          const aiState = getAIState(question.id);

          return (
            <div key={question.id} className="question-card">
              <div className="question-number">
                <span>Q{index + 1}</span>
              </div>
              
              <div className="question-content">
                {/* Other fields as metadata */}
                {otherFields.length > 0 && (
                  <div className="question-meta">
                    {otherFields.map(([key, value]) => (
                      <div key={key} className="meta-item">
                        <span className="meta-key">{key}:</span>
                        <span className="meta-value">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Assistant */}
                <div className="ai-assistant">
                  <div className="ai-header">
                    <span className="ai-icon">🤖</span>
                    <h3>AI Assistant</h3>
                    <span className="ai-badge">Modify with AI</span>
                  </div>
                  <div className="ai-input-container">
                    <input
                      type="text"
                      className="ai-prompt-input"
                      value={aiState.prompt}
                      onChange={(e) => updateAIPrompt(question.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAIModify(question.id, questionText);
                        }
                      }}
                      placeholder="Describe how to modify the LaTeX... (e.g., 'Add fractions', 'Convert to matrix form')"
                      disabled={aiState.isLoading}
                    />
                    <button
                      className={`ai-submit-btn ${aiState.isLoading ? 'loading' : ''}`}
                      onClick={() => handleAIModify(question.id, questionText)}
                      disabled={aiState.isLoading || !aiState.prompt.trim()}
                    >
                      {aiState.isLoading ? (
                        <>
                          <span className="spinner"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">✨</span>
                          Apply
                        </>
                      )}
                    </button>
                  </div>
                  {aiState.error && (
                    <div className="ai-error">
                      <span className="error-icon">⚠️</span>
                      {aiState.error}
                    </div>
                  )}
                </div>

                <div className="latex-comparison">
                  <div className="latex-panel raw-panel">
                    <div className="panel-header">
                      <span className="panel-icon">📝</span>
                      <h3>Raw LaTeX Code</h3>
                      <span className="editable-badge">Editable</span>
                    </div>
                    <div className="panel-content">
                      <textarea
                        className="raw-code-editor"
                        value={questionText}
                        onChange={(e) => updateQuestionText(question.id, e.target.value)}
                        placeholder="Enter LaTeX code here..."
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  <div className="latex-panel rendered-panel">
                    <div className="panel-header">
                      <span className="panel-icon">✨</span>
                      <h3>Rendered Output</h3>
                      <span className="live-badge">Live Preview</span>
                    </div>
                    <div className="panel-content">
                      {questionText ? (
                        <LatexRenderer content={questionText} />
                      ) : (
                        <div className="empty-content">No content to render</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExcelQuestionViewer;

