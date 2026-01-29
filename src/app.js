const STORAGE_KEY = "profile_prompt_builder_v1";

const SECTIONS = [
  {
    id: "working_style",
    title: "Working style",
    description: "How I like to collaborate, iterate, and make progress.",
    recommended: true,
  },
  {
    id: "decision_principles",
    title: "Decision principles",
    description: "How I evaluate tradeoffs and choose between options.",
    recommended: true,
  },
  {
    id: "communication",
    title: "Communication preferences",
    description: "Tone, verbosity, structure, and how I like answers presented.",
    recommended: true,
  },
  {
    id: "tools_workflow",
    title: "Tools & workflow preferences",
    description: "Languages, frameworks, tooling, and how I prefer to work.",
    recommended: true,
  },
  {
    id: "constraints_dislikes",
    title: "Constraints / dislikes",
    description: "My hard constraints and recurring “don’t do X” preferences.",
    recommended: true,
  },
  {
    id: "goals_projects",
    title: "Goals / projects",
    description: "Only non-sensitive, user-approved goals; skip if uncertain.",
    recommended: false,
    sensitive: true,
  },
  {
    id: "job_career",
    title: "Job / career",
    description: "Role, responsibilities, and work context (avoid employer/identifiers unless clearly user-provided).",
    recommended: false,
    sensitive: true,
  },
  {
    id: "brand_preferences",
    title: "Brand preferences",
    description: "Products/brands I like or avoid, and what I optimize for (quality, value, sustainability, etc.).",
    recommended: false,
  },
  {
    id: "hobbies_interests",
    title: "Hobbies / interests",
    description: "Interests, activities, and topics I enjoy (keep it high-level if unsure).",
    recommended: false,
  },
  {
    id: "food",
    title: "Food",
    description: "Dietary preferences, allergies (only if explicitly known), cuisines, and go-to meals.",
    recommended: false,
    sensitive: true,
  },
  {
    id: "health",
    title: "Health",
    description: "Health constraints/preferences only if explicitly known and non-identifying.",
    recommended: false,
    sensitive: true,
  },
  {
    id: "travel",
    title: "Travel",
    description: "Travel preferences and style; avoid specific home location details unless user-provided.",
    recommended: false,
    sensitive: true,
  },
  {
    id: "sports",
    title: "Sports",
    description: "Sports I play/follow and any relevant preferences (teams, leagues, activities).",
    recommended: false,
  },
  {
    id: "relationships",
    title: "Relationships",
    description: "Relationship/family context only if explicitly known and non-identifying.",
    recommended: false,
    sensitive: true,
  },
  {
    id: "finances",
    title: "Finances",
    description: "Financial context/preferences only if explicitly known and non-sensitive.",
    recommended: false,
    sensitive: true,
  },
  {
    id: "politics",
    title: "Politics",
    description: "Political preferences/values only if explicitly known; avoid doxxing/identifying details.",
    recommended: false,
    sensitive: true,
  },
  {
    id: "follow_up_questions",
    title: "Follow-up questions",
    description: "A few questions that would improve accuracy if memory is thin.",
    recommended: true,
  },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function byId(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el;
}

function buildDefaultState() {
  const selected = {};
  for (const s of SECTIONS) selected[s.id] = Boolean(s.recommended);
  return {
    selected,
    includeInferred: true,
    includeConfidence: false,
    excludeSensitive: true,
    maxItems: 10,
  };
}

function mergeState(base, incoming) {
  if (!incoming || typeof incoming !== "object") return base;
  const selected = { ...base.selected };
  if (incoming.selected && typeof incoming.selected === "object") {
    for (const key of Object.keys(selected)) {
      if (Object.prototype.hasOwnProperty.call(incoming.selected, key)) {
        selected[key] = Boolean(incoming.selected[key]);
      }
    }
  }
  return {
    ...base,
    selected,
    includeInferred:
      typeof incoming.includeInferred === "boolean" ? incoming.includeInferred : base.includeInferred,
    includeConfidence:
      typeof incoming.includeConfidence === "boolean"
        ? incoming.includeConfidence
        : base.includeConfidence,
    excludeSensitive:
      typeof incoming.excludeSensitive === "boolean" ? incoming.excludeSensitive : base.excludeSensitive,
    maxItems: Number.isFinite(incoming.maxItems) ? clampNumber(incoming.maxItems, 1, 25) : base.maxItems,
  };
}

function clampNumber(n, min, max) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function selectedSections(state) {
  return SECTIONS.filter((s) => state.selected[s.id]);
}

function normalizeText(x) {
  return String(x || "").toLowerCase();
}

function sectionMatchesFilter(section, filterText) {
  const q = normalizeText(filterText).trim();
  if (!q) return true;
  const haystack = `${section.id} ${section.title} ${section.description}`.toLowerCase();
  return haystack.includes(q);
}

function visibleSections(state, filterText, showSelectedOnly) {
  return SECTIONS.filter((s) => {
    if (showSelectedOnly && !state.selected[s.id]) return false;
    return sectionMatchesFilter(s, filterText);
  });
}

function sectionHeading(title) {
  return `## ${title}`;
}

function buildOutputTemplate(state, sections) {
  const lines = [];
  lines.push("# Personal Profile (for new chat initialization)");
  lines.push("");

  for (const s of sections) {
    lines.push(sectionHeading(s.title));
    lines.push("- ");
    lines.push("");
  }

  if (!sections.find((s) => s.id === "follow_up_questions")) {
    lines.push("## Open questions (optional)");
    lines.push("- ");
    lines.push("");
  }

  return lines.join("\n");
}

function buildPrompt(state) {
  const sections = selectedSections(state);

  const includeInferredText = state.includeInferred
    ? "Include BOTH explicit and inferred items. Mark each bullet as (explicit) or (inferred)."
    : "Include ONLY explicit items you clearly remember. Do not infer.";

  const confidenceText = state.includeConfidence
    ? "For inferred items, include a confidence 0.0-1.0 and a short basis (why you think it's true)."
    : "Do not include confidence scores.";

  const sensitiveText = state.excludeSensitive
    ? "Do NOT include sensitive personal data (e.g., full name, address, employer, phone, email, private identifiers). If in doubt, omit."
    : "Avoid sensitive personal data unless it was clearly user-provided and necessary.";

  const sectionRules = sections
    .map((s) => {
      const extra = s.sensitive
        ? "Only include non-sensitive, user-approved details; if uncertain, write: - No reliable memory"
        : "If you have no reliable memory, write: - No reliable memory";
      return `- ${s.title}: ${extra}`;
    })
    .join("\n");

  const bulletFormat = state.includeConfidence
    ? "- <text> (explicit) OR - <text> (inferred, confidence=0.8, basis=<short reason>)"
    : "- <text> (explicit) OR - <text> (inferred)";

  const outputTemplate = buildOutputTemplate(state, sections);

  return [
    "You are ChatGPT.",
    "",
    "Task: Create a concise Markdown 'Personal Profile' I can paste into a new chatbot for initialization.",
    "Use ONLY what you explicitly remember about me from this account (saved memories + our conversation patterns).",
    "If uncertain, do not guess; either omit or mark as inferred.",
    "",
    "Rules:",
    `- ${includeInferredText}`,
    `- ${confidenceText}`,
    `- ${sensitiveText}`,
    `- Max ${state.maxItems} bullets per section. Keep bullets short and actionable.`,
    "- Output ONLY the Markdown document. No preamble, no explanation.",
    "",
    "Sections to include:",
    sectionRules,
    "",
    "Bullet format:",
    bulletFormat,
    "",
    "Output template (fill it in):",
    outputTemplate,
  ].join("\n");
}

function renderSections(container, state, sections, onChange) {
  container.innerHTML = "";
  if (!sections || sections.length === 0) {
    const empty = document.createElement("div");
    empty.className = "sections-empty";
    empty.textContent = "No sections match your filter.";
    container.appendChild(empty);
    return;
  }

  for (const s of sections) {
    const wrap = document.createElement("div");
    wrap.className = "section";

    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(state.selected[s.id]);
    checkbox.addEventListener("change", () => onChange(s.id, checkbox.checked));

    const content = document.createElement("div");

    const title = document.createElement("div");
    title.className = "section-title";
    title.textContent = s.title;

    const desc = document.createElement("div");
    desc.className = "section-desc";
    desc.textContent = s.description;

    const meta = document.createElement("div");
    meta.className = "section-meta";
    if (s.recommended) {
      const pill = document.createElement("span");
      pill.className = "pill accent";
      pill.textContent = "recommended";
      meta.appendChild(pill);
    }
    if (s.sensitive) {
      const pill = document.createElement("span");
      pill.className = "pill warn";
      pill.textContent = "may be sensitive";
      meta.appendChild(pill);
    }

    content.appendChild(title);
    content.appendChild(desc);
    if (meta.childNodes.length > 0) content.appendChild(meta);

    label.appendChild(checkbox);
    label.appendChild(content);
    wrap.appendChild(label);

    container.appendChild(wrap);
  }
}

function setStatus(text, isError) {
  const el = byId("status");
  el.textContent = text;
  el.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function main() {
  const base = buildDefaultState();
  const state = mergeState(base, loadState());

  const sectionsEl = byId("sections");
  const sectionFilterEl = byId("sectionFilter");
  const showSelectedOnlyEl = byId("showSelectedOnly");
  const sectionCountEl = byId("sectionCount");
  const promptEl = byId("prompt");

  const includeInferredEl = byId("includeInferred");
  const includeConfidenceEl = byId("includeConfidence");
  const excludeSensitiveEl = byId("excludeSensitive");
  const maxItemsEl = byId("maxItems");

  function recompute() {
    const chosen = selectedSections(state);
    if (chosen.length === 0) {
      promptEl.value = "Select at least one section to generate a prompt.";
      return;
    }
    promptEl.value = buildPrompt(state);
  }

  function persistAndUpdate() {
    saveState(state);
    recompute();
  }

  let sectionFilterText = "";

  function updateSectionCount(visible) {
    const total = SECTIONS.length;
    const shown = visible.length;
    const selected = SECTIONS.reduce((n, s) => n + (state.selected[s.id] ? 1 : 0), 0);
    sectionCountEl.textContent = `Showing ${shown}/${total} (selected ${selected})`;
  }

  function onSectionToggle(sectionId, checked) {
    state.selected[sectionId] = checked;
    persistAndUpdate();
    rerenderSections();
  }

  function rerenderSections() {
    const visible = visibleSections(state, sectionFilterText, showSelectedOnlyEl.checked);
    renderSections(sectionsEl, state, visible, onSectionToggle);
    updateSectionCount(visible);
  }

  sectionFilterEl.addEventListener("input", () => {
    sectionFilterText = sectionFilterEl.value;
    rerenderSections();
  });

  showSelectedOnlyEl.addEventListener("change", () => {
    rerenderSections();
  });

  includeInferredEl.checked = state.includeInferred;
  includeConfidenceEl.checked = state.includeConfidence;
  excludeSensitiveEl.checked = state.excludeSensitive;
  maxItemsEl.value = String(state.maxItems);

  includeInferredEl.addEventListener("change", () => {
    state.includeInferred = includeInferredEl.checked;
    persistAndUpdate();
  });
  includeConfidenceEl.addEventListener("change", () => {
    state.includeConfidence = includeConfidenceEl.checked;
    persistAndUpdate();
  });
  excludeSensitiveEl.addEventListener("change", () => {
    state.excludeSensitive = excludeSensitiveEl.checked;
    persistAndUpdate();
  });
  maxItemsEl.addEventListener("change", () => {
    state.maxItems = clampNumber(maxItemsEl.value, 1, 25);
    maxItemsEl.value = String(state.maxItems);
    persistAndUpdate();
  });

  byId("selectRecommended").addEventListener("click", () => {
    for (const s of SECTIONS) state.selected[s.id] = Boolean(s.recommended);
    persistAndUpdate();
    rerenderSections();
    setStatus("Selected recommended sections.");
  });

  byId("selectAll").addEventListener("click", () => {
    for (const s of SECTIONS) state.selected[s.id] = true;
    persistAndUpdate();
    rerenderSections();
    setStatus("Selected all sections.");
  });

  byId("clearAll").addEventListener("click", () => {
    for (const s of SECTIONS) state.selected[s.id] = false;
    persistAndUpdate();
    rerenderSections();
    setStatus("Cleared selection.");
  });

  byId("copyPrompt").addEventListener("click", async () => {
    try {
      const text = promptEl.value;
      if (!text || text.trim().length === 0) {
        setStatus("Nothing to copy.", true);
        return;
      }
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        promptEl.focus();
        promptEl.select();
        const ok = document.execCommand("copy");
        if (!ok) throw new Error("Copy failed");
        promptEl.setSelectionRange(promptEl.value.length, promptEl.value.length);
      }
      setStatus("Copied to clipboard.");
    } catch (e) {
      setStatus(`Copy failed. Try selecting the text and copying manually. (${String(e)})`, true);
    }
  });

  rerenderSections();
  persistAndUpdate();
}

main();
