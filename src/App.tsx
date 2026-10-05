import React, { useMemo, useState } from 'react';

export default function App() {
  const [script, setScript] = useState('');
  const [fileName, setFileName] = useState('');

  const characterCount = script.length;

  const wordCount = useMemo(() => {
    const trimmed = script.trim();

    if (!trimmed) {
      return 0;
    }

    return trimmed
      .split(/\s+/)
      .filter(Boolean)
      .length;
  }, [script]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedExtensions = [
      '.txt',
      '.md'
    ];

    const lowerName =
      file.name.toLowerCase();

    const validFile =
      allowedExtensions.some(
        extension =>
          lowerName.endsWith(
            extension
          )
      );

    if (!validFile) {
      window.alert(
        'Please upload a .txt or .md file.'
      );

      event.target.value = '';
      return;
    }

    try {
      const text =
        await file.text();

      setScript(text);
      setFileName(file.name);
    } catch (error) {
      console.error(
        '[SCRIPT_FILE_READ_FAILED]',
        error
      );

      window.alert(
        'Could not read this file.'
      );
    }
  };

  const handleCreateProject = () => {
    if (!script.trim()) {
      window.alert(
        'Please enter or upload a script first.'
      );

      return;
    }

    window.alert(
      'Script accepted. Workflow Builder will be added in the next phase.'
    );
  };

  const handleClearScript = () => {
    setScript('');
    setFileName('');
  };

  return (
    <div className="app-shell">

      <header className="topbar">
        <div>
          <p className="eyebrow">
            AI WORKFLOW ENGINE
          </p>

          <h1>
            Story Pipeline Builder
          </h1>
        </div>

        <button
          type="button"
          className="ghost-button"
          onClick={handleClearScript}
          disabled={!script}
        >
          New Script
        </button>
      </header>

      <main className="main-content">

        <section className="hero-section">
          <div className="step-badge">
            REQUIRED INPUT
          </div>

          <h2>
            Start with your script
          </h2>

          <p>
            Paste the full script below or upload a TXT / MD file.
            Workflow steps will be created after the script is loaded.
          </p>
        </section>

        <section className="script-card">

          <div className="script-card-header">

            <div>
              <h3>
                Script Input
              </h3>

              <p>
                This is the required first stage of every project.
              </p>
            </div>

            <label className="upload-button">
              <span>
                Upload Script
              </span>

              <input
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={handleFileUpload}
                hidden
              />
            </label>

          </div>

          <textarea
            className="script-textarea"
            placeholder="Paste your full script here..."
            value={script}
            onChange={event => {
              setScript(
                event.target.value
              );

              if (
                fileName
              ) {
                setFileName('');
              }
            }}
          />

          <div className="script-footer">

            <div className="script-stats">

              <span>
                Characters:
                {' '}
                <strong>
                  {characterCount.toLocaleString()}
                </strong>
              </span>

              <span>
                Words:
                {' '}
                <strong>
                  {wordCount.toLocaleString()}
                </strong>
              </span>

              <span>
                File:
                {' '}
                <strong>
                  {fileName || 'Pasted text'}
                </strong>
              </span>

            </div>

            <button
              type="button"
              className="primary-button"
              onClick={handleCreateProject}
              disabled={!script.trim()}
            >
              Create Project
            </button>

          </div>

        </section>

      </main>
    </div>
  );
}
