# CodeToContent

> **Turn real code into real content—automatically.**

CodeToContent is a developer-first tool that connects to your GitHub repository, analyzes your actual development activity (commits, PRs, diffs), and uses **Gemini 3's long-context reasoning** to generate authentic, high-quality content for X (Twitter), LinkedIn, and technical blogs.

Unlike generic AI writers, CodeToContent adheres to one core principle:
**"If the code didn't happen, the content shouldn't exist."**

---

## ⚡ The Problem

Developers create immense value daily in the form of code, architectural decisions, and problem-solving. However, most of that value remains locked inside GitHub repositories.

*   **Valuable insights remain invisible:** "I shipped a complex refactor but didn't write about why."
*   **Content creation is high-friction:** Translating diffs to English requires time and storytelling skills.
*   **Inconsistency:** Developers want to build a personal brand but struggle to post regularly.

## 🚀 Core Functionality

CodeToContent automates the pipeline from `git push` to "Published":

1.  **GitHub OAuth Integration**: Securely connects to your repositories without storing your code.
2.  **Development Activity Analyzer**: Filters the noise. It identifies *meaningful* events—feature additions, complex bug fixes, and architectural overhauls—while ignoring basic maintenance or distinct commits.
3.  **Insight Extraction Engine**: The core intelligence layer. It doesn't just summarize; it *understands*.
4.  **Multi-Platform Generation**:
    *   **X (Twitter)**: Threads that hook readers and explain technical concepts concisely.
    *   **LinkedIn**: Professional, narrative-driven posts highlighting business value and lessons learned.
    *   **Blog Posts**: Structured outlines or full drafts for deep dives.

---

## 🧠 The Secret Sauce: Gemini 3 Integration

The heart of CodeToContent is **Gemini 3**. Standard LLMs struggle with the nuance of software development because they lack the context window to see the "whole picture."

**Why Gemini 3 is essential:**

*   **Long-Context Reasoning**: Gemini 3 effectively ingests entire commit histories, large diffs across multiple files, and PR comments simultaneously. It can link a change in `api/auth.ts` to a frontend update in `components/Login.tsx` to understand the *full feature*.
*   **Intent Extraction**: It infers *why* a change happened. It distinguishes between a "hacky fix" and a "strategic refactor" by analyzing the code structure itself.
*   **Audience Adaptation**: It translates raw technical logic (e.g., "Switched from polling to WebSockets") into audience-appropriate narratives (e.g., "How we reduced server load by 90% by rethinking our real-time architecture").

**The Pipeline:**
`Raw GitHub Data` → `Gemini 3 Context Window` → `Reasoning & Insight Extraction` → `Draft Content`

---

## 🛠️ Tech Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **Styling**: Vanilla CSS Modules (Clean, dark-themed, no-nonsense)
*   **AI**: Google Gemini 3 API
*   **Auth**: Auth.js (GitHub Provider)

## 🔮 Roadmap

*   [ ] **MVP**: GitHub connection + Single Repo Analysis + Content Generation.
*   [ ] **V2**: User activity dashboard & History.
*   [ ] **Future**: Automated scheduling and "Style Training" (teach Gemini your writing voice).
