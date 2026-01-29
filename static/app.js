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
    id: "response_preferences",
    title: "Response preferences",
    description: "How I want my questions answered—tone, verbosity, structure, presentation.",
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
    description: "Personal or professional objectives; major projects (paragraph per project if useful). Skip if uncertain.",
    recommended: false,
    sensitive: true,
  },
  {
    id: "job_career",
    title: "Professional",
    description: "Employer, title, role, seniority, team/org, industry, domain, professional affiliations.",
    recommended: false,
    sensitive: true,
  },
  {
    id: "personal_information",
    title: "Personal information",
    description: "Name, location, age range, family, languages, demographics (only if clearly user-provided).",
    recommended: false,
    sensitive: true,
  },
  {
    id: "education",
    title: "Education",
    description: "Current school, classes, subjects, teachers, or ongoing learning.",
    recommended: false,
  },
  {
    id: "habits_routines",
    title: "Habits & routines",
    description: "Behavioral patterns, daily and weekly schedules, routines.",
    recommended: false,
  },
  {
    id: "writing",
    title: "Writing",
    description: "Writing style, tone, voice, formality, vocabulary, audiences, length, formatting.",
    recommended: true,
  },
  {
    id: "coding",
    title: "Coding",
    description: "Languages, style, formatting, commenting, frameworks, LLM collaboration workflows.",
    recommended: true,
  },
  {
    id: "media_content",
    title: "Media & content",
    description: "Books, films, podcasts, TV, creators, news sources, favored apps or websites, platforms.",
    recommended: false,
  },
  {
    id: "events_milestones",
    title: "Events & milestones",
    description: "Major life events, achievements, milestones, awards, recognitions, significant transitions.",
    recommended: false,
    sensitive: true,
  },
  {
    id: "notable_conversations",
    title: "Notable conversations",
    description: "Up to N recent notable conversations (topics or short summaries).",
    recommended: false,
  },
  {
    id: "brand_preferences",
    title: "Brand preferences",
    description: "Products/brands I like or avoid, and what I optimize for (quality, value, sustainability, etc.).",
    recommended: false,
  },
  {
    id: "hobbies_interests",
    title: "Interests & hobbies",
    description: "Likes, dislikes, hobbies, intellectual pursuits, leisure, curiosity or aversion.",
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
    title: "Health & wellness",
    description: "Health, fitness, wellness habits, diet, dietary restrictions—only if explicitly known.",
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
    title: "Important relationships",
    description: "Friends, colleagues, family—only if explicitly known and non-identifying.",
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
        ? "Only include non-sensitive, user-approved details. If nothing fits, skip this section."
        : "If you have no information for this section, skip it entirely.";
      return `- ${s.title}: ${extra}`;
    })
    .join("\n");

  const bulletFormat = state.includeConfidence
    ? "- <text> (explicit) OR - <text> (inferred, confidence=0.8, basis=<short reason>)"
    : "- <text> (explicit) OR - <text> (inferred)";

  const outputTemplate = buildOutputTemplate(state, sections);

  const dataSourcesText =
    "Retrieve information from every available source you are allowed to use: User Bio, User Instructions, " +
    "Assistant Response Preferences, Memory, Notable Past Conversation Topics, Helpful User Insights, " +
    "Recent Conversation Content, Conversation Style Meta-Notes, and any other stored data or notes about me. " +
    "Do not filter or exclude anything from these sources.";

  return [
    "You are ChatGPT.",
    "",
    "Task: Create a concise Markdown 'Personal Profile' I can paste into a new chatbot (or browser) for initialization.",
    "",
    "Data sources:",
    dataSourcesText,
    "",
    "Then organize ALL of this information into the sections below. Create new sections if you have information that does not fit any listed section.",
    "",
    "Rules:",
    `- ${includeInferredText}`,
    `- ${confidenceText}`,
    `- ${sensitiveText}`,
    `- Max ${state.maxItems} bullets per section (or one paragraph per major item where the section description says so). Keep bullets short and actionable.`,
    "- Omit any section for which you have no information. Do not write \"not specified\" or similar placeholders.",
    "- Output ONLY the Markdown document. No preamble, no closing remarks, no explanation, no opt-in or follow-up prompts.",
    "",
    "Sections to include (skip any with no content):",
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
