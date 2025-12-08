# Bluebird — Product Overview (Remix)

**Version:** 0.2 (Aligned)
**Created:** 11/Nov/2025
**Owner:** Mike Blakeway
**Product Name:** Bluebird
**Last Updated:** 11/Nov/2025

---

## 1) One‑liner

**Bluebird** turns any set of lyrics into a fully‑original, studio‑quality song performed by bespoke AI vocalists—optionally guided by a short Remix reference that keeps the composition original and export‑safe.

---

## 2) Elevator pitch

Creators want a producer, session band, and vocalists on demand—but without licensing headaches or DAW complexity. Bluebird composes new melodies and arrangements from lyrics (original or referenced), performs them with in‑house **AI artists**, and exposes precise controls for genre, tempo, structure, instrumentation, harmonies, and mix. The optional Remix flow accepts a short reference (≤ 30s) to guide contour/phrasing, then generates a **new, originality‑guarded topline** with a configurable **Similarity Budget**. Export a mastered track or individual stems.

---

## 3) The problem

* **Creation bottlenecks:** Lyrics without melody/arrangement stall.
* **Access & cost:** Hiring vocalists/players/engineers is slow and expensive.
* **Tool gap:** Prompt‑only music tools feel random; DAWs are heavy.
* **Legal risk:** Straight remixes, cloned voices, or copied melodies are fragile.

---

## 4) The Bluebird solution

* **Original composition engine:** From text to new melody/harmony/structure (no reuse of masters or exact tunes).
* **Remix (similarity‑guarded):** Optional reference → contour/rhythm guidance → transformed, export‑safe topline with an adjustable **Similarity Budget**.
* **House voices:** Curated roster of licensed, bespoke **AI artists** (no celebrity cloning) with duet/group capability.
* **Directed generation:** Clear controls for genre, BPM, song sections, instrumentation, groove/swing, harmonies, and mix.
* **Pro‑ready output:** Stereo master + per‑stem WAV for DAW workflows.
* **Rights‑aware UX:** Guardrails, similarity checks, and export gating keep users out of trouble.

---

## 5) Target users & personas

1. **Indie Songwriter Sarah** — Has lyrics and hooks; wants radio‑ready demos and vocalists.
2. **Producer Dev** — Needs controllable AI stems he can arrange/mix in a DAW.
3. **Creator Jamie** — Needs quick soundtrack cues for social/video with recognizable vibes.
4. **Educator Alex** — Demonstrates genre/arrangement and “in the style of” safely.

### **Jobs‑to‑be‑done (JTBD)**

* Turn my lyrics into a finished song **in a chosen genre** with **my pick of vocalists**.
* Iteratively adjust arrangement (tempo, sections, instruments) **without restarting**.
* Create a **safe remix‑feeling** cue for short‑form video.
* Export stems for pro finishing **without rights drama**.

---

## 6) Value proposition

* **Quality + Control:** Structured arrangement planning beats prompt roulette.
* **Speed:** Text to mixed song in minutes; regenerate parts selectively.
* **Safety:** Original music + in‑house voices + similarity gates.
* **Collaboration:** Multi‑vocalist direction (duets, groups, harmonies) as first‑class features.

---

## 7) Scope & non‑goals (MVP)

### **In‑scope**

* Lyrics → original song generation (melody, harmony, arrangement from scratch)
* Genre presets (e.g., 50s Chicago Blues, 90s Boom Bap, UK Garage 2001, Modern Pop Ballad)
* 3–5 curated AI artists (distinct timbres, ranges, personas)
* Structure editor (Intro/Verse/Chorus/Bridge/Outro with bar counts)
* Tempo/BPM and instrumentation presets per genre
* Duet (lead + featured) and simple backing harmonies
* Master + stem export (WAV/48k)
* **Remix (Private Reference ≤ 30s):** Attach reference to guide contour/rhythm; transformed melody must pass similarity checks before export.

### **Out‑of‑scope**

* Voice cloning of real artists
* **Near‑identical melody replication** of copyrighted works
* Full DAW capability (advanced MIDI editing, third‑party plugins)
* Live, continuous multi‑hour performance

