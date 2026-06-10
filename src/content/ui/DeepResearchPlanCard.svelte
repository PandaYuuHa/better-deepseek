<script>
  import { t } from "../../lib/i18n.svelte.js";

  let { runId = "", plan = null, raw = "", error = "", onApprove = null, onRequestChanges = null, onCancel = null } = $props();

  let parsedPlan = $derived.by(() => {
    if (plan && typeof plan === "object") return plan;
    return null;
  });

  let steps = $derived(parsedPlan && Array.isArray(parsedPlan.steps) ? parsedPlan.steps : []);
  let title = $derived(parsedPlan ? (parsedPlan.title || "Research Plan") : "Research Plan");
  let hasMalformedJson = $derived(!parsedPlan && (!!raw || !!error));

  let feedbackText = $state("");
  let showFeedback = $state(false);

  function handleApprove() {
    if (onApprove) onApprove(runId);
  }

  function handleRequestChanges() {
    if (!showFeedback) {
      showFeedback = true;
      return;
    }
    if (onRequestChanges && feedbackText.trim()) {
      onRequestChanges(runId, feedbackText.trim());
      feedbackText = "";
      showFeedback = false;
    }
  }

  function handleCancel() {
    if (onCancel) onCancel(runId);
  }
</script>

<div class="bds-deep-research-plan-card" data-testid="deep-research-plan-card">
  <div class="bds-dr-header">
    <span class="bds-dr-icon">📋</span>
    <span class="bds-dr-title">{title}</span>
    {#if runId}
      <span class="bds-dr-run-id">Run: {runId.slice(0, 8)}</span>
    {/if}
  </div>

  {#if hasMalformedJson}
    <div class="bds-dr-error">
      <p>⚠️ Failed to parse research plan JSON</p>
      {#if error}
        <pre class="bds-dr-error-detail">{error}</pre>
      {/if}
      {#if raw}
        <pre class="bds-dr-raw">{raw}</pre>
      {/if}
    </div>
  {:else if parsedPlan}
    <div class="bds-dr-steps">
      {#each steps as step, i}
        <div class="bds-dr-step">
          <span class="bds-dr-step-num">{step.id || i + 1}.</span>
          <span class="bds-dr-step-action" class:search={step.action === "search"} class:fetch={step.action === "fetch"}>
            {step.action || "search"}
          </span>
          <span class="bds-dr-step-query">{step.query || ""}</span>
          {#if step.purpose}
            <span class="bds-dr-step-purpose">— {step.purpose}</span>
          {/if}
        </div>
      {/each}
    </div>

    <div class="bds-dr-actions">
      <button class="bds-dr-btn bds-dr-btn-approve" onclick={handleApprove} data-testid="dr-approve-btn">
        ✅ Approve
      </button>
      <button class="bds-dr-btn bds-dr-btn-revise" onclick={handleRequestChanges} data-testid="dr-revise-btn">
        ✏️ Request Changes
      </button>
      <button class="bds-dr-btn bds-dr-btn-cancel" onclick={handleCancel} data-testid="dr-cancel-btn">
        ❌ Cancel
      </button>
    </div>

    {#if showFeedback}
      <div class="bds-dr-feedback">
        <textarea
          class="bds-dr-feedback-input"
          placeholder="Describe what changes you'd like to the research plan..."
          bind:value={feedbackText}
          data-testid="dr-feedback-input"
        ></textarea>
        <button class="bds-dr-btn bds-dr-btn-submit" onclick={handleRequestChanges} data-testid="dr-submit-feedback-btn">
          Submit Feedback
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .bds-deep-research-plan-card {
    border: 1px solid var(--bds-border, #e0e0e0);
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    background: var(--bds-card-bg, #f9f9f9);
    font-size: 14px;
  }
  .bds-dr-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .bds-dr-icon { font-size: 18px; }
  .bds-dr-title { font-weight: 600; flex: 1; }
  .bds-dr-run-id { font-size: 11px; opacity: 0.6; font-family: monospace; }
  .bds-dr-steps { margin-bottom: 12px; }
  .bds-dr-step {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 4px 0;
    flex-wrap: wrap;
  }
  .bds-dr-step-num { font-weight: 600; min-width: 20px; }
  .bds-dr-step-action {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 500;
  }
  .bds-dr-step-action.search { background: #e3f2fd; color: #1565c0; }
  .bds-dr-step-action.fetch { background: #e8f5e9; color: #2e7d32; }
  .bds-dr-step-query { font-family: monospace; font-size: 13px; }
  .bds-dr-step-purpose { font-size: 12px; opacity: 0.7; }
  .bds-dr-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .bds-dr-btn {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid var(--bds-border, #ddd);
    cursor: pointer;
    font-size: 13px;
    background: white;
  }
  .bds-dr-btn:hover { opacity: 0.8; }
  .bds-dr-btn-approve { background: #e8f5e9; border-color: #a5d6a7; }
  .bds-dr-btn-revise { background: #fff3e0; border-color: #ffcc80; }
  .bds-dr-btn-cancel { background: #fbe9e7; border-color: #ef9a9a; }
  .bds-dr-feedback {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .bds-dr-feedback-input {
    width: 100%;
    min-height: 60px;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid var(--bds-border, #ddd);
    font-size: 13px;
    resize: vertical;
  }
  .bds-dr-btn-submit { align-self: flex-end; background: #e3f2fd; border-color: #90caf9; }
  .bds-dr-error { color: #d32f2f; }
  .bds-dr-error-detail, .bds-dr-raw {
    font-size: 11px;
    overflow-x: auto;
    background: #fafafa;
    padding: 6px;
    border-radius: 4px;
    max-height: 100px;
  }
</style>
