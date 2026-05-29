// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import MessageOverlay from "../../../src/content/ui/MessageOverlay.svelte";
import { renderSvelte, flushUi } from "../../helpers/svelte.js";

describe("MessageOverlay integration", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders markdown text, ask-question info, and loading state", async () => {
    const questions = [
      { id: "q1", question: "Pick one", type: "test", options: ["A", "B"] }
    ];
    const { target, cleanup } = renderSvelte(MessageOverlay, {
      text: "# Heading\n\nParagraph",
      blocks: [{ name: "ask_question", content: JSON.stringify(questions), attrs: {} }],
      loading: true,
      loadingIndex: 2,
    });
    await flushUi();

    expect(target.querySelector("h1")?.textContent).toBe("Heading");
    expect(target.textContent).toContain("Clarifying questions asked.");
    expect(target.textContent).toContain("Pick one");
    expect(target.textContent).toContain("A");
    expect(target.textContent).toContain("B");
    expect(target.textContent).toContain("Working...");
    cleanup();
  });

  it("shows answers when bds-questions-answered event fires", async () => {
    const questions = [
      { id: "q1", question: "Pick one", type: "test", options: ["A", "B"] }
    ];
    const { target, cleanup } = renderSvelte(MessageOverlay, {
      blocks: [{ name: "ask_question", content: JSON.stringify(questions), attrs: {} }],
    });
    await flushUi();

    window.dispatchEvent(new CustomEvent("bds-questions-answered", {
      detail: { questions, answers: { q1: "A" } }
    }));
    await flushUi();

    expect(target.textContent).toContain("→ A");
    cleanup();
  });

  it("collapses outer by default when multiple questions", async () => {
    const questions = [
      { id: "q1", question: "First", type: "test" },
      { id: "q2", question: "Second", type: "input" }
    ];
    const { target, cleanup } = renderSvelte(MessageOverlay, {
      blocks: [{ name: "ask_question", content: JSON.stringify(questions), attrs: {} }],
    });
    await flushUi();

    expect(target.textContent).toContain("Clarifying questions asked.");
    expect(target.textContent).toContain("(2)");
    expect(target.textContent).not.toContain("First");
    expect(target.textContent).not.toContain("Second");
    cleanup();
  });
});
