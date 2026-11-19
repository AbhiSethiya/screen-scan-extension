# 🧠 MCQ Solver — Chrome Extension

> An invisible, shortcut-driven Chrome extension that reads MCQs on any webpage and shows the correct answer inline — powered by the **Groq AI API**.

---

## ✨ Features

- **Keyboard shortcut** — Press `Ctrl + Shift + Alt` anywhere to trigger the solver
- **Selected text mode** — Highlight an MCQ and press the shortcut to solve just that question
- **Full-page scan mode** — Press the shortcut with nothing selected to auto-detect and solve all MCQs on the page
- **Right-click context menu** — Right-click selected text → *🧠 Solve MCQ*, or right-click anywhere → *🔍 Scan Page for MCQs*
- **Inline tooltip UI** — Answers appear in a sleek floating tooltip near your selection; click anywhere to dismiss
- **One-time API key setup** — Prompted once, then stored locally via `chrome.storage`; never sent anywhere except Groq's API

---

## 📸 How It Works

```
User selects MCQ text (or not)
        ↓
Ctrl+Shift+Alt  OR  Right-click menu
        ↓
Content script sends text to Groq API (openai/gpt-oss-20b)
        ↓
Answer shown inline as a floating tooltip  ✅ B. Mitochondria — It produces ATP...
```

---

## 🚀 Installation

> This extension is not on the Chrome Web Store. Install it in **Developer Mode**.

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right)
4. Click **Load unpacked** and select the `mcq-solver-extension` folder
5. The extension icon will appear in your toolbar

---

## 🔑 API Key Setup

This extension uses the [Groq API](https://console.groq.com/keys) (free tier available).

1. Get a free API key at **https://console.groq.com/keys**
2. The first time you trigger the extension, a prompt will ask for your key
3. The key is saved locally to `chrome.storage.local` and never shared

> [!TIP]
> If your key is invalid or expired, the extension will clear it and prompt you to re-enter on the next use.

---

## ⌨️ Usage

| Action | How |
|---|---|
| Solve selected MCQ | Select text → `Ctrl + Shift + Alt` |
| Scan entire page | Press `Ctrl + Shift + Alt` with no selection |
| Solve from right-click | Select text → Right-click → *🧠 Solve MCQ* |
| Scan page from right-click | Right-click anywhere → *🔍 Scan Page for MCQs* |
| Dismiss the answer tooltip | Click anywhere on the page |

---

## 📁 Project Structure

```
mcq-solver-extension/
├── manifest.json       # Extension manifest (MV3)
├── background.js       # Service worker — registers context menu items
├── content.js          # Injected into all pages — handles shortcuts, tooltip, Groq API calls
├── content.css         # Styles for the floating answer tooltip
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🛠️ Technical Details

| Property | Value |
|---|---|
| Manifest Version | MV3 |
| AI Model | `openai/gpt-oss-20b` via Groq |
| Permissions | `activeTab`, `storage`, `contextMenus` |
| Host Permission | `https://api.groq.com/*` |
| Max page text sent | ~6,000 characters |
| Max tokens (response) | 512 |
| Temperature | 0.1 (deterministic answers) |

### Answer Format

The AI is prompted to respond in this concise format:

```
✅ B. Mitochondria — It is known as the powerhouse of the cell.
```

For multiple questions, they are numbered automatically.

---

## 🔒 Privacy

- Your API key is stored **only in your local browser** (`chrome.storage.local`)
- Page text is sent **only to `api.groq.com`** to generate answers — nowhere else
- No analytics, no tracking, no external servers

---

## 📄 License

MIT — free to use, modify, and distribute.
