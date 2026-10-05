import React, {
  useMemo,
  useRef,
  useState
} from 'react';

import { API_URL } from './config';

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

type StepStatus =
  | 'IDLE'
  | 'RUNNING'
  | 'COMPLETE'
  | 'FAILED';

type WorkflowStatus =
  | 'IDLE'
  | 'RUNNING'
  | 'PAUSED'
  | 'FAILED'
  | 'COMPLETE';

interface WorkflowStep {
  id: string;
  name: string;
  instruction: string;

  outputType:
    OutputType;

  outputDestination:
    OutputDestination;

  status:
    StepStatus;

  output:
    unknown;

  error:
    string | null;
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

    name:
      `Step ${index}`,

    instruction:
      '',

    outputType:
      'TEXT',

    outputDestination:
      'GENERAL',

    status:
      'IDLE',

    output:
      null,

    error:
      null
  };
}

function formatOutput(
  output: unknown
): string {
  if (
    output === null ||
    output === undefined
  ) {
    return '';
  }

  if (
    typeof output === 'string'
  ) {
    return output;
  }

  try {
    return JSON.stringify(
      output,
      null,
      2
    );
  } catch {
    return String(output);
  }
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

  const [workflowStatus, setWorkflowStatus] =
    useState<WorkflowStatus>('IDLE');

  const pauseRequestedRef =
    useRef(false);

  const stepsRef =
    useRef<WorkflowStep[]>([]);

  const characterCount =
    script.length;

  const wordCount =
    useMemo(() => {
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

  const completedCount =
    steps.filter(
      step =>
        step.status ===
        'COMPLETE'
    ).length;

  const progressPercent =
    steps.length === 0
      ? 0
      : Math.round(
          (
            completedCount /
            steps.length
          ) * 100
        );

  const syncSteps =
    (
      updater:
        (
          current:
            WorkflowStep[]
        ) => WorkflowStep[]
    ) => {
      setSteps(
        current => {
          const next =
            updater(
              current
            );

          stepsRef.current =
            next;

          return next;
        }
      );
    };

  /* =====================================================
     SCRIPT
  ===================================================== */

  const handleFileUpload =
    async (
      event:
        React.ChangeEvent<HTMLInputElement>
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

        event.target.value =
          '';

        return;
      }

      try {
        const text =
          await file.text();

        setScript(text);
        setFileName(
          file.name
        );
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

  const handleCreateProject =
    () => {
      if (
        !script.trim()
      ) {
        window.alert(
          'Please enter or upload a script first.'
        );

        return;
      }

      setView(
        'WORKFLOW'
      );
    };

  const handleHome =
    () => {
      setView(
        'SCRIPT'
      );
    };

  const handleNewScript =
    () => {
      const hasProjectData =
        Boolean(
          script.trim()
        ) ||
        steps.length > 0;

      if (
        hasProjectData
      ) {
        const confirmed =
          window.confirm(
            'Start a new project? Current script, workflow steps and results will be cleared.'
          );

        if (
          !confirmed
        ) {
          return;
        }
      }

      pauseRequestedRef.current =
        true;

      setScript('');
      setFileName('');
      setSteps([]);
      stepsRef.current = [];
      setWorkflowStatus('IDLE');
      setView('SCRIPT');
    };

  /* =====================================================
     STEP EDITING
  ===================================================== */

  const invalidateFromIndex =
    (
      list:
        WorkflowStep[],
      startIndex:
        number
    ) => {
      return list.map(
        (
          step,
          index
        ) => {
          if (
            index < startIndex
          ) {
            return step;
          }

          return {
            ...step,
            status:
              'IDLE' as StepStatus,
            output:
              null,
            error:
              null
          };
        }
      );
    };

  const addStep =
    () => {
      if (
        workflowStatus ===
        'RUNNING'
      ) {
        return;
      }

      syncSteps(
        current => [
          ...current,
          createStep(
            current.length + 1
          )
        ]
      );

      setWorkflowStatus(
        'IDLE'
      );
    };

  const updateStep =
    (
      stepId:
        string,
      patch:
        Partial<WorkflowStep>
    ) => {
      if (
        workflowStatus ===
        'RUNNING'
      ) {
        return;
      }

      syncSteps(
        current => {
          const index =
            current.findIndex(
              step =>
                step.id ===
                stepId
            );

          if (
            index === -1
          ) {
            return current;
          }

          const next =
            current.map(
              step =>
                step.id ===
                stepId
                  ? {
                      ...step,
                      ...patch
                    }
                  : step
            );

          return invalidateFromIndex(
            next,
            index
          );
        }
      );

      setWorkflowStatus(
        'IDLE'
      );
    };

  const deleteStep =
    (
      stepId:
        string
    ) => {
      if (
        workflowStatus ===
        'RUNNING'
      ) {
        return;
      }

      syncSteps(
        current => {
          const index =
            current.findIndex(
              step =>
                step.id ===
                stepId
            );

          const filtered =
            current.filter(
              step =>
                step.id !==
                stepId
            );

          if (
            index === -1
          ) {
            return filtered;
          }

          return invalidateFromIndex(
            filtered,
            Math.max(
              0,
              index
            )
          );
        }
      );

      setWorkflowStatus(
        'IDLE'
      );
    };

  const moveStep =
    (
      index:
        number,
      direction:
        'UP' |
        'DOWN'
    ) => {
      if (
        workflowStatus ===
        'RUNNING'
      ) {
        return;
      }

      syncSteps(
        current => {
          const targetIndex =
            direction ===
            'UP'
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

          const invalidateIndex =
            Math.min(
              index,
              targetIndex
            );

          return invalidateFromIndex(
            next,
            invalidateIndex
          );
        }
      );

      setWorkflowStatus(
        'IDLE'
      );
    };

  /* =====================================================
     RUN ONE STEP
  ===================================================== */

  const executeStep =
    async (
      stepIndex:
        number
    ): Promise<
      'COMPLETE' |
      'FAILED'
    > => {
      const currentSteps =
        stepsRef.current.length
          ? stepsRef.current
          : steps;

      const step =
        currentSteps[
          stepIndex
        ];

      if (!step) {
        return 'FAILED';
      }

      if (
        !step.instruction.trim()
      ) {
        syncSteps(
          current =>
            current.map(
              (
                item,
                index
              ) =>
                index ===
                stepIndex
                  ? {
                      ...item,
                      status:
                        'FAILED',
                      error:
                        'STEP_INSTRUCTION_REQUIRED'
                    }
                  : item
            )
        );

        return 'FAILED';
      }

      if (!API_URL) {
        syncSteps(
          current =>
            current.map(
              (
                item,
                index
              ) =>
                index ===
                stepIndex
                  ? {
                      ...item,
                      status:
                        'FAILED',
                      error:
                        'API_URL_NOT_CONFIGURED'
                    }
                  : item
            )
        );

        return 'FAILED';
      }

      const previousOutputs =
        currentSteps
          .slice(
            0,
            stepIndex
          )
          .filter(
            previous =>
              previous.status ===
              'COMPLETE'
          )
          .map(
            (
              previous,
              index
            ) => ({
              stepNumber:
                index + 1,

              name:
                previous.name,

              output:
                previous.output
            })
          );

      syncSteps(
        current =>
          current.map(
            (
              item,
              index
            ) =>
              index ===
              stepIndex
                ? {
                    ...item,
                    status:
                      'RUNNING',
                    error:
                      null
                  }
                : item
          )
      );

      try {
        const response =
          await fetch(
            `${API_URL}/run-step`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  script,

                  stepName:
                    step.name,

                  instruction:
                    step.instruction,

                  previousOutputs,

                  outputType:
                    step.outputType
                })
            }
          );

        let data:
          any = null;

        try {
          data =
            await response.json();
        } catch {
          throw new Error(
            'INVALID_BACKEND_RESPONSE'
          );
        }

        if (
          !response.ok ||
          !data?.ok
        ) {
          throw new Error(
            data?.detail ||
            data?.error ||
            `HTTP_${response.status}`
          );
        }

        syncSteps(
          current =>
            current.map(
              (
                item,
                index
              ) =>
                index ===
                stepIndex
                  ? {
                      ...item,
                      status:
                        'COMPLETE',
                      output:
                        data.output,
                      error:
                        null
                    }
                  : item
            )
        );

        return 'COMPLETE';

      } catch (
        error: any
      ) {
        console.error(
          '[RUN_STEP_FAILED]',
          error
        );

        syncSteps(
          current =>
            current.map(
              (
                item,
                index
              ) =>
                index ===
                stepIndex
                  ? {
                      ...item,
                      status:
                        'FAILED',
                      error:
                        error?.message ||
                        'UNKNOWN_ERROR'
                    }
                  : item
            )
        );

        return 'FAILED';
      }
    };

  const runStep =
    async (
      stepIndex:
        number
    ) => {
      if (
        workflowStatus ===
        'RUNNING'
      ) {
        return;
      }

      const currentSteps =
        stepsRef.current.length
          ? stepsRef.current
          : steps;

      if (
        stepIndex > 0 &&
        currentSteps[
          stepIndex - 1
        ]?.status !==
          'COMPLETE'
      ) {
        window.alert(
          `Step ${stepIndex} must be completed before Step ${stepIndex + 1} can run.`
        );

        return;
      }

      const result =
        await executeStep(
          stepIndex
        );

      if (
        result ===
        'FAILED'
      ) {
        setWorkflowStatus(
          'FAILED'
        );
      }
    };

  /* =====================================================
     RUN ALL
  ===================================================== */

  const runSequentially =
    async (
      startIndex:
        number
    ) => {
      if (
        steps.length === 0
      ) {
        window.alert(
          'Please add at least one workflow step.'
        );

        return;
      }

      pauseRequestedRef.current =
        false;

      setWorkflowStatus(
        'RUNNING'
      );

      for (
        let index =
          startIndex;
        index <
          stepsRef.current.length;
        index += 1
      ) {
        const current =
          stepsRef.current[
            index
          ];

        if (
          current?.status ===
          'COMPLETE'
        ) {
          continue;
        }

        const result =
          await executeStep(
            index
          );

        if (
          result ===
          'FAILED'
        ) {
          setWorkflowStatus(
            'FAILED'
          );

          return;
        }

        if (
          pauseRequestedRef.current
        ) {
          setWorkflowStatus(
            'PAUSED'
          );

          return;
        }
      }

      setWorkflowStatus(
        'COMPLETE'
      );
    };

  const handleRunAll =
    async () => {
      if (
        workflowStatus ===
        'RUNNING'
      ) {
        return;
      }

      if (
        steps.length === 0
      ) {
        window.alert(
          'Please add at least one workflow step.'
        );

        return;
      }

      const emptyInstructionIndex =
        steps.findIndex(
          step =>
            !step.instruction.trim()
        );

      if (
        emptyInstructionIndex !==
        -1
      ) {
        window.alert(
          `Step ${emptyInstructionIndex + 1} has no instruction.`
        );

        return;
      }

      syncSteps(
        current =>
          current.map(
            step => ({
              ...step,
              status:
                'IDLE',
              output:
                null,
              error:
                null
            })
          )
      );

      await runSequentially(
        0
      );
    };

  const handlePause =
    () => {
      if (
        workflowStatus !==
        'RUNNING'
      ) {
        return;
      }

      pauseRequestedRef.current =
        true;
    };

  const handleContinue =
    async () => {
      if (
        workflowStatus ===
        'RUNNING'
      ) {
        return;
      }

      const currentSteps =
        stepsRef.current.length
          ? stepsRef.current
          : steps;

      const nextIndex =
        currentSteps.findIndex(
          step =>
            step.status !==
            'COMPLETE'
        );

      if (
        nextIndex === -1
      ) {
        setWorkflowStatus(
          'COMPLETE'
        );

        return;
      }

      await runSequentially(
        nextIndex
      );
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

          {view ===
            'WORKFLOW' && (
            <button
              type="button"
              className="ghost-button"
              onClick={
                handleHome
              }
            >
              ← Home
            </button>
          )}

          <button
            type="button"
            className="ghost-button"
            onClick={
              handleNewScript
            }
          >
            + New Script
          </button>

        </div>

      </header>

      {view ===
        'SCRIPT' && (
        <ScriptInputScreen
          script={
            script
          }
          fileName={
            fileName
          }
          characterCount={
            characterCount
          }
          wordCount={
            wordCount
          }

          onScriptChange={
            value => {
              setScript(
                value
              );

              if (
                fileName
              ) {
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

      {view ===
        'WORKFLOW' && (
        <WorkflowScreen
          script={
            script
          }

          fileName={
            fileName
          }

          steps={
            steps
          }

          workflowStatus={
            workflowStatus
          }

          completedCount={
            completedCount
          }

          progressPercent={
            progressPercent
          }

          onAddStep={
            addStep
          }

          onUpdateStep={
            updateStep
          }

          onDeleteStep={
            deleteStep
          }

          onMoveStep={
            moveStep
          }

          onRunStep={
            runStep
          }

          onRunAll={
            handleRunAll
          }

          onPause={
            handlePause
          }

          onContinue={
            handleContinue
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
  script:
    string;

  fileName:
    string;

  characterCount:
    number;

  wordCount:
    number;

  onScriptChange:
    (
      value:
        string
    ) => void;

  onFileUpload:
    (
      event:
        React.ChangeEvent<HTMLInputElement>
    ) => void;

  onCreateProject:
    () => void;
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
          value={
            script
          }
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
  script:
    string;

  fileName:
    string;

  steps:
    WorkflowStep[];

  workflowStatus:
    WorkflowStatus;

  completedCount:
    number;

  progressPercent:
    number;

  onAddStep:
    () => void;

  onUpdateStep:
    (
      stepId:
        string,
      patch:
        Partial<WorkflowStep>
    ) => void;

  onDeleteStep:
    (
      stepId:
        string
    ) => void;

  onMoveStep:
    (
      index:
        number,
      direction:
        'UP' |
        'DOWN'
    ) => void;

  onRunStep:
    (
      stepIndex:
        number
    ) => void;

  onRunAll:
    () => void;

  onPause:
    () => void;

  onContinue:
    () => void;
}

const WorkflowScreen:
React.FC<
  WorkflowScreenProps
> = ({
  script,
  fileName,
  steps,
  workflowStatus,
  completedCount,
  progressPercent,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onMoveStep,
  onRunStep,
  onRunAll,
  onPause,
  onContinue
}) => {
  const isRunning =
    workflowStatus ===
    'RUNNING';

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
            Steps run strictly from top to bottom.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={
            onAddStep
          }
          disabled={
            isRunning
          }
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

      {steps.length > 0 && (
        <section className="workflow-runtime-panel">

          <div className="workflow-runtime-top">

            <div>

              <span className="summary-label">
                WORKFLOW STATUS
              </span>

              <strong className="workflow-status-text">
                {workflowStatus}
              </strong>

            </div>

            <div className="workflow-controls">

              <button
                type="button"
                className="workflow-run-button"
                onClick={
                  onRunAll
                }
                disabled={
                  isRunning
                }
              >
                RUN ALL
              </button>

              <button
                type="button"
                className="workflow-pause-button"
                onClick={
                  onPause
                }
                disabled={
                  !isRunning
                }
              >
                PAUSE
              </button>

              <button
                type="button"
                className="workflow-continue-button"
                onClick={
                  onContinue
                }
                disabled={
                  isRunning ||
                  workflowStatus ===
                    'COMPLETE'
                }
              >
                CONTINUE
              </button>

            </div>

          </div>

          <div className="workflow-progress-label">

            <span>
              {completedCount} / {steps.length} completed
            </span>

            <strong>
              {progressPercent}%
            </strong>

          </div>

          <div className="workflow-progress-track">

            <div
              className="workflow-progress-fill"
              style={{
                width:
                  `${progressPercent}%`
              }}
            />

          </div>

        </section>
      )}

      {steps.length === 0
        ? (
          <section className="empty-workflow">

            <div className="empty-icon">
              +
            </div>

            <h3>
              No workflow steps yet
            </h3>

            <p>
              Add your first instruction step.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={
                onAddStep
              }
            >
              + Add First Step
            </button>

          </section>
        )
        : (
          <section className="workflow-list">

            {steps.map(
              (
                step,
                index
              ) => (
                <WorkflowStepCard
                  key={
                    step.id
                  }

                  step={
                    step
                  }

                  index={
                    index
                  }

                  totalSteps={
                    steps.length
                  }

                  previousComplete={
                    index === 0 ||
                    steps[
                      index - 1
                    ]?.status ===
                    'COMPLETE'
                  }

                  workflowRunning={
                    isRunning
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

                  onRun={
                    () =>
                      onRunStep(
                        index
                      )
                  }
                />
              )
            )}

            <button
              type="button"
              className="add-step-bottom"
              onClick={
                onAddStep
              }
              disabled={
                isRunning
              }
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
  step:
    WorkflowStep;

  index:
    number;

  totalSteps:
    number;

  previousComplete:
    boolean;

  workflowRunning:
    boolean;

  onUpdate:
    (
      patch:
        Partial<WorkflowStep>
    ) => void;

  onDelete:
    () => void;

  onMoveUp:
    () => void;

  onMoveDown:
    () => void;

  onRun:
    () => void;
}

const WorkflowStepCard:
React.FC<
  WorkflowStepCardProps
> = ({
  step,
  index,
  totalSteps,
  previousComplete,
  workflowRunning,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRun
}) => {
  const isRunning =
    step.status ===
    'RUNNING';

  const isLocked =
    !previousComplete;

  const editingDisabled =
    isRunning ||
    workflowRunning;

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
              value={
                step.name
              }
              disabled={
                editingDisabled
              }
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
              onClick={
                onMoveUp
              }
              disabled={
                index === 0 ||
                editingDisabled
              }
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
                totalSteps - 1 ||
                editingDisabled
              }
            >
              ↓
            </button>

            <button
              type="button"
              className="icon-button danger-button"
              onClick={
                onDelete
              }
              disabled={
                editingDisabled
              }
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
            disabled={
              editingDisabled
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
              disabled={
                editingDisabled
              }
              onChange={event =>
                onUpdate({
                  outputType:
                    event.target.value as OutputType
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
              disabled={
                editingDisabled
              }
              onChange={event =>
                onUpdate({
                  outputDestination:
                    event.target.value as OutputDestination
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

        <div className="step-runtime-row">

          <div
            className={`status-badge status-${step.status.toLowerCase()}`}
          >
            {isLocked
              ? 'LOCKED'
              : step.status}
          </div>

          <button
            type="button"
            className="run-step-button"
            onClick={
              onRun
            }
            disabled={
              isRunning ||
              workflowRunning ||
              isLocked ||
              !step.instruction.trim()
            }
          >
            {isRunning
              ? 'RUNNING...'
              : step.status ===
                  'COMPLETE'
                ? 'RUN AGAIN'
                : step.status ===
                    'FAILED'
                  ? 'RETRY STEP'
                  : 'RUN STEP'}
          </button>

        </div>

        {step.error && (
          <div className="step-error">
            {step.error}
          </div>
        )}

        {step.status ===
          'COMPLETE' && (
          <div className="step-output">

            <div className="step-output-header">

              <span>
                STEP OUTPUT
              </span>

              <button
                type="button"
                className="copy-output-button"
                onClick={
                  () =>
                    navigator.clipboard.writeText(
                      formatOutput(
                        step.output
                      )
                    )
                }
              >
                Copy
              </button>

            </div>

            <pre>
              {formatOutput(
                step.output
              )}
            </pre>

          </div>
        )}

        <div className="step-order-note">

          {index === 0
            ? 'STEP 1 — FIRST AI STEP'
            : `STEP ${index + 1} WILL RUN AFTER STEP ${index}`}

        </div>

      </div>

    </article>
  );
};
