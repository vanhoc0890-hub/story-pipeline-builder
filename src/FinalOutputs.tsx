import React, { useMemo, useState } from 'react';

interface FinalOutputStep {
  id: string;
  name: string;
  outputDestination: string;
  status: string;
  output: unknown;
}

interface FinalOutputsProps {
  steps: FinalOutputStep[];
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

async function copyText(
  text: string
) {
  if (!text) {
    return;
  }

  await navigator.clipboard.writeText(
    text
  );
}

function buildCombinedOutput(
  steps: FinalOutputStep[]
): string {
  return steps
    .map(
      step =>
        [
          step.name,
          formatOutput(
            step.output
          )
        ].join('\n\n')
    )
    .join(
      '\n\n========================================\n\n'
    );
}

function normalizeJsonDownload(
  output: unknown
) {
  if (
    typeof output !== 'string'
  ) {
    return output;
  }

  const trimmed =
    output.trim();

  try {
    return JSON.parse(
      trimmed
    );
  } catch {
    return {
      output:
        trimmed
    };
  }
}

export const FinalOutputs:
React.FC<
  FinalOutputsProps
> = ({
  steps
}) => {
  const [copiedCharacterLocks, setCopiedCharacterLocks] =
    useState(false);

  const [copiedHooks, setCopiedHooks] =
    useState(false);

  const characterLockSteps =
    useMemo(
      () =>
        steps.filter(
          step =>
            step.status ===
              'COMPLETE' &&
            step.outputDestination ===
              'CHARACTER_LOCKS'
        ),
      [steps]
    );

  const videoHookSteps =
    useMemo(
      () =>
        steps.filter(
          step =>
            step.status ===
              'COMPLETE' &&
            step.outputDestination ===
              'VIDEO_HOOKS'
        ),
      [steps]
    );

  const finalJsonSteps =
    useMemo(
      () =>
        steps.filter(
          step =>
            step.status ===
              'COMPLETE' &&
            step.outputDestination ===
              'FINAL_JSON'
        ),
      [steps]
    );

  const characterLocksText =
    useMemo(
      () =>
        buildCombinedOutput(
          characterLockSteps
        ),
      [characterLockSteps]
    );

  const videoHooksText =
    useMemo(
      () =>
        buildCombinedOutput(
          videoHookSteps
        ),
      [videoHookSteps]
    );

  const finalJsonStep =
    finalJsonSteps.length
      ? finalJsonSteps[
          finalJsonSteps.length - 1
        ]
      : null;

  const handleCopyCharacters =
    async () => {
      if (
        !characterLocksText
      ) {
        return;
      }

      await copyText(
        characterLocksText
      );

      setCopiedCharacterLocks(
        true
      );

      window.setTimeout(
        () =>
          setCopiedCharacterLocks(
            false
          ),
        1800
      );
    };

  const handleCopyHooks =
    async () => {
      if (
        !videoHooksText
      ) {
        return;
      }

      await copyText(
        videoHooksText
      );

      setCopiedHooks(
        true
      );

      window.setTimeout(
        () =>
          setCopiedHooks(
            false
          ),
        1800
      );
    };

  const handleDownloadJson =
    () => {
      if (
        !finalJsonStep
      ) {
        return;
      }

      const normalized =
        normalizeJsonDownload(
          finalJsonStep.output
        );

      const json =
        JSON.stringify(
          normalized,
          null,
          2
        );

      const blob =
        new Blob(
          [json],
          {
            type:
              'application/json'
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          'a'
        );

      anchor.href =
        url;

      anchor.download =
        'story-production-package.json';

      document.body.appendChild(
        anchor
      );

      anchor.click();

      document.body.removeChild(
        anchor
      );

      URL.revokeObjectURL(
        url
      );
    };

  const hasAnyOutput =
    characterLockSteps.length >
      0 ||
    videoHookSteps.length >
      0 ||
    finalJsonSteps.length >
      0;

  if (!hasAnyOutput) {
    return null;
  }

  return (
    <section className="final-outputs-section">

      <div className="final-outputs-header">

        <div>

          <span className="summary-label">
            PRODUCTION PACKAGE
          </span>

          <h2>
            Final Outputs
          </h2>

          <p>
            Results are collected automatically from completed workflow steps according to Output Destination.
          </p>

        </div>

      </div>

      <div className="final-output-grid">

        {/* =============================================
            CHARACTER LOCKS
        ============================================= */}

        <article className="final-output-card">

          <div className="final-output-card-header">

            <div>

              <span className="final-output-type">
                CHARACTER LOCKS
              </span>

              <strong>
                {characterLockSteps.length
                  ? 'Ready'
                  : 'Waiting'}
              </strong>

            </div>

            <span
              className={
                characterLockSteps.length
                  ? 'final-ready'
                  : 'final-waiting'
              }
            >
              {characterLockSteps.length
                ? '✓'
                : '—'}
            </span>

          </div>

          {characterLockSteps.length >
            0 ? (
            <>
              <pre className="final-output-preview">
                {characterLocksText}
              </pre>

              <button
                type="button"
                className="final-copy-button"
                onClick={
                  handleCopyCharacters
                }
              >
                {copiedCharacterLocks
                  ? 'COPIED'
                  : 'COPY ALL CHARACTER LOCKS'}
              </button>
            </>
          ) : (
            <p className="final-empty-text">
              No completed step is mapped to CHARACTER_LOCKS.
            </p>
          )}

        </article>

        {/* =============================================
            VIDEO HOOKS
        ============================================= */}

        <article className="final-output-card">

          <div className="final-output-card-header">

            <div>

              <span className="final-output-type">
                VIDEO HOOKS
              </span>

              <strong>
                {videoHookSteps.length
                  ? 'Ready'
                  : 'Waiting'}
              </strong>

            </div>

            <span
              className={
                videoHookSteps.length
                  ? 'final-ready'
                  : 'final-waiting'
              }
            >
              {videoHookSteps.length
                ? '✓'
                : '—'}
            </span>

          </div>

          {videoHookSteps.length >
            0 ? (
            <>
              <pre className="final-output-preview">
                {videoHooksText}
              </pre>

              <button
                type="button"
                className="final-copy-button"
                onClick={
                  handleCopyHooks
                }
              >
                {copiedHooks
                  ? 'COPIED'
                  : 'COPY ALL VIDEO HOOKS'}
              </button>
            </>
          ) : (
            <p className="final-empty-text">
              No completed step is mapped to VIDEO_HOOKS.
            </p>
          )}

        </article>

        {/* =============================================
            FINAL JSON
        ============================================= */}

        <article className="final-output-card">

          <div className="final-output-card-header">

            <div>

              <span className="final-output-type">
                FINAL JSON
              </span>

              <strong>
                {finalJsonStep
                  ? 'Ready'
                  : 'Waiting'}
              </strong>

            </div>

            <span
              className={
                finalJsonStep
                  ? 'final-ready'
                  : 'final-waiting'
              }
            >
              {finalJsonStep
                ? '✓'
                : '—'}
            </span>

          </div>

          {finalJsonStep ? (
            <>
              <pre className="final-output-preview">
                {formatOutput(
                  finalJsonStep.output
                )}
              </pre>

              <button
                type="button"
                className="final-download-button"
                onClick={
                  handleDownloadJson
                }
              >
                DOWNLOAD JSON
              </button>
            </>
          ) : (
            <p className="final-empty-text">
              No completed step is mapped to FINAL_JSON.
            </p>
          )}

        </article>

      </div>

    </section>
  );
};
