web link :
https://mohammedali224.github.io/Smart-PR-Review-/

# 🚀 Smart PR Review Copilot
**Know your release risk before you merge.**

## 🛑 The Problem
Code review fatigue is real. In massive Pull Requests, reviewers often miss critical, catastrophic changes (like dropping a database column or altering authentication logic) buried under hundreds of lines of UI tweaks.

## 💡 The Solution
A lightweight, lightning-fast client-side tool that instantly analyzes Git diffs. It scores the release risk (Low, Medium, High) and highlights impacted business areas, ensuring safe deployments without relying on external servers or complex configurations.

## ✨ Key Features
- **Zero Dependencies:** Pure HTML/CSS/JS running entirely in your browser. No backend, no API keys, no setup.
- **Heuristic Risk Engine:** Instantly detects dangerous patterns (e.g., `DROP TABLE`, `localStorage`, `eval`).
- **Instant Visual Feedback:** Clear UI with color-coded risk assessment.

## 🚀 How to Run
1. Download or clone this repository.
2. Open `index.html` in any modern web browser.
3. Paste a raw Git diff (or add `.diff` to any GitHub PR URL to get the raw diff) and click **Assess Risk**.

## 🗺️ Future Roadmap
- Transform into an automated **GitHub Action** for CI/CD pipelines.
- Integrate deep LLM analysis for contextual code understanding.
- Enterprise B2B SaaS dashboard for release managers.
