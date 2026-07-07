(function () {
  const SYSTEM_PROMPT = `You are VOYAGER, a personal AI companion built for Rahul, a 15-year-old 9th grade student in Kalyan, Maharashtra who runs a space education YouTube channel called Galaxlore and works on independent AI/ML, physics, and hardware projects (like a science-fair plasma exhibit and KSP1 modding). He communicates in Hinglish (Hindi-English mix) and wants quick, clear, genuinely useful help across anything: homework doubts, coding, project planning, or just casual chat. Be concise, warm, and practical — like a sharp friend who's always available, not a generic assistant. Match his Hinglish tone naturally. Keep replies focused; avoid long lectures unless he asks for depth.`;

  const GEMINI_MODEL = "gemini-3.5-flash";
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  let history = JSON.parse(localStorage.getItem("voyager-history") || "[]");
  let objectives = JSON.parse(localStorage.getItem("voyager-objectives") || "[]");

  const logEl = document.getElementById("log");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const objList = document.getElementById("objList");
  const objInput = document.getElementById("objInput");
  const objAddBtn = document.getElementById("objAddBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveSettings = document.getElementById("saveSettings");
  const cancelSettings = document.getElementById("cancelSettings");

  // ---- Tabs ----
  const tabIndicator = document.getElementById("tabIndicator");
  const tabButtons = document.querySelectorAll(".tab");
  tabButtons.forEach((tab, i) => {
    tab.addEventListener("click", () => {
      tabButtons.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
      if (tabIndicator) tabIndicator.style.transform = `translateX(${i * 100}%)`;
    });
  });

  // ---- Starfield background ----
  (function initStarfield() {
    const canvas = document.getElementById("starfield");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let stars = [];
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.floor((canvas.width * canvas.height) / 6000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        baseAlpha: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.15 + 0.03,
        drift: Math.random() * 0.05 + 0.01,
      }));
    }
    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const twinkle = Math.sin(t * 0.001 * s.speed * 4 + s.phase) * 0.35 + 0.65;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140, 210, 255, ${s.baseAlpha * twinkle})`;
        ctx.fill();
        s.y += s.drift;
        if (s.y > canvas.height) s.y = 0;
      }
      requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(draw);
  })();

  // ---- Settings / API key ----
  function getApiKey() {
    return localStorage.getItem("voyager-gemini-key") || "";
  }
  function openSettings() {
    apiKeyInput.value = getApiKey();
    settingsModal.classList.add("active");
  }
  settingsBtn.addEventListener("click", openSettings);
  cancelSettings.addEventListener("click", () => settingsModal.classList.remove("active"));
  saveSettings.addEventListener("click", () => {
    localStorage.setItem("voyager-gemini-key", apiKeyInput.value.trim());
    settingsModal.classList.remove("active");
  });

  // ---- Chat rendering ----
  function renderLog() {
    logEl.innerHTML = "";
    if (history.length === 0) {
      logEl.innerHTML = '<div class="msg-empty">// no signal yet — say something to start //</div>';
      return;
    }
    history.forEach((m) => {
      const div = document.createElement("div");
      div.className = "msg " + (m.role === "user" ? "msg-user" : "msg-bot");
      const label = document.createElement("span");
      label.className = "msg-label";
      label.textContent = m.role === "user" ? "RAHUL" : "VOYAGER";
      div.appendChild(label);
      const body = document.createElement("div");
      body.textContent = m.content;
      div.appendChild(body);
      logEl.appendChild(div);
    });
    logEl.scrollTop = logEl.scrollHeight;
  }

  function saveHistory() {
    localStorage.setItem("voyager-history", JSON.stringify(history));
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      openSettings();
      return;
    }

    chatInput.value = "";
    sendBtn.disabled = true;
    history.push({ role: "user", content: text });
    renderLog();
    saveHistory();

    const thinkDiv = document.createElement("div");
    thinkDiv.className = "msg msg-bot";
    thinkDiv.innerHTML =
      '<span class="msg-label">VOYAGER</span><div class="typing-dots"><span></span><span></span><span></span></div>';
    logEl.appendChild(thinkDiv);
    logEl.scrollTop = logEl.scrollHeight;

    try {
      const contents = history.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: contents,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();
      const candidate = data.candidates && data.candidates[0];
      const parts = candidate && candidate.content && candidate.content.parts;
      const replyText = parts ? parts.map((p) => p.text || "").join("\n").trim() : "(no response)";
      history.push({ role: "assistant", content: replyText || "(empty response)" });
    } catch (e) {
      history.push({
        role: "assistant",
        content: "signal lost — " + e.message + "\n\ncheck your API key in settings (⚙), or try again.",
      });
      console.error(e);
    }

    renderLog();
    saveHistory();
    sendBtn.disabled = false;
    chatInput.focus();
  }

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // ---- Objectives ----
  function renderObjectives() {
    objList.innerHTML = "";
    if (objectives.length === 0) {
      objList.innerHTML = '<div class="obj-empty">// no objectives logged //</div>';
      return;
    }
    objectives.forEach((o, i) => {
      const row = document.createElement("div");
      row.className = "obj-item";

      const check = document.createElement("div");
      check.className = "obj-check" + (o.done ? " done" : "");
      check.textContent = o.done ? "✓" : "";
      check.addEventListener("click", () => {
        objectives[i].done = !objectives[i].done;
        renderObjectives();
        saveObjectives();
      });

      const txt = document.createElement("div");
      txt.className = "obj-text" + (o.done ? " done" : "");
      txt.textContent = o.text;

      const del = document.createElement("button");
      del.className = "obj-del";
      del.textContent = "✕";
      del.addEventListener("click", () => {
        objectives.splice(i, 1);
        renderObjectives();
        saveObjectives();
      });

      row.appendChild(check);
      row.appendChild(txt);
      row.appendChild(del);
      objList.appendChild(row);
    });
  }

  function saveObjectives() {
    localStorage.setItem("voyager-objectives", JSON.stringify(objectives));
  }

  function addObjective() {
    const text = objInput.value.trim();
    if (!text) return;
    objectives.push({ text, done: false });
    objInput.value = "";
    renderObjectives();
    saveObjectives();
  }
  objAddBtn.addEventListener("click", addObjective);
  objInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addObjective();
  });

  // ---- Init ----
  renderLog();
  renderObjectives();
  if (!getApiKey()) {
    setTimeout(openSettings, 400);
  }

  // ---- Service worker ----
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch((e) => console.log("SW failed", e));
    });
  }
})();
