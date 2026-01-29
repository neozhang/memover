# Lessons from the “New Browser / Profile Import” Prompt

**Credit:** The prompt structure and categories in this doc are from [Dia Browser](https://diabrowser.com).

This doc captures what we can learn from that prompt and how it enriches the Profile Prompt Builder.

---

## 1. **Explicit data-source enumeration**

The prompt tells the model *where* to look:

> "Retrieve and include information from every available source you're allowed to disclose—User Bio, User Instructions, Assistant Response Preferences, Memory, Notable Past Conversation Topics, Helpful User Insights, Recent Conversation Content, Conversation Style Meta-Notes, and any other stored data, memories, or notes."

**Lesson:** Naming concrete sources (Bio, Memory, past topics, meta-notes) can improve recall instead of relying on a vague “what you remember.”

**Use in our app:** Add an optional or built-in “Data sources” line in the generated prompt so the model is instructed to pull from Memory, Bio, Instructions, past conversations, etc.

---

## 2. **“Create new categories if needed”**

The prompt says: *"Create new categories if needed for any information that doesn't fit."*

**Lesson:** Reduces risk of dropping important info that doesn’t fit the predefined list.

**Use in our app:** Add one sentence to the prompt: “If you have information that doesn’t fit any selected section, add a new section with an appropriate heading.”

---

## 3. **Skip empty; no placeholders**

Rules given:

- *"If you can't find anything for a given category, skip it."*
- *"Only include known items; if you do not have information for an item, skip it entirely (do not say 'not specified')."*

**Lesson:** Empty sections and “not specified” bullets add noise. Skipping unknowns keeps the output clean and truthful.

**Use in our app:** In the prompt rules, say: “Omit any section for which you have no information. Do not write ‘not specified’ or similar placeholders.”

---

## 4. **Strict output format**

The prompt says: *"Only respond with the sections and content. Do not say anything else—no preamble, no ending, no opt-in prompts to do more tasks."*

**Lesson:** Explicit “no preamble, no ending, no follow-up prompts” reduces fluff and keeps the output paste-ready.

**Use in our app:** Strengthen our “Output ONLY the Markdown document” with: “No preamble, no closing remarks, no opt-in or follow-up prompts.”

---

## 5. **Sections we can add or refine**

| User prompt category        | Our current section   | Action |
|----------------------------|------------------------|--------|
| **Response Preferences**   | Communication          | Align: “Response preferences” = how answers are wanted; keep or rename Communication. |
| **Personal Information**   | —                      | **Add:** name, location, age range, family, languages, demographics. |
| **Professional**           | Job / career           | **Enrich:** employer, title, role, seniority, team/org, industry, domain, affiliations. |
| **Important Relationships** | Relationships        | Keep; description already fits. |
| **Education**              | —                      | **Add:** school, classes, subjects, teachers. |
| **Projects & Responsibilities** | Goals / projects   | **Enrich:** allow “paragraph per major project” as an option or description. |
| **Goals & Intentions**     | Goals / projects       | Keep; can fold “intentions” into description. |
| **Habits & Routines**     | —                      | **Add:** behavioral patterns, daily/weekly schedules. |
| **Writing**               | Communication          | **Add or split:** writing style, tone, voice, formality, vocabulary, audiences, length, formatting. |
| **Coding**                | Tools & workflow       | **Enrich:** languages, style, formatting, commenting, frameworks, LLM collaboration patterns. |
| **Interests & Hobbies**    | Hobbies / interests    | Keep; optionally broaden to “passionate curiosity or aversion.” |
| **Media & Content**       | Brand preferences (partial) | **Add:** books, films, podcasts, TV, creators, news, apps, platforms. |
| **Lifestyle**             | Scattered (food, travel) | Optional umbrella; or leave as separate sections. |
| **Health & Wellness**     | Health                 | Keep; already similar. |
| **Events & Milestones**   | —                      | **Add:** achievements, milestones, anniversaries, awards, transitions. |
| **Notable Conversations** | —                      | **Add:** up to N recent notable conversations (user-configurable). |

---

## 6. **Detail level for projects**

The user prompt asks for *"a paragraph per major project"* for Projects & Responsibilities.

**Lesson:** Some sections benefit from richer output (paragraphs) instead of only bullets.

**Use in our app:** Either (a) add a “Detail level” option (e.g. bullets vs short paragraphs for Projects), or (b) at least describe Projects as “one paragraph per major project” in the section description and in the prompt.

---

## 7. **Cap per section**

The user prompt says *"For each section, provide a bullet list of up to 10 items."*

**Lesson:** We already have `maxItems` (e.g. 10); keeping a clear “up to N items per section” in the prompt avoids overlong lists.

**Use in our app:** We already do this; no change needed.

---

## Summary: concrete changes

1. **Prompt text:** Add data-source enumeration, “create new categories if needed,” “skip empty / no placeholders,” and stricter “no preamble/ending/opt-in” wording.
2. **SECTIONS in app.js:** Add Personal Information, Education, Habits & Routines, Writing (or split from Communication), Media & Content, Events & Milestones, Notable Conversations; enrich Professional, Projects, and Coding descriptions.
3. **Optional:** Detail level for Projects (paragraph vs bullets) as a setting or fixed instruction.
