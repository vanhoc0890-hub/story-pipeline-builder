import React, { useMemo, useState } from 'react';

type AppView =
  | 'SCRIPT'
  | 'WORKFLOW';

type OutputType =
  | 'TEXT'
  | 'JSON';

type OutputDestination =
  | 'GENERAL'
  | 'CHARACTER_LOCKS'
  | 'VIDEO_HOOKS'
  | 'FINAL_JSON';

interface WorkflowStep {
  id: string;
  name: string;
  instruction: string;
  outputType: OutputType;
  outputDestination: OutputDestination;
}

function createStep(
  index: number
): WorkflowStep {
  return {
    id:
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `step-${Date.now()}-${index}`,

    name: `Step ${index}`,
    instruction: '',
    outputType: 'TEXT',
    outputDestination: 'GENERAL'
  };
}

export default function App() {
  const [view, setView] =
    useState<AppView>('SCRIPT');

  const [script, setScript] =
    useState('');

  const [fileName, setFileName] =
    useState('');

  const [steps, setSteps] =
    useState<WorkflowStep[]>([]);

  const characterCount =
    script.length;

  const wordCount = useMemo(() => {
    const trimmed =
      script.trim();

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
    const file =
      event.target.files?.[0];

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

    setView('WORKFLOW');
  };

  const handleNewScript = () => {
    const hasProjectData =
      Boolean(script.trim()) ||
      steps.length > 0;

    if (hasProjectData) {
      const confirmed =
        window.confirm(
          'Start a new project? Current script and workflow steps will be cleared.'
        );

      if (!confirmed) {
        return;
      }
    }

    setScript('');
    setFileName('');
    setSteps([]);
    setView('SCRIPT');
  };

  const handleHome = () => {
    setView('SCRIPT');
  };

  const addStep = () => {
    setSteps(current => [
      ...current,
      createStep(
        current.length + 1
      )
    ]);
  };

  const updateStep = (
    stepId: string,
    patch: Partial<WorkflowStep>
  ) => {
    setSteps(current =>
      current.map(step =>
        step.id === stepId
          ? {
              ...step,
              ...patch
            }
          : step
      )
    );
  };

  const deleteStep = (
    stepId: string
  ) => {
    setSteps(current =>
      current.filter(
        step =>
          step.id !== stepId
      )
    );
  };

  const moveStep = (
    index: number,
    direction: 'UP' | 'DOWN'
  ) => {
    setSteps(current => {
      const targetIndex =
        direction === 'UP'
          ? index - 1
          : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >=
          current.length
      ) {
        return current;
      }

      const next =
        [...current];

      const temp =
        next[index];

      next[index] =
        next[targetIndex];

      next[targetIndex] =
        temp;

      return next;
    });
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

        <div className="topbar-actions">

          {view === 'WORKFLOW' && (
            <button
              type="button"
              className="ghost-button"
              onClick={handleHome}
            >
              ← Home
            </button>
          )}

          <button
            type="button"
            className="ghost-button"
            onClick={handleNewScript}
          >
            + New Script
          </button>

        </div>

      </header>

      {view === 'SCRIPT' && (
        <ScriptInputScreen
          script={script}
          fileName={fileName}
          characterCount={
            characterCount
          }
          wordCount={
            wordCount
          }
          onScriptChange={
            value => {
              setScript(value);

              if (fileName) {
                setFileName('');
              }
            }
          }
          onFileUpload={
            handleFileUpload
          }
          onCreateProject={
            handleCreateProject
          }
        />
      )}

      {view === 'WORKFLOW' && (
        <WorkflowScreen
          script={script}
          fileName={fileName}
          steps={steps}
          onAddStep={addStep}
          onUpdateStep={
            updateStep
          }
          onDeleteStep={
            deleteStep
          }
          onMoveStep={
            moveStep
          }
        />
      )}

    </div>
  );
}

/* =====================================================
   SCRIPT INPUT SCREEN
===================================================== */

interface ScriptInputScreenProps {
  script: string;
  fileName: string;
  characterCount: number;
  wordCount: number;
  onScriptChange: (
    value: string
  ) => void;
  onFileUpload: (
    event:
      React.ChangeEvent<HTMLInputElement>
  ) => void;
  onCreateProject: () => void;
}

const ScriptInputScreen:
React.FC<
  ScriptInputScreenProps
> = ({
  script,
  fileName,
  characterCount,
  wordCount,
  onScriptChange,
  onFileUpload,
  onCreateProject
}) => {
  return (
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
          After loading the script, build your custom workflow.
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
            Upload Script

            <input
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={
                onFileUpload
              }
              hidden
            />
          </label>

        </div>

        <textarea
          className="script-textarea"
          placeholder="Paste your full script here..."
          value={script}
          onChange={
            event =>
              onScriptChange(
                event.target.value
              )
          }
        />

        <div className="script-footer">

          <div className="script-stats">

            <span>
              Characters:{' '}
              <strong>
                {characterCount.toLocaleString()}
              </strong>
            </span>

            <span>
              Words:{' '}
              <strong>
                {wordCount.toLocaleString()}
              </strong>
            </span>

            <span>
              File:{' '}
              <strong>
                {fileName ||
                  'Pasted text'}
              </strong>
            </span>

          </div>

          <button
            type="button"
            className="primary-button"
            onClick={
              onCreateProject
            }
            disabled={
              !script.trim()
            }
          >
            Create Project
          </button>

        </div>

      </section>

    </main>
  );
};

/* =====================================================
   WORKFLOW SCREEN
===================================================== */

