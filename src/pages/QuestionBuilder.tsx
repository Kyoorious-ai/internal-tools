import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import LatexRenderer from '../components/LatexRenderer';
import './QuestionBuilder.css';

interface Question {
  id: number;
  text: string;
  [key: string]: string | number;
}

interface AIState {
  prompt: string;
  isLoading: boolean;
  error: string | null;
}

interface HistoryEntry {
  previousText: string;
  modificationPrompt: string;
}

const QuestionBuilder: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([
    { 
      id: 1, 
      text: '', 
      answer: '', 
      marks: '', 
      difficulty: 'Medium', 
      board_id: '', 
      class_id: '', 
      subject_id: '', 
      chapter_id: '', 
      medium_id: '', 
      expected_has_diagram: false, 
      diagram_url: '', 
      question_type: '' 
    }
  ]);
  const [nextId, setNextId] = useState(2);
  const [aiStates, setAIStates] = useState<Record<number, AIState>>({});
  const [history, setHistory] = useState<Record<number, HistoryEntry | null>>({});
  const [dragOverStates, setDragOverStates] = useState<Record<number, boolean>>({});

  // Add a new question
  const addQuestion = () => {
    const newQuestion: Question = {
      id: nextId,
      text: '',
      answer: '',
      marks: '',
      difficulty: 'Medium',
      board_id: '',
      class_id: '',
      subject_id: '',
      chapter_id: '',
      medium_id: '',
      expected_has_diagram: false,
      diagram_url: '',
      question_type: ''
    };
    setQuestions(prev => [...prev, newQuestion]);
    setNextId(prev => prev + 1);
  };

  // Delete a question
  const deleteQuestion = (questionId: number) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    // Clean up AI states and history
    setAIStates(prev => {
      const newStates = { ...prev };
      delete newStates[questionId];
      return newStates;
    });
    setHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[questionId];
      return newHistory;
    });
  };

  // Update any field in a question
  const updateQuestionField = (questionId: number, fieldName: string, newValue: string | number) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId
          ? { ...q, [fieldName]: newValue }
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
      // Get base URL from environment variable, fallback to localhost
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/latex/modify`, {
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

      // Check for success in response
      if (data.success && data.modifiedCode) {
        // Save current text to history before updating
        setHistory(prev => ({
          ...prev,
          [questionId]: {
            previousText: currentLatex,
            modificationPrompt: state.prompt
          }
        }));

        // Update the question text with the modified LaTeX
        updateQuestionField(questionId, 'text', data.modifiedCode);

        // Clear prompt and loading state on success
        setAIStates(prev => ({
          ...prev,
          [questionId]: { prompt: '', isLoading: false, error: null }
        }));
      } else {
        throw new Error(data.error || 'Failed to modify LaTeX');
      }
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

  // Undo AI modification - revert to previous text
  const handleUndo = (questionId: number) => {
    const historyEntry = history[questionId];
    if (historyEntry) {
      updateQuestionField(questionId, 'text', historyEntry.previousText);
      // Clear history after undo
      setHistory(prev => ({
        ...prev,
        [questionId]: null
      }));
    }
  };

  // Get history for a question
  const getHistory = (questionId: number): HistoryEntry | null => {
    return history[questionId] || null;
  };

  // Handle file upload for diagram
  const handleFileUpload = async (questionId: number, file: File) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Convert file to data URL (base64)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateQuestionField(questionId, 'diagram_url', dataUrl);
    };
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileInputChange = (questionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(questionId, file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  // Handle drag over
  const handleDragOver = (questionId: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStates(prev => ({ ...prev, [questionId]: true }));
  };

  // Handle drag leave
  const handleDragLeave = (questionId: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStates(prev => ({ ...prev, [questionId]: false }));
  };

  // Handle drop
  const handleDrop = (questionId: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStates(prev => ({ ...prev, [questionId]: false }));

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(questionId, file);
    }
  };

  // Export questions to Excel
  const exportToExcel = () => {
    if (questions.length === 0) return;

    // Prepare data for export (remove internal id field, add created_at)
    const now = new Date().toISOString();
    const exportData = questions.map(q => {
      const { id, ...rest } = q;
      return {
        text: rest.text || '',
        answer: rest.answer || '',
        marks: rest.marks || '',
        difficulty: rest.difficulty || 'Medium',
        board_id: rest.board_id || '',
        class_id: rest.class_id || '',
        subject_id: rest.subject_id || '',
        chapter_id: rest.chapter_id || '',
        medium_id: rest.medium_id || '',
        expected_has_diagram: rest.expected_has_diagram || false,
        diagram_url: rest.diagram_url || '',
        created_at: now,
        question_type: rest.question_type || ''
      };
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `questions_${timestamp}.xlsx`;

    // Trigger download
    XLSX.writeFile(workbook, fileName);
  };

  // Export questions to JSON
  const exportToJson = () => {
    if (questions.length === 0) return;

    // Prepare data for export (remove internal id field, add created_at)
    const now = new Date().toISOString();
    const exportData = questions.map(q => {
      const { id, ...rest } = q;
      return {
        text: rest.text || '',
        answer: rest.answer || '',
        marks: rest.marks || '',
        difficulty: rest.difficulty || 'Medium',
        board_id: rest.board_id || '',
        class_id: rest.class_id || '',
        subject_id: rest.subject_id || '',
        chapter_id: rest.chapter_id || '',
        medium_id: rest.medium_id || '',
        expected_has_diagram: rest.expected_has_diagram || false,
        diagram_url: rest.diagram_url || '',
        created_at: now,
        question_type: rest.question_type || ''
      };
    });

    // Create and download JSON file
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `questions_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Clear all questions
  const clearAllQuestions = () => {
    if (window.confirm('Are you sure you want to clear all questions? This action cannot be undone.')) {
      setQuestions([{
        id: 1,
        text: '',
        answer: '',
        marks: '',
        difficulty: 'Medium',
        board_id: '',
        class_id: '',
        subject_id: '',
        chapter_id: '',
        medium_id: '',
        expected_has_diagram: false,
        diagram_url: '',
        question_type: ''
      }]);
      setAIStates({});
      setHistory({});
      setNextId(2);
    }
  };

  return (
    <div className="question-builder">
      <div className="builder-header">
        <div className="header-left">
          <h1>Question Builder</h1>
          <span className="count-badge">{questions.length} questions</span>
        </div>
        <div className="header-right">
          <button className="add-btn" onClick={addQuestion}>
            <span className="add-icon">➕</span>
            Add Question
          </button>
          <div className="export-dropdown">
            <button className="export-btn">
              <span className="export-icon">📤</span>
              Export
            </button>
            <div className="dropdown-menu">
              <button onClick={exportToExcel}>
                <span className="file-icon">📊</span>
                Export to Excel
              </button>
              <button onClick={exportToJson}>
                <span className="file-icon">📄</span>
                Export to JSON
              </button>
            </div>
          </div>
          <button className="clear-btn" onClick={clearAllQuestions}>
            <span className="clear-icon">🗑️</span>
            Clear All
          </button>
        </div>
      </div>

      <div className="questions-container">
        {questions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h2>No questions yet</h2>
            <p>Click "Add Question" to start creating your question set</p>
            <button className="add-btn-large" onClick={addQuestion}>
              <span className="add-icon">➕</span>
              Add Your First Question
            </button>
          </div>
        ) : (
          questions.map((question, index) => {
            const questionText = String(question.text || '');
            const answerText = String(question.answer || '');
            const otherFields = Object.entries(question).filter(
              ([key]) => key !== 'id' && key !== 'text' && key !== 'answer'
            );
            const aiState = getAIState(question.id);
            const historyEntry = getHistory(question.id);

            return (
              <div key={question.id} className="question-card">
                <div className="question-header">
                  <div className="question-number-container">
                    <div className="question-number">
                      <span>Q{index + 1}</span>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => deleteQuestion(question.id)}
                      title="Delete question"
                    >
                      <span className="delete-icon">🗑️</span>
                    </button>
                  </div>
                </div>

                <div className="question-content">
                  {/* Metadata fields */}
                  <div className="question-meta">
                    {/* Marks */}
                    <div className="meta-item">
                      <label className="meta-label">Marks:</label>
                      <input
                        type="number"
                        className="meta-input"
                        value={String(question.marks || '')}
                        onChange={(e) => updateQuestionField(question.id, 'marks', e.target.value)}
                        placeholder="Enter marks..."
                        min="0"
                        step="0.5"
                      />
                    </div>

                    {/* Difficulty */}
                    <div className="meta-item">
                      <label className="meta-label">Difficulty:</label>
                      <select
                        className="meta-select"
                        value={String(question.difficulty || 'Medium')}
                        onChange={(e) => updateQuestionField(question.id, 'difficulty', e.target.value)}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    {/* Question Type */}
                    <div className="meta-item">
                      <label className="meta-label">Question Type:</label>
                      <input
                        type="text"
                        className="meta-input"
                        value={String(question.question_type || '')}
                        onChange={(e) => updateQuestionField(question.id, 'question_type', e.target.value)}
                        placeholder="e.g., MCQ, Short Answer..."
                      />
                    </div>

                    {/* Board ID */}
                    <div className="meta-item">
                      <label className="meta-label">Board ID:</label>
                      <input
                        type="text"
                        className="meta-input"
                        value={String(question.board_id || '')}
                        onChange={(e) => updateQuestionField(question.id, 'board_id', e.target.value)}
                        placeholder="Enter board ID..."
                      />
                    </div>

                    {/* Class ID */}
                    <div className="meta-item">
                      <label className="meta-label">Class ID:</label>
                      <input
                        type="text"
                        className="meta-input"
                        value={String(question.class_id || '')}
                        onChange={(e) => updateQuestionField(question.id, 'class_id', e.target.value)}
                        placeholder="Enter class ID..."
                      />
                    </div>

                    {/* Subject ID */}
                    <div className="meta-item">
                      <label className="meta-label">Subject ID:</label>
                      <input
                        type="text"
                        className="meta-input"
                        value={String(question.subject_id || '')}
                        onChange={(e) => updateQuestionField(question.id, 'subject_id', e.target.value)}
                        placeholder="Enter subject ID..."
                      />
                    </div>

                    {/* Chapter ID */}
                    <div className="meta-item">
                      <label className="meta-label">Chapter ID:</label>
                      <input
                        type="text"
                        className="meta-input"
                        value={String(question.chapter_id || '')}
                        onChange={(e) => updateQuestionField(question.id, 'chapter_id', e.target.value)}
                        placeholder="Enter chapter ID..."
                      />
                    </div>

                    {/* Medium ID */}
                    <div className="meta-item">
                      <label className="meta-label">Medium ID:</label>
                      <input
                        type="text"
                        className="meta-input"
                        value={String(question.medium_id || '')}
                        onChange={(e) => updateQuestionField(question.id, 'medium_id', e.target.value)}
                        placeholder="Enter medium ID..."
                      />
                    </div>

                    {/* Question Contains Diagram */}
                    <div className="meta-item meta-item-checkbox">
                      <label className="meta-checkbox-label">
                        <input
                          type="checkbox"
                          className="meta-checkbox"
                          checked={Boolean(question.expected_has_diagram)}
                          onChange={(e) => updateQuestionField(question.id, 'expected_has_diagram', e.target.checked)}
                        />
                        <span>Question has Diagram</span>
                      </label>
                    </div>

                    {/* Diagram Upload - Only show when Question Contains Diagram is checked */}
                    {question.expected_has_diagram && (
                      <div className="meta-item meta-item-wide">
                        <label className="meta-label">Diagram:</label>
                        <div
                          className={`diagram-upload-area ${dragOverStates[question.id] ? 'drag-over' : ''}`}
                          onDragOver={(e) => handleDragOver(question.id, e)}
                          onDragLeave={(e) => handleDragLeave(question.id, e)}
                          onDrop={(e) => handleDrop(question.id, e)}
                        >
                          <input
                            type="file"
                            id={`diagram-input-${question.id}`}
                            className="diagram-file-input"
                            accept="image/*"
                            onChange={(e) => handleFileInputChange(question.id, e)}
                          />
                          <label htmlFor={`diagram-input-${question.id}`} className="diagram-upload-label">
                            {question.diagram_url ? (
                              <div className="diagram-preview-container">
                                <img src={question.diagram_url} alt="Diagram preview" className="diagram-preview" />
                                <div className="diagram-overlay">
                                  <span className="diagram-upload-text">Click to change image</span>
                                </div>
                              </div>
                            ) : (
                              <div className="diagram-upload-placeholder">
                                <span className="diagram-upload-icon">+</span>
                                <span className="diagram-upload-text">Drag and drop an image here or click to select</span>
                                <span className="diagram-upload-hint">Supports PNG, JPG, GIF, and other image formats</span>
                              </div>
                            )}
                          </label>
                        </div>
                        {question.diagram_url && (
                          <button
                            className="diagram-remove-btn"
                            onClick={() => updateQuestionField(question.id, 'diagram_url', '')}
                            type="button"
                          >
                            Remove image
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI Assistant */}
                  <div className="ai-assistant">
                    <div className="ai-header">
                      <span className="ai-icon">🤖</span>
                      <h3>AI Assistant</h3>
                      <select className="ai-target-dropdown" defaultValue="Question">
                        <option value="Question">Question</option>
                        <option value="Answer">Answer</option>
                      </select>
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
                    {historyEntry && (
                      <div className="ai-undo-container">
                        <span className="undo-info">
                          ✓ Modified: "{historyEntry.modificationPrompt}"
                        </span>
                        <button
                          className="undo-btn"
                          onClick={() => handleUndo(question.id)}
                        >
                          <span className="undo-icon">↩️</span>
                          Undo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="latex-comparison">
                    <div className="latex-panel raw-panel">
                      <div className="panel-header">
                        <span className="panel-icon">📝</span>
                        <h3>Question (Raw LaTeX Code)</h3>
                        <span className="editable-badge">Editable</span>
                      </div>
                      <div className="panel-content">
                        <textarea
                          className="raw-code-editor"
                          value={questionText}
                          onChange={(e) => updateQuestionField(question.id, 'text', e.target.value)}
                          placeholder="Enter LaTeX code here... (e.g., $\frac{a}{b} + c = d$)"
                          spellCheck={false}
                        />
                      </div>
                    </div>

                    <div className="latex-panel rendered-panel">
                      <div className="panel-header">
                        <span className="panel-icon">✨</span>
                        <h3>Question (Rendered Output)</h3>
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

                  {/* Answer LaTeX Section */}
                  <div className="latex-comparison">
                    <div className="latex-panel raw-panel">
                      <div className="panel-header">
                        <span className="panel-icon">📝</span>
                        <h3>Answer (Raw LaTeX Code)</h3>
                        <span className="editable-badge">Editable</span>
                      </div>
                      <div className="panel-content">
                        <textarea
                          className="raw-code-editor"
                          value={answerText}
                          onChange={(e) => updateQuestionField(question.id, 'answer', e.target.value)}
                          placeholder="Enter answer LaTeX code here... (e.g., $\frac{a}{b} + c = d$)"
                          spellCheck={false}
                        />
                      </div>
                    </div>

                    <div className="latex-panel rendered-panel">
                      <div className="panel-header">
                        <span className="panel-icon">✨</span>
                        <h3>Answer (Rendered Output)</h3>
                        <span className="live-badge">Live Preview</span>
                      </div>
                      <div className="panel-content">
                        {answerText ? (
                          <LatexRenderer content={answerText} />
                        ) : (
                          <div className="empty-content">No answer to render</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="question-submit-container">
                    <button className="question-submit-btn" type="button">
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QuestionBuilder;