---

## 8) Feature set (MVP → V1)

### **MVP**

* Project workspace: lyrics editor + section map
* Genre picker with smart defaults
* AI Artist roster: select Lead/Featured; quick auditions
* Arrangement planner (auto) + manual overrides
* Per‑section instrument generation & preview
* Lead vocal generation (line‑mapped)
* Simple mixer (level/pan + 3–4 era presets)
* Export: Master + stems; project autosave
* **Remix Reference (private) + Similarity Check on export**

### **V1 Enhancements**

* Backing vocals/harmonies generator
* Groove/swing/humanization controls
* Era & space presets (rooms/tape/mono fold‑down)
* Song blueprints (AABA, 12‑bar variants, radio ballad)
* Shareable preview links & comments
* Stem packs with metadata/cue JSON
* **Similarity Budget slider** (Remix ↔ Original) with live compliance meter
* Priority queue + API access for Pro

---

## 9) Legal & ethics posture

* **All audio is newly generated**; no reuse of masters or near‑copy melodies.
* **No celebrity voice cloning**; voices are proprietary and licensed.
* **Remix Guardrails:** We store feature vectors from references, not the audio (unless user opts in); we apply interval n‑gram/DTW/rhythm checks, and block exports that exceed thresholds with actionable guidance.
* **Lyrics:** Users may paste lyrics they own; third‑party lyrics trigger export notices and licensing guidance.
* **Content policy:** Disallow hateful/illegal content; rate‑limit abuse.
* **Data retention:** Project‑scoped storage with user‑controlled deletion.

---

## 10) Success metrics

### **Activation**

* % of new users who reach a 30‑sec preview within first session
* Time to first stem export

### **Quality**

* Mean Take Rating (MTR) ≥ 4.2/5 across first 3 generations
* Regeneration rate per section (lower is better)
* Remix compliance pass rate without manual intervention

### **Retention / Monetization**

* D7/D30 return rates
* Stems exports / user / week
* Conversion to paid tiers

---

## 11) System overview (high level)

### **Frontend (Next.js + TS)**

* Lyrics editor, structure grid, artist/genre pickers
* Remix panel: reference attach (≤ 30s), key/BPM detect, similarity meter
* Section previews; waveform + stem toggles

### **Orchestrator API (Node/TS)**

* `/plan/vocals` → VocalScore (assign lines to artists, style notes)
* `/plan/arrangement` → ArrangementSpec (BPM, key, chords, instrumentation)
* `/remix/reference:init` → signed upload URL for short reference
* `/remix/reference:finalize` → `RemixFeatures` (contour/rhythm/key/BPM)
* `/remix/melody` → transformed topline constrained by Similarity Budget
* `/render/instrument` → per‑instrument per‑section audio
* `/render/vocal` → per‑line vocal audio by AIArtist
* `/check/similarity` → multi‑metric score + export‑gating report
* `/mix/final` → mix/master + loudness

### **Inference on Runpod Serverless**

* **Analyzer pod** (melody/tempo/key extraction)
* **Planner pod** (LLM‑style; CPU/small GPU)
* **Music synth pod** (instrument audio; GPU)
* **Voice synth pod** (singing TTS; GPU)
* **Remix checker** (feature similarity; CPU)
* **Mix pod** (stitching, FX, mastering; CPU)

### **Storage**

* Object storage for stems/masters and checker reports
* Project DB for metadata (lyrics, structure, artist assignments, settings)

### **Observability & QA**

* Per‑stage logs, seeds, and artifacts; reproducible runs

---

## 12) Data contracts (first pass)

