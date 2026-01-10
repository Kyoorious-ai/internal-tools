import React, { useState } from 'react';
import ExcelQuestionViewer from './pages/ExcelQuestionViewer';
import QuestionBuilder from './pages/QuestionBuilder';
import './App.css';

type AppMode = 'excel-viewer' | 'question-builder';

function App() {
  const [mode, setMode] = useState<AppMode>('question-builder');

  return (
    <div className="App">
      <nav className="app-navigation">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>LaTeX Question Tool</h1>
          </div>
          <div className="nav-tabs">
            <button
              className={`nav-tab ${mode === 'question-builder' ? 'active' : ''}`}
              onClick={() => setMode('question-builder')}
            >
              <span className="tab-icon">✏️</span>
              Question Builder
            </button>
            <button
              className={`nav-tab ${mode === 'excel-viewer' ? 'active' : ''}`}
              onClick={() => setMode('excel-viewer')}
            >
              <span className="tab-icon">📊</span>
              Excel Viewer
            </button>
          </div>
        </div>
      </nav>

      <div className="app-content">
        {mode === 'question-builder' ? (
          <QuestionBuilder />
        ) : (
          <ExcelQuestionViewer />
        )}
      </div>
    </div>
  );
}

export default App;

