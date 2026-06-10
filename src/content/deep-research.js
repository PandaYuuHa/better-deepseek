/**
 * Deep Research Mode V1 — State machine and run management.
 *
 * State machine: idle -> planning -> awaiting_revision|approved -> running -> reporting -> complete
 *
 * Persists minimal run metadata under STORAGE_KEYS.deepResearchRuns.
 */

import { STORAGE_KEYS } from "../lib/constants.js";
import { makeId } from "../lib/utils/helpers.js";

/** Valid statuses for a deep research run */
export const RESEARCH_STATUSES = [
  "idle",
  "planning",
  "awaiting_revision",
  "approved",
  "running",
  "reporting",
  "complete",
  "cancelled",
];

/** Allowed state transitions */
const TRANSITIONS = {
  idle: ["planning"],
  planning: ["awaiting_revision", "approved", "cancelled"],
  awaiting_revision: ["planning", "cancelled"],
  approved: ["running", "cancelled"],
  running: ["reporting", "cancelled"],
  reporting: ["complete"],
  complete: [],
  cancelled: [],
};

/**
 * Create a new deep research run object.
 * @param {string} conversationId
 * @returns {object} run
 */
export function createRun(conversationId) {
  return {
    id: makeId(),
    conversationId,
    status: "planning",
    plan: null,
    sourceLedger: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Validate and apply a status transition.
 * @param {object} run
 * @param {string} newStatus
 * @returns {object} updated run (same reference, mutated)
 * @throws if transition is invalid
 */
export function transitionRun(run, newStatus) {
  const allowed = TRANSITIONS[run.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(
      `Invalid deep research transition: ${run.status} -> ${newStatus}`
    );
  }
  run.status = newStatus;
  run.updatedAt = Date.now();
  return run;
}

/**
 * Persist runs array to chrome storage.
 * @param {Array} runs
 */
export async function persistRuns(runs) {
  if (typeof chrome !== "undefined" && chrome.storage) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.deepResearchRuns]: runs.map(serializeRun),
    });
  }
}

/**
 * Load runs from chrome storage.
 * @returns {Promise<Array>}
 */
export async function loadRuns() {
  if (typeof chrome === "undefined" || !chrome.storage) return [];
  const result = await chrome.storage.local.get(STORAGE_KEYS.deepResearchRuns);
  const raw = result[STORAGE_KEYS.deepResearchRuns];
  if (!Array.isArray(raw)) return [];
  return raw.map(deserializeRun);
}

/**
 * Find active run for a conversation (not complete/cancelled).
 * @param {Array} runs
 * @param {string} conversationId
 * @returns {object|null}
 */
export function findActiveRun(runs, conversationId) {
  return (
    runs.find(
      (r) =>
        r.conversationId === conversationId &&
        r.status !== "complete" &&
        r.status !== "cancelled"
    ) || null
  );
}

/**
 * Serialize a run for storage (strips large fields).
 */
function serializeRun(run) {
  return {
    id: run.id,
    conversationId: run.conversationId,
    status: run.status,
    plan: run.plan,
    sourceLedger: run.sourceLedger,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

/**
 * Deserialize a run from storage.
 */
function deserializeRun(raw) {
  return {
    id: String(raw.id || makeId()),
    conversationId: String(raw.conversationId || ""),
    status: RESEARCH_STATUSES.includes(raw.status) ? raw.status : "cancelled",
    plan: raw.plan || null,
    sourceLedger: Array.isArray(raw.sourceLedger) ? raw.sourceLedger : [],
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

/**
 * Build hidden approval message to send to DeepSeek.
 * @param {object} run
 * @returns {string}
 */
export function buildApprovalMessage(run) {
  return [
    `<BetterDeepSeek>`,
    `[BDS:DEEP_RESEARCH] Plan approved for run ${run.id}. Execute the following research plan:`,
    JSON.stringify(run.plan, null, 2),
    `Use <BDS:AUTO:SEARCH deepFetch="3"> tags for each search step and <BDS:AUTO:REQUEST_WEB_FETCH> for specific URLs.`,
    `After completing all research steps, output your findings using <BDS:DEEP_RESEARCH_REPORT runId="${run.id}">markdown</BDS:DEEP_RESEARCH_REPORT>.`,
    `</BetterDeepSeek>`,
  ].join("\n");
}

/**
 * Build hidden revision message to send to DeepSeek.
 * @param {object} run
 * @param {string} feedback
 * @returns {string}
 */
export function buildRevisionMessage(run, feedback) {
  return [
    `<BetterDeepSeek>`,
    `[BDS:DEEP_RESEARCH] Revision requested for run ${run.id}.`,
    `User feedback: ${feedback}`,
    `Please revise the research plan and output an updated plan using <BDS:DEEP_RESEARCH_PLAN runId="${run.id}">JSON</BDS:DEEP_RESEARCH_PLAN>.`,
    `</BetterDeepSeek>`,
  ].join("\n");
}

/**
 * Build the initial planning prompt injected when deep research mode is enabled.
 * @param {string} runId
 * @param {string} userQuery - the user's research question
 * @returns {string}
 */
export function buildPlanningPrompt(runId, userQuery) {
  return [
    `<BetterDeepSeek>`,
    `[BDS:DEEP_RESEARCH] Deep Research mode is enabled. The user has submitted a research request.`,
    `Run ID: ${runId}`,
    ``,
    `IMPORTANT: In this phase, you must ONLY produce a research plan. Do NOT browse or search yet.`,
    `Output your plan using: <BDS:DEEP_RESEARCH_PLAN runId="${runId}">JSON</BDS:DEEP_RESEARCH_PLAN>`,
    ``,
    `The JSON plan must include:`,
    `- "title": A short descriptive title for the research`,
    `- "steps": An array of research steps, each with:`,
    `  - "id": step number`,
    `  - "action": "search" or "fetch"`,
    `  - "query": the search query or URL to fetch`,
    `  - "purpose": why this step is needed`,
    ``,
    `User research question: ${userQuery}`,
    `</BetterDeepSeek>`,
  ].join("\n");
}