```ts
export type ID = string
export type AIArtistId = string

export interface GenerationRequest {
  projectId: ID
  lyrics: string
  genre: string
  vocalArrangement: {
    lead: AIArtistId
    featured?: AIArtistId
    backing?: AIArtistId[]
  }
  overrides?: {
    bpm?: number
    instrumentation?: string[]
    moodPrompt?: string
    structure?: SongStructureOverride
  }
  remix?: {
    enabled: boolean
    similarityBudget?: number // 0..1; lower=safer
    referenceId?: string // uploaded short audio/MIDI reference
  }
}

export interface SongStructureOverride {
  sections: Array<{
    type: 'intro'|'verse'|'chorus'|'bridge'|'outro'
    bars: number
    leadVocal?: 'lead'|'featured'|'both'|'none'
    callAndResponse?: boolean
  }>
}

export interface VocalScoreLine {
  startSection: string // e.g., 'verse1'
  lineText: string
  performer: AIArtistId
  styleGuide: string // phrasing, tone, timing hints
  harmonyWith?: AIArtistId[]
}

export interface VocalScore { lines: VocalScoreLine[] }

export interface ArrangementSpec {
  bpm: number
  key: string
  sections: Array<{
    id: string // e.g., 'verse1'
    bars: number
    instrumentation: {
      drums?: string
      bass?: string
      guitar?: string
      keys?: string
      other?: string[]
    }
    harmonyGuide: string
    energy: number // 1–10
  }>
}

export interface RemixFeatures {
  contour: number[] // up/down/hold encoding or interval series
  rhythm: number[] // beat positions / stress pattern
  key: string
  bpm: number
}
```

---

## 13) Security, privacy, compliance

* Project isolation per user; signed URLs for media.
* Store **feature vectors** and **similarity reports**, not raw reference audio (unless opt‑in).
* Clear output license grant to users; revoke abusive use.
* Right‑to‑erasure for projects and uploaded text.

---

## 14) Performance & SLOs (MVP targets)

* P50 time to first 30‑sec preview ≤ 45s
* Full‑song render (3:00) ≤ 6–8 min with serverless queueing
* Per‑section regeneration ≤ 20s
* Remix analysis ≤ 5s for ≤ 30s reference
* Uptime SLA 99.5% (orchestrator + storage)

---

## 15) Pricing sketch

* **Free:** 30s clips, 1 artist, limited genres, no stems, **Remix preview allowed but export gated**
* **Creator (£15/mo):** Full songs, all artists, stems, duet, commercial indie license
* **Pro (£49/mo):** Priority queue, API access, DAW stem packs, advanced mix, collaboration, **Similarity Budget controls**

---

## 16) Risks & mitigations

* **Output quality variance** → Structured plans; selective regen; user‑rated takes
* **Legal edge cases (lyrics + references)** → Export gating; similarity budgets; clear policy copy
* **GPU costs** → Per‑stage caching; section‑scoped generation; Runpod spot where possible
* **User overwhelm** → Progressive disclosure of advanced controls; sensible defaults

---

## 17) Roadmap (first 90 days)

### **Weeks 1–2**

* Lock data contracts; scaffold monorepo; stub endpoints; fake renders for UI dev

### **Weeks 3–6**

* Integrate planner pods; add 3 AI artists; per‑section instrument generation; remix analyzer

### **Weeks 7–10**

* Add vocal synthesis; duet support; similarity checker + budget slider; simple mixer; stem export

### **Weeks 11–12**

* Closed beta; instrumentation; pricing flags; launch prep

---

## 18) Open questions

* Default similarity thresholds per market/region?
* Max reference length (30s vs 45s) to balance guidance vs risk/cost?
* Which 6–8 genres and 3–5 artists for launch cover most use cases?
* Remix for rhythm/groove only (no pitch) as a low‑risk mode?

---

## 19) Glossary

* **AI Artist:** Proprietary singing TTS/voice with a defined timbre/range.
* **ArrangementSpec:** JSON plan for tempo, harmony, instrumentation, sections.
* **VocalScore:** JSON mapping of lyrics to performers with style/phrasing guidance.
* **Remix:** Reference‑guided composition that passes similarity checks; not a copy.
* **Stems:** Individual audio tracks per instrument/voice for DAW mixing.

---

> **Example user flow with Remix**
>
> 1. Paste lyrics → pick genre → (optional) attach ≤ 30s reference
> 2. Bluebird analyzes key/BPM/contour → proposes structure/BPM
> 3. Generate remix melody (Similarity Budget GREEN) → approve
> 4. Render sections (instruments + vocals) → mix → export master/stems
