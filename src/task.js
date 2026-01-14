/* task.js
   Single JS that powers BOTH tabs:
   - Tasks: PT-001, per-task ST-01
   - Jobs: JB-001, per-job FU-01 follow-ups
   Server-synced with per-user auth, export/import JSON.
*/

(() => {
  // ---------- DOM ----------
  const tabTasks = document.getElementById("tabTasks");
  const tabJobs = document.getElementById("tabJobs");
  const pageTitle = document.getElementById("pageTitle");
  const metaLine = document.getElementById("metaLine");

  const addBtn = document.getElementById("addBtn");
  const toggleCompletedBtn = document.getElementById("toggleCompleted");
  const toggleCompletedIcon = document.getElementById("toggleCompletedIcon");

  const filterSelect = document.getElementById("filterSelect");
  const sortSelect = document.getElementById("sortSelect");
  const searchBox = document.getElementById("searchBox");

  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const clearBtn = document.getElementById("clearBtn");
  const importFile = document.getElementById("importFile");

  const taskFormEl = document.getElementById("taskForm");
  const listRoot = document.getElementById("listRoot");

  const authSection = document.getElementById("authSection");
  const authTitle = document.getElementById("authTitle");
  const authModeLogin = document.getElementById("authModeLogin");
  const authModeSignup = document.getElementById("authModeSignup");
  const authForm = document.getElementById("authForm");
  const authSubmit = document.getElementById("authSubmit");
  const authUsername = document.getElementById("authUsername");
  const authPassword = document.getElementById("authPassword");
  const authError = document.getElementById("authError");
  const appSection = document.getElementById("appSection");
  const saveStateEl = document.getElementById("saveState");
  const authInfo = document.getElementById("authInfo");
  const logoutBtn = document.getElementById("logoutBtn");

  // ---------- Settings ----------
  const TZ = "Asia/Kolkata";
  const IST_OFFSET_MS = 330 * 60 * 1000;

  // ---------- Defaults ----------
  const DATA_VERSION = 1;
  const DEFAULT_UI = {
    showCompleted: true,
    filterMode: "all",
    sortMode: "created",
    searchQuery: ""
  };

  // ---------- State ----------
  let activeTab = "tasks"; // "tasks" | "jobs"

  let showCompleted = true;
  let filterMode = "all";
  let sortMode = "created";
  let searchQuery = "";

  let selectedId = null;
  let editingId = null;

  let tasks = [];
  let jobs = [];

  let authUser = null;
  let authMode = "login";
  let hasLoadedData = false;

  let taskSeq = 0;
  let jobSeq = 0;

  const uiState = {
    tasks: { ...DEFAULT_UI },
    jobs: { ...DEFAULT_UI }
  };

  let saveTimer = null;
  let isSaving = false;
  let saveQueued = false;
  let lastSavedPayload = "";

  // ---------- Icons ----------
  const ICON_EYE = '<path d="M12 6a9.77 9.77 0 0 0-10 6 9.77 9.77 0 0 0 20 0A9.77 9.77 0 0 0 12 6zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>';
  const ICON_EYE_OFF = '<path d="M12 6a9.77 9.77 0 0 0-10 6 9.77 9.77 0 0 0 20 0A9.77 9.77 0 0 0 12 6zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/><path d="M3 3l18 18-1.4 1.4L1.6 4.4 3 3z"/>';

  const ICON_CHEV_DOWN = `<svg viewBox="0 0 24 24" class="h-4 w-4 fill-current text-slate-100/90" aria-hidden="true"><path d="M7 10l5 5 5-5H7z"/></svg>`;
  const ICON_CHEV_UP = `<svg viewBox="0 0 24 24" class="h-4 w-4 fill-current text-slate-100/90" aria-hidden="true"><path d="M7 14l5-5 5 5H7z"/></svg>`;
  const ICON_EDIT = `<svg viewBox="0 0 24 24" class="h-4 w-4 fill-current text-slate-100/90" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l9.06-9.06.92.92-9.06 9.06zM20.71 7.04a1.003 1.003 0 0 0 0-1.42L18.37 3.29a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z"/></svg>`;
  const ICON_TRASH = `<svg viewBox="0 0 24 24" class="h-4 w-4 fill-current text-slate-100/90" aria-hidden="true"><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/></svg>`;
  const ICON_LINK = `<svg viewBox="0 0 24 24" class="h-4 w-4 fill-current text-slate-100/90" aria-hidden="true"><path d="M3.9 12a5 5 0 015-5h4v2h-4a3 3 0 100 6h4v2h-4a5 5 0 01-5-5zm7.1 1h2v-2h-2v2zm4-6h4a5 5 0 010 10h-4v-2h4a3 3 0 000-6h-4V7z"/></svg>`;

  // ---------- Utils ----------
  function pad(n) { return String(n).padStart(2, "0"); }

  function iconBtn(svg, title, danger = false) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = title;
    btn.setAttribute("aria-label", title);
    btn.className = [
      "h-9 w-9 inline-flex items-center justify-center rounded-lg border",
      danger ? "border-red-300/30 bg-red-500/10 hover:bg-red-500/15" : "border-slate-700 bg-slate-900/40 hover:bg-slate-900/60",
      "active:translate-y-px"
    ].join(" ");
    btn.innerHTML = svg;
    return btn;
  }

  function utcMsToIstInput(ms) {
    if (ms == null) return "";
    const dt = new Date(ms + IST_OFFSET_MS);
    const y = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dt.getUTCDate()).padStart(2, "0");
    const h = String(dt.getUTCHours()).padStart(2, "0");
    const mi = String(dt.getUTCMinutes()).padStart(2, "0");
    return `${y}-${mo}-${d}T${h}:${mi}`;
  }

  function istInputToUtcMs(val) {
    if (!val) return null;
    const m = val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const h = Number(m[4]);
    const mi = Number(m[5]);
    const asUtc = Date.UTC(y, mo, d, h, mi, 0);
    return asUtc - IST_OFFSET_MS;
  }

  function fmtIstDateTime(ms) {
    if (ms == null) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
      hour12: false
    }).format(new Date(ms)).replace(",", "");
  }

  function istYmd(ms) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date(ms));
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  }

  function fmtDuration(ms) {
    const sign = ms < 0 ? -1 : 1;
    const abs = Math.abs(ms);
    const totalSec = Math.floor(abs / 1000);
    const days = Math.floor(totalSec / 86400);
    const rem = totalSec % 86400;
    const hours = Math.floor(rem / 3600);
    const minutes = Math.floor((rem % 3600) / 60);
    const seconds = rem % 60;
    const base = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    return sign < 0 ? `-${base}` : base;
  }

  function roundUpToNext15MinIst(nowMs) {
    const d = new Date(nowMs + IST_OFFSET_MS);
    const y = d.getUTCFullYear();
    const mo = d.getUTCMonth();
    const da = d.getUTCDate();
    let h = d.getUTCHours();
    let m = d.getUTCMinutes();
    const next = Math.ceil(m / 15) * 15;
    if (next === 60) { h += 1; m = 0; } else { m = next; }
    const asUtc = Date.UTC(y, mo, da, h, m, 0);
    return asUtc - IST_OFFSET_MS;
  }

  function eodUtcMsForIstDateFromUtc(startUtcMs) {
    const ist = new Date(startUtcMs + IST_OFFSET_MS);
    const y = ist.getUTCFullYear();
    const mo = ist.getUTCMonth();
    const d = ist.getUTCDate();
    return Date.UTC(y, mo, d, 18, 29, 0); // 23:59 IST
  }

  // ---------- ID generators ----------
  function maxSeq(list, prefix) {
    let max = 0;
    const re = new RegExp(`^${prefix}-(\\d+)$`);
    for (const item of list) {
      const code = item.code || item.id || "";
      const m = code.match(re);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return max;
  }

  function ensureTaskSeq() {
    taskSeq = Math.max(taskSeq, maxSeq(tasks, "PT"));
  }

  function ensureJobSeq() {
    jobSeq = Math.max(jobSeq, maxSeq(jobs, "JB"));
  }

  function nextIdPT() {
    ensureTaskSeq();
    taskSeq += 1;
    return `PT-${String(taskSeq).padStart(3, "0")}`;
  }

  function ensureSubSeq(item) {
    const subs = Array.isArray(item.subtasks) ? item.subtasks : [];
    let max = Number(item.subSeq || 0);
    for (const s of subs) {
      const code = s.code || s.id || "";
      const m = code.match(/^ST-(\d{2})$/);
      if (m) max = Math.max(max, Number(m[1]));
    }
    item.subSeq = max;
  }

  function nextSubCode(task) {
    ensureSubSeq(task);
    task.subSeq = Number(task.subSeq || 0) + 1;
    return `ST-${String(task.subSeq).padStart(2, "0")}`;
  }

  function nextIdJB() {
    ensureJobSeq();
    jobSeq += 1;
    return `JB-${String(jobSeq).padStart(3, "0")}`;
  }

  function ensureFollowSeq(job) {
    const subs = Array.isArray(job.followUps) ? job.followUps : [];
    let max = Number(job.followSeq || 0);
    for (const s of subs) {
      const code = s.code || s.id || "";
      const m = code.match(/^FU-(\d{2})$/);
      if (m) max = Math.max(max, Number(m[1]));
    }
    job.followSeq = max;
  }

  function nextFollowUpCode(job) {
    ensureFollowSeq(job);
    job.followSeq = Number(job.followSeq || 0) + 1;
    return `FU-${String(job.followSeq).padStart(2, "0")}`;
  }

  // ---------- Storage ----------
  function loadUI(which) {
    return { ...DEFAULT_UI, ...(uiState[which] || {}) };
  }

  function saveUI(which, ui) {
    uiState[which] = { ...DEFAULT_UI, ...(ui || {}) };
  }

  function setSaveState(text, tone = "muted") {
    if (!saveStateEl) return;
    let color = "text-slate-500";
    if (tone === "ok") color = "text-emerald-300";
    if (tone === "warn") color = "text-amber-300";
    if (tone === "error") color = "text-red-300";
    saveStateEl.className = `text-xs ${color}`;
    saveStateEl.textContent = text;
  }

  function showAuthError(message) {
    if (!authError) return;
    authError.textContent = message || "";
    authError.classList.toggle("hidden", !message);
  }

  function setAuthMode(mode) {
    authMode = mode;
    const active = ["bg-slate-950/70", "border", "border-slate-700", "text-slate-100"];
    const idle = ["text-slate-300"];

    if (authModeLogin) {
      authModeLogin.classList.remove(...active, ...idle);
      authModeLogin.classList.add(...(mode === "login" ? active : idle));
    }

    if (authModeSignup) {
      authModeSignup.classList.remove(...active, ...idle);
      authModeSignup.classList.add(...(mode === "signup" ? active : idle));
    }

    if (authTitle) authTitle.textContent = mode === "login" ? "Sign in" : "Create account";
    if (authSubmit) authSubmit.textContent = mode === "login" ? "Sign in" : "Create account";
    if (authPassword) authPassword.autocomplete = mode === "login" ? "current-password" : "new-password";
    showAuthError("");
  }

  function setAuthUI(user) {
    authUser = user || null;
    if (authSection) authSection.classList.toggle("hidden", !!authUser);
    if (appSection) appSection.classList.toggle("hidden", !authUser);
    if (authInfo) authInfo.textContent = authUser ? `Signed in as ${authUser}` : "Signed out";
    if (logoutBtn) logoutBtn.classList.toggle("hidden", !authUser);
  }

  async function apiFetch(path, options = {}) {
    const opts = {
      method: "GET",
      credentials: "include",
      headers: {},
      ...options
    };

    if (opts.body && typeof opts.body === "object") {
      opts.body = JSON.stringify(opts.body);
    }

    if (opts.body && !opts.headers["Content-Type"]) {
      opts.headers["Content-Type"] = "application/json";
    }

    const res = await fetch(path, opts);
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      const message = data && data.error ? data.error : `Request failed (${res.status})`;
      throw new Error(message);
    }

    return data;
  }

  function buildPayload() {
    ensureTaskSeq();
    ensureJobSeq();
    return {
      version: DATA_VERSION,
      tasks,
      jobs,
      ui: uiState,
      seq: { task: taskSeq, job: jobSeq }
    };
  }

  function scheduleSave() {
    if (!authUser || !hasLoadedData) return;
    setSaveState("Saving...", "muted");
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      pushSave();
    }, 800);
  }

  async function pushSave() {
    if (!authUser || !hasLoadedData) return;
    if (isSaving) {
      saveQueued = true;
      return;
    }
    isSaving = true;

    const payload = buildPayload();
    const payloadJson = JSON.stringify(payload);
    if (payloadJson === lastSavedPayload) {
      isSaving = false;
      setSaveState("Saved", "ok");
      return;
    }

    try {
      await apiFetch("/api/data", { method: "PUT", body: payloadJson });
      lastSavedPayload = payloadJson;
      setSaveState("Saved", "ok");
    } catch (err) {
      setSaveState("Save failed", "error");
      console.error(err);
    } finally {
      isSaving = false;
      if (saveQueued) {
        saveQueued = false;
        pushSave();
      }
    }
  }

  function applyRemoteData(data) {
    const safe = data && typeof data === "object" ? data : {};
    tasks = Array.isArray(safe.tasks) ? safe.tasks : [];
    jobs = Array.isArray(safe.jobs) ? safe.jobs : [];

    const ui = safe.ui && typeof safe.ui === "object" ? safe.ui : {};
    uiState.tasks = { ...DEFAULT_UI, ...(ui.tasks || {}) };
    uiState.jobs = { ...DEFAULT_UI, ...(ui.jobs || {}) };

    const seq = safe.seq && typeof safe.seq === "object" ? safe.seq : {};
    taskSeq = Number.isFinite(seq.task) ? seq.task : 0;
    jobSeq = Number.isFinite(seq.job) ? seq.job : 0;
    ensureTaskSeq();
    ensureJobSeq();

    activeTab = "tasks";
    loadTabState("tasks");
    closeForm();
    selectedId = tasks.length ? tasks[0].id : null;
    render();
  }

  async function loadRemoteData() {
    if (!authUser) return;
    setSaveState("Loading...", "muted");
    const data = await apiFetch("/api/data");
    applyRemoteData(data);
    hasLoadedData = true;
    lastSavedPayload = JSON.stringify(buildPayload());
    setSaveState("Saved", "ok");
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    showAuthError("");

    const username = (authUsername && authUsername.value || "").trim();
    const password = (authPassword && authPassword.value || "");

    if (!username || !password) {
      showAuthError("Enter a username and password.");
      return;
    }

    if (password.length < 8) {
      showAuthError("Password must be at least 8 characters.");
      return;
    }

    if (authSubmit) authSubmit.disabled = true;

    let data;
    try {
      const route = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      data = await apiFetch(route, { method: "POST", body: { username, password } });
    } catch (err) {
      showAuthError(err.message || "Sign in failed.");
      setSaveState("Not signed in", "muted");
      if (authSubmit) authSubmit.disabled = false;
      return;
    }

    if (authSubmit) authSubmit.disabled = false;
    setAuthUI(data && data.username ? data.username : username);
    if (authForm) authForm.reset();

    try {
      await loadRemoteData();
    } catch (err) {
      setSaveState("Load failed", "error");
      console.error(err);
    }
  }

  async function handleLogout() {
    if (!authUser) return;
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }

    tasks = [];
    jobs = [];
    selectedId = null;
    editingId = null;
    hasLoadedData = false;
    lastSavedPayload = "";
    setAuthUI(null);
    setSaveState("Not signed in", "muted");
    render();
  }

  async function bootstrapAuth() {
    setSaveState("Checking session...", "muted");
    setAuthMode("login");
    try {
      const data = await apiFetch("/api/auth/me");
      if (data && data.username) {
        setAuthUI(data.username);
        await loadRemoteData();
        return;
      }
    } catch {
      // not signed in
    }

    setAuthUI(null);
    setSaveState("Not signed in", "muted");
  }

  // ---------- Shared filtering ----------
  function dueState(endUtcMs, done) {
    const now = Date.now();
    if (endUtcMs == null) return "noDue";
    if (done) return "noDue";
    const remaining = endUtcMs - now;
    if (remaining < 0) return "overdue";
    const today = istYmd(now);
    const endDay = istYmd(endUtcMs);
    if (endDay === today) return "dueToday";
    return "upcoming";
  }

  function borderClass(state) {
    if (state === "overdue") return "border-red-400/40 shadow-[inset_0_0_0_1px_rgba(255,60,60,0.15)]";
    if (state === "dueToday") return "border-amber-300/50 shadow-[inset_0_0_0_1px_rgba(255,200,90,0.15)]";
    if (state === "upcoming") return "border-sky-300/30 shadow-[inset_0_0_0_1px_rgba(90,200,255,0.10)]";
    return "border-slate-700/80";
  }

  // ---------- TASKS ----------
  function taskStatus(task) {
    const now = Date.now();
    const start = task.startUtcMs ?? null;
    const end = task.endUtcMs ?? null;
    if (start != null && now < start) return `Starts in ${fmtDuration(start - now)}`;
    if (end != null) {
      const rem = end - now;
      return rem >= 0 ? `Ends in ${fmtDuration(rem)}` : `Overdue by ${fmtDuration(-rem)}`;
    }
    return "No end time";
  }

  function countDone(subs) {
    const total = subs.length;
    const done = subs.filter(s => s.done).length;
    return { done, total };
  }

  function updateTaskDoneFromSubtasks(task) {
    if (!task.subtasks || task.subtasks.length === 0) return;
    task.done = task.subtasks.every(s => s.done);
  }

  function buildTaskForm(task) {
    taskFormEl.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs text-slate-400 font-bold uppercase tracking-wide">${task ? `Edit ${task.code}` : "New task"}</div>
        <button id="closeForm" type="button"
          class="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs font-extrabold hover:bg-slate-900/60 active:translate-y-px">
          Close
        </button>
      </div>

      <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div class="md:col-span-1">
          <label class="block text-xs text-slate-400 font-semibold mb-1" for="fTitle">Task title</label>
          <input id="fTitle" type="text"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500"
            placeholder="e.g., Portfolio case study polish" />
        </div>

        <div>
          <label class="block text-xs text-slate-400 font-semibold mb-1" for="fStart">Start (IST)</label>
          <input id="fStart" type="datetime-local"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-sm text-slate-100 outline-none focus:border-slate-500" />
        </div>

        <div>
          <label class="block text-xs text-slate-400 font-semibold mb-1" for="fEnd">End (IST)</label>
          <input id="fEnd" type="datetime-local"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-sm text-slate-100 outline-none focus:border-slate-500" />
        </div>
      </div>

      <div class="mt-3 flex justify-end">
        <button id="saveForm" type="button"
          class="rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-extrabold hover:bg-slate-900/60 active:translate-y-px">
          Save
        </button>
      </div>
    `;

    const close = document.getElementById("closeForm");
    const save = document.getElementById("saveForm");
    const fTitle = document.getElementById("fTitle");
    const fStart = document.getElementById("fStart");
    const fEnd = document.getElementById("fEnd");

    fTitle.value = task?.title || "";
    fStart.value = utcMsToIstInput(task?.startUtcMs ?? null);
    fEnd.value = utcMsToIstInput(task?.endUtcMs ?? null);

    close.addEventListener("click", closeForm);

    save.addEventListener("click", () => {
      const title = (fTitle.value || "").trim();
      let startUtcMs = istInputToUtcMs(fStart.value);
      let endUtcMs = istInputToUtcMs(fEnd.value);

      if (!title) { alert("Enter a title."); return; }

      if (startUtcMs == null) startUtcMs = roundUpToNext15MinIst(Date.now());
      if (endUtcMs == null) endUtcMs = eodUtcMsForIstDateFromUtc(startUtcMs);
      if (endUtcMs < startUtcMs) { alert("End must be after start."); return; }

      if (task) {
        task.title = title;
        task.startUtcMs = startUtcMs;
        task.endUtcMs = endUtcMs;
      } else {
        const code = nextIdPT();
        tasks.unshift({
          id: code, code,
          title,
          done: false,
          expanded: true,
          startUtcMs,
          endUtcMs,
          subtasks: [],
          subSeq: 0
        });
        selectedId = code;
      }

      persist();
      render();
      closeForm();
    });

    taskFormEl.classList.remove("hidden");
    fTitle.focus();
  }

  // ---------- JOBS ----------
  const JOB_STATUSES = [
    "Wishlist",
    "Applied",
    "HR Screen",
    "Interview",
    "Assignment",
    "Offer",
    "Rejected",
    "Ghosted"
  ];

  function jobStatusPill(status) {
    const map = {
      Wishlist: "border-slate-700/70 bg-slate-900/40 text-slate-200",
      Applied: "border-sky-300/30 bg-sky-500/10 text-sky-200",
      "HR Screen": "border-amber-300/30 bg-amber-500/10 text-amber-200",
      Interview: "border-violet-300/30 bg-violet-500/10 text-violet-200",
      Assignment: "border-emerald-300/30 bg-emerald-500/10 text-emerald-200",
      Offer: "border-emerald-300/40 bg-emerald-500/15 text-emerald-200",
      Rejected: "border-red-300/30 bg-red-500/10 text-red-200",
      Ghosted: "border-slate-700/50 bg-slate-950/30 text-slate-400",
    };
    return map[status] || map.Wishlist;
  }

  function buildJobForm(job) {
    taskFormEl.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs text-slate-400 font-bold uppercase tracking-wide">${job ? `Edit ${job.code}` : "New job application"}</div>
        <button id="closeForm" type="button"
          class="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs font-extrabold hover:bg-slate-900/60 active:translate-y-px">
          Close
        </button>
      </div>

      <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label class="block text-xs text-slate-400 font-semibold mb-1" for="jCompany">Company</label>
          <input id="jCompany" type="text"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500"
            placeholder="e.g., Acme Corp" />
        </div>

        <div>
          <label class="block text-xs text-slate-400 font-semibold mb-1" for="jRole">Role</label>
          <input id="jRole" type="text"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500"
            placeholder="e.g., UI/UX Designer" />
        </div>

        <div>
          <label class="block text-xs text-slate-400 font-semibold mb-1" for="jStatus">Status</label>
          <select id="jStatus"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-sm font-extrabold text-slate-100 outline-none focus:border-slate-500">
            ${JOB_STATUSES.map(s => `<option value="${s}">${s}</option>`).join("")}
          </select>
        </div>

        <div>
          <label class="block text-xs text-slate-400 font-semibold mb-1" for="jLink">Link (optional)</label>
          <input id="jLink" type="url"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500"
            placeholder="Job posting URL" />
        </div>

        <div>
          <label class="block text-xs text-slate-400 font-semibold mb-1" for="jApplied">Applied (IST)</label>
          <input id="jApplied" type="datetime-local"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-sm text-slate-100 outline-none focus:border-slate-500" />
        </div>

        <div>
          <label class="block text-xs text-slate-400 font-semibold mb-1" for="jNext">Next follow-up (IST)</label>
          <input id="jNext" type="datetime-local"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-sm text-slate-100 outline-none focus:border-slate-500" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-xs text-slate-400 font-semibold mb-1" for="jNotes">Notes</label>
          <textarea id="jNotes" rows="3"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500"
            placeholder="Contacts, recruiter name, what you sent, etc."></textarea>
        </div>
      </div>

      <div class="mt-3 flex justify-end">
        <button id="saveForm" type="button"
          class="rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-extrabold hover:bg-slate-900/60 active:translate-y-px">
          Save
        </button>
      </div>
    `;

    const close = document.getElementById("closeForm");
    const save = document.getElementById("saveForm");

    const jCompany = document.getElementById("jCompany");
    const jRole = document.getElementById("jRole");
    const jStatus = document.getElementById("jStatus");
    const jLink = document.getElementById("jLink");
    const jApplied = document.getElementById("jApplied");
    const jNext = document.getElementById("jNext");
    const jNotes = document.getElementById("jNotes");

    jCompany.value = job?.company || "";
    jRole.value = job?.role || "";
    jStatus.value = job?.status || "Wishlist";
    jLink.value = job?.link || "";
    jApplied.value = utcMsToIstInput(job?.appliedUtcMs ?? null);
    jNext.value = utcMsToIstInput(job?.nextUtcMs ?? null);
    jNotes.value = job?.notes || "";

    close.addEventListener("click", closeForm);

    save.addEventListener("click", () => {
      const company = (jCompany.value || "").trim();
      const role = (jRole.value || "").trim();
      const status = jStatus.value;
      const link = (jLink.value || "").trim();
      const notes = (jNotes.value || "").trim();

      // sensible defaults: if applied not set, set now (rounded)
      let appliedUtcMs = istInputToUtcMs(jApplied.value);
      let nextUtcMs = istInputToUtcMs(jNext.value);
      if (appliedUtcMs == null) appliedUtcMs = roundUpToNext15MinIst(Date.now());

      if (!company || !role) { alert("Company + Role required."); return; }

      if (job) {
        job.company = company;
        job.role = role;
        job.status = status;
        job.link = link;
        job.notes = notes;
        job.appliedUtcMs = appliedUtcMs;
        job.nextUtcMs = nextUtcMs;
      } else {
        const code = nextIdJB();
        jobs.unshift({
          id: code, code,
          company, role,
          status,
          link,
          notes,
          appliedUtcMs,
          nextUtcMs,
          done: (status === "Rejected"),
          expanded: true,
          followUps: [],
          followSeq: 0
        });
        selectedId = code;
      }

      persist();
      render();
      closeForm();
    });

    taskFormEl.classList.remove("hidden");
    jCompany.focus();
  }

  // ---------- Render ----------
  function setTabUI() {
    const activeClass = "bg-slate-950/70 border border-slate-700 text-slate-100";
    const idleClass = "text-slate-300";

    tabTasks.className = tabTasks.className.replace(activeClass, "").replace(idleClass, "");
    tabJobs.className = tabJobs.className.replace(activeClass, "").replace(idleClass, "");

    tabTasks.classList.add("rounded-full", "px-4", "py-2", "text-sm", "font-extrabold", "hover:bg-slate-950/50");
    tabJobs.classList.add("rounded-full", "px-4", "py-2", "text-sm", "font-extrabold", "hover:bg-slate-950/50");

    if (activeTab === "tasks") {
      tabTasks.classList.add(...activeClass.split(" "));
      tabJobs.classList.add(...idleClass.split(" "));
      pageTitle.textContent = "Tasks";
    } else {
      tabJobs.classList.add(...activeClass.split(" "));
      tabTasks.classList.add(...idleClass.split(" "));
      pageTitle.textContent = "Jobs";
    }

    // hide-completed still applies, but label/meaning is consistent
    toggleCompletedBtn.title = showCompleted ? "Hide completed" : "Show completed";
    toggleCompletedBtn.setAttribute("aria-label", toggleCompletedBtn.title);
    toggleCompletedIcon.innerHTML = showCompleted ? ICON_EYE : ICON_EYE_OFF;
  }

  function closeForm() {
    editingId = null;
    taskFormEl.classList.add("hidden");
    taskFormEl.innerHTML = "";
  }

  function stateToList() {
    return activeTab === "tasks" ? tasks : jobs;
  }

  function persist() {
    saveUI(activeTab, { showCompleted, filterMode, sortMode, searchQuery });
    scheduleSave();
  }

  function loadTabState(which) {
    const ui = loadUI(which);
    showCompleted = ui.showCompleted ?? true;
    filterMode = ui.filterMode ?? "all";
    sortMode = ui.sortMode ?? "created";
    searchQuery = ui.searchQuery ?? "";
    filterSelect.value = filterMode;
    sortSelect.value = sortMode;
    searchBox.value = searchQuery;
  }

  function applyFilters(list) {
    let visible = list.filter(x => (showCompleted ? true : !x.done));

    const nowMs = Date.now();

    // for jobs: interpret "due" as next follow-up date; for tasks: end date
    if (filterMode !== "all") {
      visible = visible.filter(x => {
        const due = activeTab === "tasks" ? (x.endUtcMs ?? null) : (x.nextUtcMs ?? null);
        if (filterMode === "nodue") return due == null;
        if (due == null) return false;
        if (filterMode === "overdue") return due < nowMs && !x.done;
        if (filterMode === "today") return istYmd(due) === istYmd(nowMs);
        return true;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      visible = visible.filter(x => {
        if (activeTab === "tasks") {
          const code = (x.code || x.id || "").toLowerCase();
          const title = (x.title || "").toLowerCase();
          const subHit = (x.subtasks || []).some(s => (s.text || "").toLowerCase().includes(q));
          return code.includes(q) || title.includes(q) || subHit;
        } else {
          const code = (x.code || x.id || "").toLowerCase();
          const company = (x.company || "").toLowerCase();
          const role = (x.role || "").toLowerCase();
          const notes = (x.notes || "").toLowerCase();
          const fuHit = (x.followUps || []).some(f => (f.text || "").toLowerCase().includes(q));
          return code.includes(q) || company.includes(q) || role.includes(q) || notes.includes(q) || fuHit;
        }
      });
    }

    // sort
    if (sortMode === "title") {
      visible = [...visible].sort((a, b) => {
        const at = activeTab === "tasks" ? (a.title || "") : `${a.company || ""} ${a.role || ""}`;
        const bt = activeTab === "tasks" ? (b.title || "") : `${b.company || ""} ${b.role || ""}`;
        return at.localeCompare(bt);
      });
    } else if (sortMode === "due") {
      visible = [...visible].sort((a, b) => {
        const ad = activeTab === "tasks" ? (a.endUtcMs ?? Infinity) : (a.nextUtcMs ?? Infinity);
        const bd = activeTab === "tasks" ? (b.endUtcMs ?? Infinity) : (b.nextUtcMs ?? Infinity);
        return ad - bd;
      });
    } else {
      // created: keep current order (newest first)
      visible = [...visible];
    }

    return visible;
  }

  function render() {
    setTabUI();

    const list = stateToList();
    const doneCount = list.filter(x => x.done).length;
    const visible = applyFilters(list);

    metaLine.textContent = `${list.length} items · ${doneCount} completed · ${visible.length} shown`;

    listRoot.innerHTML = "";

    if (activeTab === "tasks") {
      for (const task of visible) renderTaskCard(task);
    } else {
      for (const job of visible) renderJobCard(job);
    }
  }

  function renderTaskCard(task) {
    task.subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    ensureSubSeq(task);

    const { done, total } = countDone(task.subtasks);
    const state = dueState(task.endUtcMs ?? null, !!task.done);

    const card = document.createElement("div");
    card.className = `rounded-xl border bg-slate-950/35 p-3 sm:p-4 ${borderClass(state)}`;
    card.tabIndex = 0;
    card.addEventListener("click", () => { selectedId = task.id; });
    card.addEventListener("focus", () => { selectedId = task.id; });

    const top = document.createElement("div");
    top.className = "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between";

    const left = document.createElement("div");
    left.className = "flex items-center gap-3 min-w-0";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "h-5 w-5 accent-slate-100";
    cb.checked = !!task.done;
    cb.addEventListener("change", () => {
      const v = cb.checked;
      task.done = v;
      task.subtasks.forEach(s => s.done = v);
      persist(); render();
    });

    const textWrap = document.createElement("div");
    textWrap.className = "min-w-0";

    const title = document.createElement("div");
    title.className = `font-extrabold tracking-tight truncate ${task.done ? "line-through text-slate-400" : "text-slate-100"}`;
    title.textContent = `${task.code} · ${task.title || "(untitled)"}`;

    const meta = document.createElement("div");
    meta.className = "mt-1 text-xs text-slate-400";
    meta.textContent = `Start: ${fmtIstDateTime(task.startUtcMs ?? null)} · End: ${fmtIstDateTime(task.endUtcMs ?? null)} · ${taskStatus(task)}`;

    textWrap.appendChild(title);
    textWrap.appendChild(meta);

    left.appendChild(cb);
    left.appendChild(textWrap);

    const right = document.createElement("div");
    right.className = "flex items-center gap-2 flex-wrap justify-start sm:justify-end";

    const badge = document.createElement("div");
    badge.className = "text-xs text-slate-300/80 border border-slate-700/70 bg-slate-900/40 rounded-full px-3 py-1 font-bold whitespace-nowrap";
    badge.textContent = `${done}/${total} subtasks`;

    const toggleBtn = iconBtn(task.expanded ? ICON_CHEV_UP : ICON_CHEV_DOWN, task.expanded ? "Collapse" : "Expand");
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      task.expanded = !task.expanded;
      persist(); render();
    });

    const editBtn = iconBtn(ICON_EDIT, "Edit");
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      editingId = task.id;
      buildTaskForm(task);
    });

    const delBtn = iconBtn(ICON_TRASH, "Delete", true);
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm(`Delete ${task.code}?`)) return;
      tasks = tasks.filter(t => t.id !== task.id);
      if (editingId === task.id) closeForm();
      persist(); render();
    });

    right.appendChild(badge);
    right.appendChild(toggleBtn);
    right.appendChild(editBtn);
    right.appendChild(delBtn);

    top.appendChild(left);
    top.appendChild(right);
    card.appendChild(top);

    if (task.expanded) {
      const subsWrap = document.createElement("div");
      subsWrap.className = "mt-3 pt-3 border-t border-slate-700/60 grid gap-2";

      for (const sub of task.subtasks) {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-900/20 px-3 py-2";

        const lab = document.createElement("label");
        lab.className = "flex items-center gap-3 min-w-0 flex-1 cursor-pointer";

        const scb = document.createElement("input");
        scb.type = "checkbox";
        scb.className = "h-4 w-4 accent-slate-100";
        scb.checked = !!sub.done;
        scb.addEventListener("change", () => {
          sub.done = scb.checked;
          updateTaskDoneFromSubtasks(task);
          persist(); render();
        });

        const txt = document.createElement("div");
        txt.className = `text-sm truncate ${sub.done ? "line-through text-slate-400" : "text-slate-100/90"}`;
        txt.textContent = `${sub.code} · ${sub.text || "(untitled)"}`;

        lab.appendChild(scb);
        lab.appendChild(txt);

        const actions = document.createElement("div");
        actions.className = "flex items-center gap-2";

        const sEdit = iconBtn(ICON_EDIT, "Edit subtask");
        sEdit.addEventListener("click", () => {
          const current = sub.text || "";
          const next = prompt("Edit subtask", current);
          if (next == null) return;
          sub.text = next.trim() || current;
          persist(); render();
        });

        const sDel = iconBtn(ICON_TRASH, "Delete subtask", true);
        sDel.addEventListener("click", () => {
          task.subtasks = task.subtasks.filter(s => s.id !== sub.id);
          updateTaskDoneFromSubtasks(task);
          persist(); render();
        });

        actions.appendChild(sEdit);
        actions.appendChild(sDel);

        row.appendChild(lab);
        row.appendChild(actions);
        subsWrap.appendChild(row);
      }

      const addRow = document.createElement("div");
      addRow.className = "flex flex-col sm:flex-row gap-2 mt-2";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Add a subtask…";
      input.className = "flex-1 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500";

      const add = document.createElement("button");
      add.type = "button";
      add.className = "rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-extrabold hover:bg-slate-900/60 active:translate-y-px whitespace-nowrap";
      add.textContent = "Add subtask";

      const doAdd = () => {
        const v = input.value.trim();
        if (!v) return;
        const code = nextSubCode(task);
        task.subtasks.unshift({ id: code, code, text: v, done: false });
        task.done = false;
        input.value = "";
        persist(); render();
      };

      add.addEventListener("click", doAdd);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") doAdd(); });

      addRow.appendChild(input);
      addRow.appendChild(add);

      subsWrap.appendChild(addRow);
      card.appendChild(subsWrap);
    }

    listRoot.appendChild(card);
  }

  function renderJobCard(job) {
    job.followUps = Array.isArray(job.followUps) ? job.followUps : [];
    ensureFollowSeq(job);

    const due = job.nextUtcMs ?? null;
    const state = dueState(due, !!job.done);

    const card = document.createElement("div");
    card.className = `rounded-xl border bg-slate-950/35 p-3 sm:p-4 ${borderClass(state)}`;
    card.tabIndex = 0;
    card.addEventListener("click", () => { selectedId = job.id; });
    card.addEventListener("focus", () => { selectedId = job.id; });

    const top = document.createElement("div");
    top.className = "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between";

    const left = document.createElement("div");
    left.className = "min-w-0";

    const title = document.createElement("div");
    title.className = `font-extrabold tracking-tight truncate ${job.done ? "line-through text-slate-400" : "text-slate-100"}`;
    title.textContent = `${job.code} · ${job.company} · ${job.role}`;

    const meta = document.createElement("div");
    meta.className = "mt-1 text-xs text-slate-400";
    meta.textContent = `Applied: ${fmtIstDateTime(job.appliedUtcMs ?? null)} · Next follow-up: ${fmtIstDateTime(job.nextUtcMs ?? null)}`;

    const pill = document.createElement("div");
    pill.className = `inline-flex mt-2 items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold ${jobStatusPill(job.status)}`;
    pill.textContent = job.status;

    left.appendChild(title);
    left.appendChild(meta);
    left.appendChild(pill);

    const right = document.createElement("div");
    right.className = "flex items-center gap-2 flex-wrap justify-start sm:justify-end";

    const toggleBtn = iconBtn(job.expanded ? ICON_CHEV_UP : ICON_CHEV_DOWN, job.expanded ? "Collapse" : "Expand");
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      job.expanded = !job.expanded;
      persist(); render();
    });

    const editBtn = iconBtn(ICON_EDIT, "Edit");
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      editingId = job.id;
      buildJobForm(job);
    });

    const delBtn = iconBtn(ICON_TRASH, "Delete", true);
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm(`Delete ${job.code}?`)) return;
      jobs = jobs.filter(j => j.id !== job.id);
      if (editingId === job.id) closeForm();
      persist(); render();
    });

    right.appendChild(toggleBtn);
    right.appendChild(editBtn);
    right.appendChild(delBtn);

    top.appendChild(left);
    top.appendChild(right);
    card.appendChild(top);

    if (job.expanded) {
      const details = document.createElement("div");
      details.className = "mt-3 pt-3 border-t border-slate-700/60 grid gap-2";

      // Link + Notes
      const row1 = document.createElement("div");
      row1.className = "flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between";

      const linkWrap = document.createElement("div");
      linkWrap.className = "text-sm text-slate-200/90 flex items-center gap-2";
      if (job.link) {
        const a = document.createElement("a");
        a.href = job.link;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.className = "inline-flex items-center gap-2 underline underline-offset-4 text-slate-200 hover:text-white";
        a.innerHTML = `${ICON_LINK}<span>Open posting</span>`;
        linkWrap.appendChild(a);
      } else {
        linkWrap.textContent = "No link saved";
        linkWrap.classList.add("text-slate-500");
      }

      const statusSel = document.createElement("select");
      statusSel.className = "rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm font-extrabold text-slate-100 outline-none focus:border-slate-500";
      statusSel.innerHTML = JOB_STATUSES.map(s => `<option value="${s}">${s}</option>`).join("");
      statusSel.value = job.status || "Wishlist";
      statusSel.addEventListener("change", () => {
        job.status = statusSel.value;
        job.done = (job.status === "Rejected");
        persist(); render();
      });

      row1.appendChild(linkWrap);
      row1.appendChild(statusSel);

      const notes = document.createElement("div");
      notes.className = "text-xs text-slate-400 whitespace-pre-wrap";
      notes.textContent = job.notes ? `Notes: ${job.notes}` : "Notes: —";

      details.appendChild(row1);
      details.appendChild(notes);

      // Follow-ups list (FU-01 scoped per job)
      const fuTitle = document.createElement("div");
      fuTitle.className = "mt-2 text-xs font-extrabold text-slate-300 tracking-wide uppercase";
      fuTitle.textContent = "Follow-ups";

      details.appendChild(fuTitle);

      for (const fu of job.followUps) {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-900/20 px-3 py-2";

        const lab = document.createElement("label");
        lab.className = "flex items-center gap-3 min-w-0 flex-1 cursor-pointer";

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "h-4 w-4 accent-slate-100";
        cb.checked = !!fu.done;
        cb.addEventListener("change", () => {
          fu.done = cb.checked;
          persist(); render();
        });

        const txt = document.createElement("div");
        txt.className = `text-sm truncate ${fu.done ? "line-through text-slate-400" : "text-slate-100/90"}`;
        txt.textContent = `${fu.code} · ${fu.text || "(untitled follow-up)"}`;

        lab.appendChild(cb);
        lab.appendChild(txt);

        const actions = document.createElement("div");
        actions.className = "flex items-center gap-2";

        const eBtn = iconBtn(ICON_EDIT, "Edit follow-up");
        eBtn.addEventListener("click", () => {
          const current = fu.text || "";
          const next = prompt("Edit follow-up", current);
          if (next == null) return;
          fu.text = next.trim() || current;
          persist(); render();
        });

        const dBtn = iconBtn(ICON_TRASH, "Delete follow-up", true);
        dBtn.addEventListener("click", () => {
          job.followUps = job.followUps.filter(x => x.id !== fu.id);
          persist(); render();
        });

        actions.appendChild(eBtn);
        actions.appendChild(dBtn);

        row.appendChild(lab);
        row.appendChild(actions);
        details.appendChild(row);
      }

      const addRow = document.createElement("div");
      addRow.className = "flex flex-col sm:flex-row gap-2 mt-1";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Add a follow-up… (email recruiter, ping on LinkedIn, etc.)";
      input.className = "flex-1 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500";

      const add = document.createElement("button");
      add.type = "button";
      add.className = "rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-extrabold hover:bg-slate-900/60 active:translate-y-px whitespace-nowrap";
      add.textContent = "Add follow-up";

      const doAdd = () => {
        const v = input.value.trim();
        if (!v) return;
        const code = nextFollowUpCode(job);
        job.followUps.unshift({ id: code, code, text: v, done: false });
        input.value = "";
        persist(); render();
      };

      add.addEventListener("click", doAdd);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") doAdd(); });

      addRow.appendChild(input);
      addRow.appendChild(add);
      details.appendChild(addRow);

      card.appendChild(details);
    }

    listRoot.appendChild(card);
  }

  // ---------- Actions ----------
  function openNew() {
    editingId = null;
    if (activeTab === "tasks") buildTaskForm(null);
    else buildJobForm(null);
  }

  function editSelected() {
    const list = stateToList();
    const item = list.find(x => x.id === selectedId);
    if (!item) return;
    editingId = item.id;
    if (activeTab === "tasks") buildTaskForm(item);
    else buildJobForm(item);
  }

  function deleteSelected() {
    const list = stateToList();
    const item = list.find(x => x.id === selectedId);
    if (!item) return;
    if (!confirm(`Delete ${item.code}?`)) return;

    if (activeTab === "tasks") tasks = tasks.filter(t => t.id !== item.id);
    else jobs = jobs.filter(j => j.id !== item.id);

    if (editingId === item.id) closeForm();
    persist(); render();
  }

  function exportData() {
    const payload = {
      version: DATA_VERSION,
      exportedAt: new Date().toISOString(),
      tasks,
      jobs,
      ui: uiState,
      seq: { task: taskSeq, job: jobSeq }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "planner-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function importData(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      // old format fallback: assume tasks
      tasks = parsed;
    } else {
      if (Array.isArray(parsed.tasks)) tasks = parsed.tasks;
      if (Array.isArray(parsed.jobs)) jobs = parsed.jobs;
      if (parsed.ui && typeof parsed.ui === "object") {
        uiState.tasks = { ...DEFAULT_UI, ...(parsed.ui.tasks || {}) };
        uiState.jobs = { ...DEFAULT_UI, ...(parsed.ui.jobs || {}) };
      }
      if (parsed.seq && typeof parsed.seq === "object") {
        if (Number.isFinite(parsed.seq.task)) taskSeq = parsed.seq.task;
        if (Number.isFinite(parsed.seq.job)) jobSeq = parsed.seq.job;
      }
    }

    ensureTaskSeq();
    ensureJobSeq();
    loadTabState(activeTab);
    persist();
    render();
  }

  function clearAll() {
    if (!confirm("Clear ALL tasks and jobs?")) return;
    tasks = [];
    jobs = [];
    // sequences not reset (prevents ID reuse)
    persist();
    render();
  }

  // ---------- Events ----------
  if (authModeLogin) authModeLogin.addEventListener("click", () => setAuthMode("login"));
  if (authModeSignup) authModeSignup.addEventListener("click", () => setAuthMode("signup"));
  if (authForm) authForm.addEventListener("submit", handleAuthSubmit);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

  tabTasks.addEventListener("click", () => {
    activeTab = "tasks";
    loadTabState("tasks");
    closeForm();
    render();
  });

  tabJobs.addEventListener("click", () => {
    activeTab = "jobs";
    loadTabState("jobs");
    closeForm();
    render();
  });

  addBtn.addEventListener("click", openNew);

  toggleCompletedBtn.addEventListener("click", () => {
    showCompleted = !showCompleted;
    persist();
    render();
  });

  filterSelect.addEventListener("change", () => {
    filterMode = filterSelect.value;
    persist();
    render();
  });

  sortSelect.addEventListener("change", () => {
    sortMode = sortSelect.value;
    persist();
    render();
  });

  searchBox.addEventListener("input", () => {
    searchQuery = (searchBox.value || "").trim();
    persist();
    render();
  });

  exportBtn.addEventListener("click", exportData);

  importBtn.addEventListener("click", () => {
    importFile.value = "";
    importFile.click();
  });

  importFile.addEventListener("change", async () => {
    const f = importFile.files && importFile.files[0];
    if (!f) return;
    try {
      await importData(f);
    } catch {
      alert("Import failed: invalid JSON.");
    }
  });

  clearBtn.addEventListener("click", clearAll);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    const isTyping = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

    if (isTyping) {
      if (e.key === "Escape") closeForm();
      return;
    }

    const key = e.key.toLowerCase();
    if (key === "n") { e.preventDefault(); openNew(); return; }
    if (key === "e") { e.preventDefault(); editSelected(); return; }

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteSelected();
      return;
    }

    if (e.key === "Escape") closeForm();
  });

  // ---------- Init ----------
  tasks = [];
  jobs = [];

  loadTabState("tasks"); // default tab
  setTabUI();

  // pick a selection if any
  if (tasks.length) selectedId = tasks[0].id;

  // periodic re-render (status text only changes with time)
  // IMPORTANT: no per-second rerender. Humans can survive 10 minutes.
  setInterval(() => {
    render();
  }, 10 * 60 * 1000);

  render();
  bootstrapAuth();
})();