interface WorkflowScreenProps {
  script: string;
  fileName: string;
  steps: WorkflowStep[];
  onAddStep: () => void;
  onUpdateStep: (
    stepId: string,
    patch: Partial<WorkflowStep>
  ) => void;
  onDeleteStep: (
    stepId: string
  ) => void;
  onMoveStep: (
    index: number,
    direction: 'UP' | 'DOWN'
  ) => void;
}

const WorkflowScreen:
React.FC<
  WorkflowScreenProps
> = ({
  script,
  fileName,
  steps,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onMoveStep
}) => {
  return (
    <main className="main-content">

      <section className="workflow-header">

        <div>
          <div className="step-badge">
            CUSTOM WORKFLOW
          </div>

          <h2>
            Build your processing steps
          </h2>

          <p>
            Steps will later run strictly from top to bottom.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onAddStep}
        >
          + Add Step
        </button>

      </section>

      <section className="project-summary">

        <div>
          <span className="summary-label">
            SCRIPT
          </span>

          <strong>
            {fileName ||
              'Pasted Script'}
          </strong>
        </div>

        <div>
          <span className="summary-label">
            CHARACTERS
          </span>

          <strong>
            {script.length.toLocaleString()}
          </strong>
        </div>

        <div>
          <span className="summary-label">
            STEPS
          </span>

          <strong>
            {steps.length}
          </strong>
        </div>

      </section>

      {steps.length === 0 ? (

        <section className="empty-workflow">

          <div className="empty-icon">
            +
          </div>

          <h3>
            No workflow steps yet
          </h3>

          <p>
            Add your first instruction step.
            You can create as many steps as your workflow requires.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={onAddStep}
          >
            + Add First Step
          </button>

        </section>

      ) : (

        <section className="workflow-list">

          {steps.map(
            (
              step,
              index
            ) => (
              <WorkflowStepCard
                key={step.id}
                step={step}
                index={index}
                totalSteps={
                  steps.length
                }
                onUpdate={
                  patch =>
                    onUpdateStep(
                      step.id,
                      patch
                    )
                }
                onDelete={
                  () =>
                    onDeleteStep(
                      step.id
                    )
                }
                onMoveUp={
                  () =>
                    onMoveStep(
                      index,
                      'UP'
                    )
                }
                onMoveDown={
                  () =>
                    onMoveStep(
                      index,
                      'DOWN'
                    )
                }
              />
            )
          )}

          <button
            type="button"
            className="add-step-bottom"
            onClick={onAddStep}
          >
            + Add Another Step
          </button>

        </section>

      )}

    </main>
  );
};

/* =====================================================
   WORKFLOW STEP CARD
===================================================== */

interface WorkflowStepCardProps {
  step: WorkflowStep;
  index: number;
  totalSteps: number;
  onUpdate: (
    patch: Partial<WorkflowStep>
  ) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const WorkflowStepCard:
React.FC<
  WorkflowStepCardProps
> = ({
  step,
  index,
  totalSteps,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  return (
    <article className="workflow-step-card">

      <div className="step-number-column">

        <div className="step-number">
          {index + 1}
        </div>

        {index <
          totalSteps - 1 && (
          <div className="step-connector" />
        )}

      </div>

      <div className="step-editor">

        <div className="step-editor-header">

          <div className="step-title-input-wrap">

            <label>
              Step Name
            </label>

            <input
              className="text-input"
              value={step.name}
              onChange={
                event =>
                  onUpdate({
                    name:
                      event.target.value
                  })
              }
            />

          </div>

          <div className="step-controls">

            <button
              type="button"
              className="icon-button"
              onClick={onMoveUp}
              disabled={
                index === 0
              }
              title="Move Up"
            >
              ↑
            </button>

            <button
              type="button"
              className="icon-button"
              onClick={
                onMoveDown
              }
              disabled={
                index ===
                totalSteps - 1
              }
              title="Move Down"
            >
              ↓
            </button>

            <button
              type="button"
              className="icon-button danger-button"
              onClick={
                onDelete
              }
              title="Delete Step"
            >
              ×
            </button>

          </div>

        </div>

        <div className="field-group">

          <label>
            Instruction
          </label>

          <textarea
            className="instruction-textarea"
            placeholder="Write the AI instruction for this step..."
            value={
              step.instruction
            }
            onChange={
              event =>
                onUpdate({
                  instruction:
                    event.target.value
                })
            }
          />

        </div>

        <div className="step-options-grid">

          <div className="field-group">

            <label>
              Output Type
            </label>

            <select
              className="select-input"
              value={
                step.outputType
              }
              onChange={
                event =>
                  onUpdate({
                    outputType:
                      event.target
                        .value as OutputType
                  })
              }
            >

              <option value="TEXT">
                Text
              </option>

              <option value="JSON">
                JSON
              </option>

            </select>

          </div>

          <div className="field-group">

            <label>
              Output Destination
            </label>

            <select
              className="select-input"
              value={
                step.outputDestination
              }
              onChange={
                event =>
                  onUpdate({
                    outputDestination:
                      event.target
                        .value as OutputDestination
                  })
              }
            >

              <option value="GENERAL">
                General
              </option>

              <option value="CHARACTER_LOCKS">
                Character Locks
              </option>

              <option value="VIDEO_HOOKS">
                Video Hooks
              </option>

              <option value="FINAL_JSON">
                Final JSON
              </option>

            </select>

          </div>

        </div>

        <div className="step-order-note">
          STEP {index + 1} WILL RUN AFTER STEP {index}
          {index === 0
            ? ' — FIRST AI STEP'
            : ''}
        </div>

      </div>

    </article>
  );
};
