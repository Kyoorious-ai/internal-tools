import React, { useState, useRef, useEffect } from 'react';
import ExcelQuestionViewer from './pages/ExcelQuestionViewer';
import QuestionBuilder from './pages/QuestionBuilder';
import './App.css';

type AppMode = 'excel-viewer' | 'question-builder';

interface DropdownState {
  workspace: boolean;
  analytics: boolean;
  organization: boolean;
}

function App() {
  const [mode, setMode] = useState<AppMode>('question-builder');
  const [dropdowns, setDropdowns] = useState<DropdownState>({
    workspace: false,
    analytics: false,
    organization: false,
  });

  const dropdownRefs = {
    workspace: useRef<HTMLDivElement>(null),
    analytics: useRef<HTMLDivElement>(null),
    organization: useRef<HTMLDivElement>(null),
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutside = Object.values(dropdownRefs).every(
        (ref) => ref.current && !ref.current.contains(event.target as Node)
      );

      if (clickedOutside) {
        setDropdowns({
          workspace: false,
          analytics: false,
          organization: false,
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdown: keyof DropdownState) => {
    setDropdowns((prev) => ({
      workspace: false,
      analytics: false,
      organization: false,
      [dropdown]: !prev[dropdown],
    }));
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setDropdowns({
      workspace: false,
      analytics: false,
      organization: false,
    });
  };

  const handleSettings = () => {
    alert('Settings clicked! Implement your settings page here.');
  };

  return (
    <div className="App">
      <nav className="app-navigation">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>ACMS</h1>
          </div>

          <div className="nav-tabs">
            {/* Workspace Dropdown */}
            <div
              className={`nav-dropdown ${dropdowns.workspace ? 'open' : ''}`}
              ref={dropdownRefs.workspace}
            >
              <button
                className={`nav-dropdown-btn ${
                  mode === 'question-builder' || mode === 'excel-viewer' ? 'active' : ''
                }`}
                onClick={() => toggleDropdown('workspace')}
              >
                <span className="dropdown-icon">📝</span>
                Workspace
                <span className="dropdown-arrow">▼</span>
              </button>

              <div className="nav-dropdown-menu">
                <button
                  className={`dropdown-item ${mode === 'question-builder' ? 'active' : ''}`}
                  onClick={() => handleModeChange('question-builder')}
                >
                  <span className="dropdown-item-icon">✏️</span>
                  Question Builder
                </button>
                <button
                  className={`dropdown-item ${mode === 'excel-viewer' ? 'active' : ''}`}
                  onClick={() => handleModeChange('excel-viewer')}
                >
                  <span className="dropdown-item-icon">📊</span>
                  Excel Viewer
                </button>
              </div>
            </div>

            {/* Analytics Dropdown */}
            <div
              className={`nav-dropdown ${dropdowns.analytics ? 'open' : ''}`}
              ref={dropdownRefs.analytics}
            >
              <button
                className="nav-dropdown-btn"
                onClick={() => toggleDropdown('analytics')}
              >
                <span className="dropdown-icon">📈</span>
                Analytics
                <span className="dropdown-arrow">▼</span>
              </button>

              <div className="nav-dropdown-menu">
                <button className="dropdown-item">
                  <span className="dropdown-item-icon">📊</span>
                  Dashboard
                </button>
                <button className="dropdown-item">
                  <span className="dropdown-item-icon">📉</span>
                  Reports
                </button>
              </div>
            </div>

            {/* Organization Dropdown */}
            <div
              className={`nav-dropdown ${dropdowns.organization ? 'open' : ''}`}
              ref={dropdownRefs.organization}
            >
              <button
                className="nav-dropdown-btn"
                onClick={() => toggleDropdown('organization')}
              >
                <span className="dropdown-icon">🏢</span>
                Organization
                <span className="dropdown-arrow">▼</span>
              </button>

              <div className="nav-dropdown-menu">
                <button className="dropdown-item">
                  <span className="dropdown-item-icon">👥</span>
                  Teams
                </button>
                <button className="dropdown-item">
                  <span className="dropdown-item-icon">👤</span>
                  Members
                </button>
              </div>
            </div>

            {/* Settings Button */}
            <button className="nav-settings-btn" onClick={handleSettings}>
              <span className="settings-icon">⚙️</span>
              Settings
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