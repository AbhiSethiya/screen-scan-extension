// MCQ Solver – invisible, shortcut-only, Groq API
(() => {
  if (window.__mcqSolverLoaded) return;
  window.__mcqSolverLoaded = true;

  let apiKey = '';
  let tooltip = null;

  // Load saved key once
  chrome.storage.local.get(['groqApiKey'], (r) => {
    if (r.groqApiKey) apiKey = r.groqApiKey;
  });

  // Ask only once ever
  function ensureKey() {
    if (apiKey) return true;
    const k = prompt('MCQ Solver — Enter your Groq API key (one-time setup).\nGet one free: https://console.groq.com/keys');
    if (k && k.trim()) {
      apiKey = k.trim();
      chrome.storage.local.set({ groqApiKey: apiKey });
      return true;
    }
    return false;
  }

  // ---- Ctrl + Shift + Alt ----
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.altKey) {
      e.preventDefault();
      if (!ensureKey()) return;

      const sel = window.getSelection();
      const text = sel.toString().trim();

      if (text) {
        // Selected text mode
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        solve(text, rect);
      } else {
        // Full-page scan mode — grab visible text
        const pageText = getVisibleText();
        if (!pageText) {
          showTooltip('⚠️ No readable text found on this page.', centerRect(), false);
          return;
        }
        showTooltip('🔍 Scanning entire page…', centerRect(), true);
        solve(pageText, centerRect());
      }
    }
  });

  // ---- Click to dismiss ----
  document.addEventListener('click', () => {
    if (tooltip) { tooltip.remove(); tooltip = null; }
  });

  // ---- Right-click menu ----
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === 'solveText') {
      if (!ensureKey()) { sendResponse({ ok: false }); return; }

      const sel = window.getSelection();
      const range = sel.rangeCount ? sel.getRangeAt(0) : null;
      const rect = range
        ? range.getBoundingClientRect()
        : centerRect();

      solve(msg.text, rect);
      sendResponse({ ok: true });
    } else if (msg.action === 'scanPage') {
      if (!ensureKey()) { sendResponse({ ok: false }); return; }

      const pageText = getVisibleText();
      if (!pageText) {
        showTooltip('⚠️ No readable text found on this page.', centerRect(), false);
        sendResponse({ ok: false });
        return;
      }
      solve(pageText, centerRect());
      sendResponse({ ok: true });
    }
  });

  // ---- Tooltip ----
  function showTooltip(content, rect, isLoading) {
    if (tooltip) tooltip.remove();
    tooltip = document.createElement('div');
    tooltip.id = 'mcq-answer';
    if (isLoading) tooltip.classList.add('loading');
    tooltip.textContent = content;
    document.body.appendChild(tooltip);

    const pad = 8;
    let top = rect.bottom + pad;
    let left = rect.left;
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    if (left + tw > window.innerWidth - pad) left = window.innerWidth - tw - pad;
    if (left < pad) left = pad;
    if (top + th > window.innerHeight - pad) top = rect.top - th - pad;
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
  }

  // ---- Solve ----
  async function solve(text, rect) {
    showTooltip('⏳ Thinking…', rect, true);
    try {
      const answer = await callGroq(text);
      showTooltip(answer, rect, false);
    } catch (err) {
      showTooltip('❌ ' + err.message, rect, false);
    }
  }

  // ---- Helpers ----
  function centerRect() {
    return {
      left: window.innerWidth / 2 - 150,
      top: 80,
      bottom: 80
    };
  }

  function getVisibleText() {
    // Grab text from the main content area, filtering out scripts/styles/hidden elements
    const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'IFRAME', 'CANVAS', 'VIDEO', 'AUDIO', 'IMG']);
    const lines = [];

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node.textContent.trim();
        if (t) lines.push(t);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (skip.has(node.tagName)) return;

      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

      for (const child of node.childNodes) walk(child);
    }

    // Prefer <main> or <article>, fall back to <body>
    const root = document.querySelector('main') || document.querySelector('article') || document.body;
    walk(root);

    let text = lines.join(' ');
    // Cap at ~6000 chars to stay within token limits
    if (text.length > 6000) text = text.slice(0, 6000) + '…';
    return text;
  }

  // ---- Groq API ----
  async function callGroq(questionText) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{
          role: 'user',
          content: `You are an expert MCQ solver. For each MCQ in the text below, give ONLY the correct answer in this format:
✅ [Letter]. [Answer] — [One-line reason]

If multiple questions, number them. Be very concise.

${questionText}`
        }],
        temperature: 0.1,
        max_tokens: 512
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) {
        apiKey = '';
        chrome.storage.local.remove('groqApiKey');
        throw new Error('Invalid API key — press Ctrl+Shift+Alt to re-enter');
      }
      throw new Error(err.error?.message || `API error (${res.status})`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No answer';
  }
})();
