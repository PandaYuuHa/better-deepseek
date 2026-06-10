<script>
  import { marked } from "marked";

  let { runId = "", markdown = "" } = $props();

  let renderedHtml = $derived.by(() => {
    try {
      return marked(markdown || "");
    } catch {
      return markdown || "";
    }
  });

  let collapsed = $state(false);

  function toggleCollapse() {
    collapsed = !collapsed;
  }
</script>

<div class="bds-deep-research-report-card" data-testid="deep-research-report-card">
  <div class="bds-drr-header">
    <span class="bds-drr-icon">📄</span>
    <span class="bds-drr-title">Deep Research Report</span>
    {#if runId}
      <span class="bds-drr-run-id">Run: {runId.slice(0, 8)}</span>
    {/if}
    <button class="bds-drr-toggle" onclick={toggleCollapse}>
      {collapsed ? "▶ Show" : "▼ Hide"}
    </button>
  </div>

  {#if !collapsed}
    <div class="bds-drr-content">
      {@html renderedHtml}
    </div>
  {/if}
</div>

<style>
  .bds-deep-research-report-card {
    border: 1px solid var(--bds-border, #e0e0e0);
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    background: var(--bds-card-bg, #ffffff);
    font-size: 14px;
  }
  .bds-drr-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .bds-drr-icon { font-size: 18px; }
  .bds-drr-title { font-weight: 600; flex: 1; }
  .bds-drr-run-id { font-size: 11px; opacity: 0.6; font-family: monospace; }
  .bds-drr-toggle {
    font-size: 12px;
    background: none;
    border: 1px solid var(--bds-border, #ddd);
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
  }
  .bds-drr-content {
    padding-top: 8px;
    border-top: 1px solid var(--bds-border, #eee);
    line-height: 1.6;
  }
  .bds-drr-content :global(h1),
  .bds-drr-content :global(h2),
  .bds-drr-content :global(h3) {
    margin-top: 16px;
    margin-bottom: 8px;
  }
  .bds-drr-content :global(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
  }
  .bds-drr-content :global(th),
  .bds-drr-content :global(td) {
    border: 1px solid #ddd;
    padding: 6px 10px;
    text-align: left;
  }
  .bds-drr-content :global(a) {
    color: #1976d2;
    text-decoration: underline;
  }
</style>
