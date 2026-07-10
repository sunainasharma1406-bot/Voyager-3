(function () {
  const SYSTEM_PROMPT = `You are VOYAGER, a personal AI companion built for Rahul, a 15-year-old 9th grade student in Kalyan, Maharashtra who runs a space education YouTube channel called Galaxlore and works on independent AI/ML, physics, and hardware projects (like a science-fair plasma exhibit and KSP1 modding). He communicates in Hinglish (Hindi-English mix) and wants quick, clear, genuinely useful help across anything: homework doubts, coding, project planning, or just casual chat. Be concise, warm, and practical — like a sharp friend who's always available, not a generic assistant. Match his Hinglish tone naturally. Keep replies short and conversational when spoken aloud may be used.`;

  const GEMINI_MODEL = "gemini-3.5-flash";
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  let history = JSON.parse(localStorage.getItem("voyager-history") || "[]");
  let objectives = JSON.parse(localStorage.getItem("voyager-objectives") || "[]");
  let pendingImage = null;
  let autoSpeak = localStorage.getItem("voyager-autospeak") === "1";
  let isRecording = false;

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
  const attachBtn = document.getElementById("attachBtn");
  const fileInput = document.getElementById("fileInput");
  const imagePreviewBar = document.getElementById("imagePreviewBar");
  const micBtn = document.getElementById("micBtn");
  const speakToggleBtn = document.getElementById("speakToggleBtn");

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
      const count = Math.floor((canvas.width * canvas.height) / 7000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        baseAlpha: Math.random() * 0.5 + 0.15,
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

  // ---- Plasma orb (signature element) ----
  (function initPlasmaOrb() {
    const canvas = document.getElementById("plasmaOrb");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = W * 0.42;
    const filaments = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      filaments.push({
        angle: (i / n) * Math.PI * 2,
        wobble: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.6,
        len: 0.75 + Math.random() * 0.22,
      });
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      core.addColorStop(0, "rgba(255,255,255,0.95)");
      core.addColorStop(0.15, "rgba(180,240,255,0.9)");
      core.addColorStop(0.4, "rgba(51,225,255,0.55)");
      core.addColorStop(0.75, "rgba(60,90,200,0.35)");
      core.addColorStop(1, "rgba(20,20,50,0.15)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < filaments.length; i++) {
        const f = filaments[i];
        const a = f.angle + Math.sin(t * 0.0003 * f.speed + f.wobble) * 0.4;
        const endR = R * f.len * (0.85 + 0.15 * Math.sin(t * 0.0006 * f.speed + f.wobble * 2));
        const midR = endR * 0.5;
        const midA = a + Math.sin(t * 0.0009 + f.wobble) * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const mx = cx + Math.cos(midA) * midR + Math.sin(t * 0.002 + i) * 4;
        const my = cy + Math.sin(midA) * midR + Math.cos(t * 0.002 + i) * 4;
        const ex = cx + Math.cos(a) * endR;
        const ey = cy + Math.sin(a) * endR;
        ctx.quadraticCurveTo(mx, my, ex, ey);
        ctx.strokeStyle = "rgba(150,230,255,0.55)";
        ctx.lineWidth = 1.4;
        ctx.shadowColor = "#33E1FF";
        ctx.shadowBlur = 6;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180,230,255,0.4)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#33E1FF";
      ctx.shadowBlur = 8;
      ctx.stroke();

      const rim = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, 0, cx, cy, R * 1.15);
      rim.addColorStop(0, "rgba(255,255,255,0.25)");
      rim.addColorStop(0.5, "rgba(255,255,255,0)");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      requestAnimationFrame(draw);
    }
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

  // ---- Image attach ----
  attachBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pendingImage = { dataUrl: reader.result, mimeType: file.type };
      renderImagePreview();
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
  });
  function renderImagePreview() {
    imagePreviewBar.innerHTML = "";
    if (!pendingImage) {
      imagePreviewBar.classList.remove("active");
      return;
    }
    imagePreviewBar.classList.add("active");
    const img = document.createElement("img");
    img.src = pendingImage.dataUrl;
    const removeBtn = document.createElement("button");
    removeBtn.className = "image-preview-remove";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => {
      pendingImage = null;
      renderImagePreview();
    });
    imagePreviewBar.appendChild(img);
    imagePreviewBar.appendChild(removeBtn);
  }

  // ---- Voice input (speech-to-text) ----
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognizer = null;
  if (SpeechRecognitionAPI) {
    recognizer = new SpeechRecognitionAPI();
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.lang = "en-IN";
    recognizer.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      chatInput.value = transcript;
    };
    recognizer.onend = () => {
      isRecording = false;
      micBtn.classList.remove("recording");
    };
    recognizer.onerror = () => {
      isRecording = false;
      micBtn.classList.remove("recording");
    };
  }
  micBtn.addEventListener("click", () => {
    if (!recognizer) {
      alert("Voice input isn't supported in this browser. Try Chrome.");
      return;
    }
    if (isRecording) {
      recognizer.stop();
      isRecording = false;
      micBtn.classList.remove("recording");
    } else {
      recognizer.start();
      isRecording = true;
      micBtn.classList.add("recording");
    }
  });

  // ---- Voice output (text-to-speech) ----
  function updateSpeakIcon() {
    speakToggleBtn.textContent = autoSpeak ? "🔊" : "🔇";
    speakToggleBtn.classList.toggle("active", autoSpeak);
  }
  speakToggleBtn.addEventListener("click", () => {
    autoSpeak = !autoSpeak;
    localStorage.setItem("voyager-autospeak", autoSpeak ? "1" : "0");
    updateSpeakIcon();
    if (!autoSpeak) window.speechSynthesis.cancel();
  });
  updateSpeakIcon();
  function speak(text) {
    if (!autoSpeak || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    utter.rate = 1.02;
    window.speechSynthesis.speak(utter);
  }

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
      if (m.content) {
        const body = document.createElement("div");
        body.textContent = m.content;
        div.appendChild(body);
      }
      if (m.image) {
        const img = document.createElement("img");
        img.className = "msg-image";
        img.src = m.image;
        div.appendChild(img);
      }
      logEl.appendChild(div);
    });
    logEl.scrollTop = logEl.scrollHeight;
  }

  function saveHistory() {
    localStorage.setItem("voyager-history", JSON.stringify(history));
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text && !pendingImage) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      openSettings();
      return;
    }

    const imageToSend = pendingImage;
    chatInput.value = "";
    pendingImage = null;
    renderImagePreview();
    sendBtn.disabled = true;

    history.push({ role: "user", content: text, image: imageToSend ? imageToSend.dataUrl : null });
    renderLog();
    saveHistory();

    const thinkDiv = document.createElement("div");
    thinkDiv.className = "msg msg-bot";
    thinkDiv.innerHTML =
      '<span class="msg-label">VOYAGER</span><div class="typing-dots"><span></span><span></span><span></span></div>';
    logEl.appendChild(thinkDiv);
    logEl.scrollTop = logEl.scrollHeight;

    try {
      const contents = history.map((m) => {
        const parts = [];
        if (m.content) parts.push({ text: m.content });
        if (m.image) {
          const base64 = m.image.split(",")[1];
          const mime = m.image.substring(5, m.image.indexOf(";"));
          parts.push({ inline_data: { mime_type: mime, data: base64 } });
        }
        return { role: m.role === "user" ? "user" : "model", parts: parts };
      });

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
      speak(replyText);
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
