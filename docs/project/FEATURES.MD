# Bluebird — Feature Specification

**Version:** 0.2 (Aligned)
**Created:** 11/Nov/2025
**Owner:** Mike Blakeway
**Product Name:** Bluebird
**Last Updated:** 11/Nov/2025

This document enumerates Bluebird’s features across MVP, V1, and backlog. Each feature includes goal, scope, user value, acceptance criteria, UX notes, dependencies, and metrics. IDs are stable and used in issues/PRs.

---

## Legend

* **ID syntax:** `F-[Tier]-[Area]-[Num]` (e.g., `F-MVP-GEN-01`)
* **Tiers:** MVP, V1, FUT (future/backlog)
* **Areas:** ONB (onboarding), LYR (lyrics), STR (structure), ART (artists/voices), REF (reference/remix), GEN (generation), MIX (mix/master), EXP (export), PRJ (projects), COL (collab), PAY (pricing/plan), GOV (policy)

---

## 1) Feature Matrix (MUST/SHOULD/COULD)

| ID           | Title                                          | Tier | Priority | MUST/SHOULD/COULD |
| ------------ | ---------------------------------------------- | ---- | -------- | ----------------- |
| F-MVP-ONB-01 | Create project                                 | MVP  | P0       | MUST              |
| F-MVP-LYR-01 | Lyrics editor                                  | MVP  | P0       | MUST              |
| F-MVP-STR-01 | Structure presets & editor                     | MVP  | P0       | MUST              |
| F-MVP-ART-01 | AI Artist roster (3–5 voices)                  | MVP  | P0       | MUST              |
| F-MVP-GEN-01 | Arrangement planner                            | MVP  | P0       | MUST              |
| F-MVP-GEN-02 | Instrument generation (per section/instrument) | MVP  | P0       | MUST              |
| F-MVP-GEN-03 | Vocal generation (lead)                        | MVP  | P0       | MUST              |
| F-MVP-MIX-01 | Simple mixer (level/pan/era FX)                | MVP  | P0       | MUST              |
| F-MVP-EXP-01 | Export master (WAV/MP3)                        | MVP  | P0       | MUST              |
| F-MVP-EXP-02 | Export stems (WAV)                             | MVP  | P1       | SHOULD            |
| F-MVP-ART-02 | Duet (lead + featured)                         | MVP  | P1       | SHOULD            |
| F-MVP-STR-02 | Per‑section regenerate                         | MVP  | P1       | SHOULD            |
| F-MVP-PRJ-01 | Autosave projects & versions                   | MVP  | P1       | SHOULD            |
| F-MVP-GOV-01 | Content & licensing guardrails                 | MVP  | P0       | MUST              |
| F-MVP-REF-01 | Reference Melody (private preview ≤30s)        | MVP  | P0       | MUST              |
| F-V1-REF-02  | Remix Melody (similarity‑guarded)              | V1   | P0       | MUST              |
| F-V1-REF-03  | Similarity Budget control (Remix ↔ Original)   | V1   | P1       | SHOULD            |
| F-V1-REF-04  | Similarity checker & export gating             | V1   | P0       | MUST              |
| F-V1-ART-03  | Backing vocals/harmonies generator             | V1   | P1       | SHOULD            |
| F-V1-MIX-02  | Era & space presets (rooms/tape)               | V1   | P1       | SHOULD            |
| F-V1-GEN-04  | Groove/swing/humanization controls             | V1   | P1       | SHOULD            |
| F-V1-STR-03  | Song blueprints (AABA, 12‑bar variants)        | V1   | P2       | COULD             |
| F-V1-COL-01  | Shareable preview links                        | V1   | P2       | COULD             |
| F-V1-EXP-03  | Stem packs with metadata (cue sheets)          | V1   | P2       | COULD             |
| F-V1-PAY-02  | Pro controls: Similarity Budget slider         | V1   | P1       | SHOULD            |
| F-V1-PAY-03  | Priority queue & API access                    | V1   | P1       | SHOULD            |
| F-FUT-ART-04 | Group mode (3+ artists)                        | FUT  | P3       | COULD             |
| F-FUT-GEN-05 | Live “co‑compose” playhead preview             | FUT  | P3       | COULD             |
| F-FUT-COL-02 | Multi‑editor real‑time collaboration           | FUT  | P3       | COULD             |
| F-FUT-GOV-02 | Cover‑licensing helper                         | FUT  | P2       | COULD             |
| F-FUT-UX-01  | DAW‑lite pianoroll                             | FUT  | P2       | COULD             |

---

## 2) MVP Features

### F-MVP-ONB-01 — Create Project

**Goal**: Let users create a project with default structure/genre and save state.
**Scope**: New project, name, genre preset, default structure, default lead artist.
**Out of scope**: Team projects, templates library beyond presets.
**Acceptance**:

* User can create a project without uploading files.
* Project persists with ID; auto‑restores on reload.
* Default structure visible (e.g., Intro 4 bars, Verse 16, Chorus 8).
  **UX**: Modal or “New Project” on empty state.
  **Deps**: PRJ storage, auth (if any), preset catalog.
  **Metrics**: Projects created / DAU; abandonment at creation.

---

### F-MVP-LYR-01 — Lyrics Editor

**Goal**: Provide a first‑class, distraction‑free lyrics editor with section tagging.
**Scope**: Plain text + section markers, word/line counts, validation.
**Acceptance**:

* User can paste/edit lyrics.
* Sections can be marked (Verse 1, Chorus, Bridge) and re‑ordered.
* Validation warns on empty lyrics before generation.
  **UX**: Two‑pane: lyrics left, structure grid right; keyboard shortcuts.
  **Deps**: None beyond PRJ store.
  **Metrics**: Time spent editing; section usage.

---

### F-MVP-STR-01 — Structure Presets & Editor

**Goal**: Control song layout and bar counts.
**Scope**: Presets per genre; manual add/remove sections; bar length per section.
**Acceptance**:

* Selecting a preset populates sections/bar counts.
* User can add/remove sections; change bar counts.
* Changes update the plan sent to arrangement.
  **UX**: Grid editor (rows=sections, columns=bar counts).
  **Deps**: Preset catalog; data contracts (`SongStructureOverride`).
  **Metrics**: Edits per project; preset adoption.

---

### F-MVP-ART-01 — AI Artist Roster (3–5 Voices)

**Goal**: Curated in‑house voices with bios and sweet spots.
**Scope**: Lead artist selection; profile card (range, style), preview phrases.
**Acceptance**:

* User can audition each voice via fixed preview lines.
* Lead can be selected; persists to project.
* API returns a valid `AIArtistId` used in vocal generation.
  **UX**: Roster gallery; quick audition button.
  **Deps**: Voice models; CDN for previews.
  **Metrics**: Auditions/play rate; voice selection distribution.

---

### F-MVP-GEN-01 — Arrangement Planner

**Goal**: Convert lyrics + structure + genre into an `ArrangementSpec`.
**Scope**: BPM/key suggestion, chord/harmony guide, instrumentation per section.
**Acceptance**:

* Planner returns valid JSON with sections matching structure.
* Key/BPM are explicit; energy curve present.
* Round‑trip validation passes against schema.
  **UX**: “Plan Arrangement” button with quick summary chip (e.g., 72 BPM • E Blues • Upright/Guitar/Brushes).
  **Deps**: Planner pod (LLM‑style), schema validator.
  **Metrics**: Plan success rate; manual overrides frequency.

---

### F-MVP-GEN-02 — Instrument Generation (Per Section/Instrument)

**Goal**: Render stems per instrument, per section, for control and regeneration.
**Scope**: Drums, bass, guitar/keys/other as defined by `ArrangementSpec`.
**Acceptance**:

* For a selected section & instrument, system returns aligned WAV.
* Stems align to grid at BPM; regeneration doesn’t drift timing.
* Failure in one stem doesn’t invalidate others.
  **UX**: Section list with instrument toggles; generate/regen buttons; waveform preview.
  **Deps**: Music synth pod; storage for stems; clock/grid manager.
  **Metrics**: Regen rate per stem; time to first preview.

---

### F-MVP-GEN-03 — Vocal Generation (Lead)

**Goal**: Synthesize lead vocal per line with expressive phrasing.
**Scope**: Line‑mapped rendering based on `VocalScore` (auto or simple default mapping).
**Acceptance**:

* Lines are assigned to lead; vocals render in correct sections.
* Timing/phrasing follow styleGuide; sibilance/breath acceptable.
* Profanity and flagged content respect policy settings.
  **UX**: Lyrics lines show per‑line render status; solo/mute.
  **Deps**: Voice synth pod; `VocalScore` generator (basic for MVP).
  **Metrics**: Line success rate; per‑line regen frequency.

---

### F-MVP-MIX-01 — Simple Mixer (Level/Pan/Era FX)

**Goal**: Fast balance and vibe selection.
**Scope**: Track faders, pan, mute/solo; 3–4 era presets (e.g., “50s Tape Mono”, “Modern Pop”, “Lo‑Fi Club”).
**Acceptance**:

* Adjustments reflect in realtime preview (latency ≤ 300 ms buffer).
* Era preset applies deterministic chain; can be reset.
* Export reflects mixer state.
  **UX**: Compact DAW‑like strip per track; preset dropdown.
  **Deps**: Mix pod; audio engine; preset definitions.
  **Metrics**: Preset usage; time to satisfactory mix.

---

### F-MVP-EXP-01 — Export Master (WAV/MP3)

**Goal**: Deliver finished audio.
**Scope**: WAV 48 kHz 24‑bit, MP3 320 kbps; metadata (title, artists, genre).
**Acceptance**:

* Download links for master formats are provided.
* Loudness target per preset is met (document targets in mixer).
  **UX**: Export modal with options and license note.
  **Deps**: Mix pod; storage; signed URLs.
  **Metrics**: Export conversion rate; format split.

---

### F-MVP-EXP-02 — Export Stems (WAV)

**Goal**: DAW‑ready stems for creators.
**Scope**: Individual WAV per instrument/voice; consolidated zip; cue JSON.
**Acceptance**:

* All stems share length and start at 0.
* Zip contains README with BPM/key and track list.
  **UX**: Checkbox tree to select stems; “Include cue JSON”.
  **Deps**: Storage; bundler; metadata writer.
  **Metrics**: Stem exports / paying user.

---

### F-MVP-ART-02 — Duet (Lead + Featured)

**Goal**: Two distinct AI artists sharing lines/sections.
**Scope**: Assign lines to Featured in chosen sections; simple call‑and‑response.
**Acceptance**:

* Lines visibly assigned by performer.
* Renderer produces two vocal tracks aligned; no phasing issues.
  **UX**: Toggle “Duet Mode”; drag lines to performer; color‑coded tracks.
  **Deps**: `VocalScore` with performer field; voice synth pod.
  **Metrics**: Duet adoption; satisfaction delta vs solo.

---

### F-MVP-STR-02 — Per‑Section Regenerate

**Goal**: Localized iteration without losing good takes.
**Scope**: Regenerate single section for selected instrument or vocals.
**Acceptance**:

* Regen replaces only targeted audio; grid/timing preserved.
* History keeps previous take for A/B within session.
  **UX**: Regen button per section row; history dropdown per track.
  **Deps**: Synth pods; take manager; storage.
  **Metrics**: Regen frequency; acceptance rate of 1st vs 2nd take.

---

### F-MVP-PRJ-01 — Autosave Projects & Versions

**Goal**: Never lose work; enable safe iteration.
**Scope**: Autosave on change; manual snapshot with note.
**Acceptance**:

* Reload restores latest autosave.
* Version list displays timestamp + note; restore works.
  **UX**: Version menu with “Snapshot” button.
  **Deps**: Project DB; storage GC policy.
  **Metrics**: Restores per user; version count per project.

---

### F-MVP-GOV-01 — Content & Licensing Guardrails

**Goal**: Reduce legal/abuse risk without blocking creativity.
**Scope**: Notices for third‑party lyric use; export warning; disallow hateful/illegal content; rate limiting.
**Acceptance**:

* If lyrics appear to be third‑party, show non‑blocking export notice.
* Blocklisted content is prevented with clear reason.
* System logs decisions for admin review.
  **UX**: Inline non‑modal notice; link to policy.
  **Deps**: Policy service; content filter.
  **Metrics**: False‑positive rate; blocked attempts.

---

### F-MVP-REF-01 — Reference Melody (Private Preview ≤30s)

**Goal**: Let users steer vibe with a short reference without enabling near‑copies to be exported.
**Scope**: Upload audio/MIDI; detect key/tempo; extract melodic contour and rhythmic grid.
**Acceptance**:

* System produces normalized `RemixFeatures` JSON from ≤ 30s reference.
* UI labels reference as **Private**; export disabled until a transformed melody passes checks.
* If extraction fails, fallback to genre defaults.
  **UX**: “Add Reference” chip; waveform + key/BPM badges.
  **Deps**: Analyzer pod; project storage for feature vectors only.
  **Metrics**: Reference attach rate; acceptance of first remix topline.

---

## 3) V1 Enhancements

### F-V1-REF-02 — Remix Melody (Similarity‑Guarded)

**Goal**: Compose a new topline that evokes the reference while respecting originality thresholds.
**Method**: Contour guidance (coarse pitch direction + range), rhythmic scaffolding (stress/phrase length), reharmonization, ornament randomization.
**Acceptance**:

* Melodic interval n‑gram overlap ≤ threshold (e.g., 18%).
* DTW similarity score below export gate; rhythm Jaccard below threshold.
* Passes checker; otherwise export blocked with tips.
  **UX**: “Remix” badge with similarity meter.
  **Deps**: Melody generator; similarity engine; policy service.
  **Metrics**: Block rate vs Auto‑diversify fixes; satisfaction on allowed exports.

### F-V1-REF-03 — Similarity Budget Control

**Goal**: Give users understandable control over originality.
**Scope**: Slider (Remix ↔ Original) mapped to thresholds and regularization strength.
**Acceptance**:

* Slider deterministically updates preview characteristics given seed.
* Compliance visual updates live on regeneration.
  **UX**: Slider + concise labels; info popover.
  **Deps**: Parameter bridge to generator + checker.
  **Metrics**: Usage vs default; perceived quality lift.

### F-V1-REF-04 — Similarity Checker & Export Gating

**Goal**: Prevent near‑copies; provide guidance to pass.
**Scope**: Combine interval n‑grams, DTW, rhythm Jaccard, motif hashing; export gating with explanations.
**Acceptance**:

* Report lists which sections exceed thresholds and proposed fixes (key shift, phrase length change, rhythm offset).
* “Auto‑diversify” regenerates with stronger constraints.
  **UX**: Non‑blocking panel with green/amber/red meter; printable report in export zip.
  **Deps**: Checker service; UI bindings; export pipeline.
  **Metrics**: % blocked → fixed; tickets per 1k generations.

### F-V1-ART-03 — Backing Vocals/Harmonies Generator

**Goal**: Automatic 2–4 part harmonies in selected sections.
**Scope**: Styles (gospel, barbershop, pop thirds), vowel selection, spread.
**Acceptance**:

* Harmonies follow key and voice ranges.
* Separate stems per harmony part.
  **UX**: “Add Harmonies” panel with style presets.
  **Deps**: Harmony writer; voice synth multi‑track.
  **Metrics**: Harmony usage; regen rate.

### F-V1-MIX-02 — Era & Space Presets

**Goal**: Faster vibe dialing with authentic chains.
**Scope**: Rooms (club, hall), tape/console profiles, mono fold‑down.
**Acceptance**:

* Presets deterministic and revertible; export matches preview.
  **UX**: Preset browser; A/B compare.
  **Deps**: FX chains library; convolver IRs.
  **Metrics**: Preset popularity; time‑to‑export.

### F-V1-GEN-04 — Groove/Swing/Humanization Controls

**Goal**: Reduce quantized feel; genre‑accurate grooves.
**Scope**: Swing %, micro‑timing jitter, velocity humanization per instrument.
**Acceptance**:

* Adjustments modify subsequent generations and (where possible) nudge existing latent plans.
  **UX**: Advanced tab sliders with safe ranges.
  **Deps**: Synth parameters; planner feedback.
  **Metrics**: Usage vs default; quality lift.

### F-V1-STR-03 — Song Blueprints

**Goal**: High‑level templates for common forms.
**Scope**: AABA, Verse‑Chorus‑Bridge variants, 12‑bar progressions.
**Acceptance**:

* Selecting a blueprint reconfigures sections; lyrics maintain sensible attachment.
  **UX**: Blueprint gallery with previews.
  **Deps**: Preset definitions.
  **Metrics**: Adoption; reduced edit churn.

### F-V1-COL-01 — Shareable Preview Links

**Goal**: Lightweight collaboration for feedback.
**Scope**: Read‑only preview page; comment pins per section.
**Acceptance**:

* Link exposes low‑bitrate preview; expires or revocable.
  **UX**: Share modal with copy link + expiry.
  **Deps**: Tokenized links; CDN preview.
  **Metrics**: Shares/project; comment engagement.

### F-V1-EXP-03 — Stem Packs with Metadata

**Goal**: Make downstream production smoother.
**Scope**: Include cue JSON (BPM, key, section map), track naming conventions.
**Acceptance**:

* Major DAWs import stems aligned; cue metadata readable.
  **UX**: Export options include “DAW pack”.
  **Deps**: Metadata writer.
  **Metrics**: DAW pack usage; support tickets.

### F-V1-PAY-02 — Pro Controls: Similarity Budget Slider

**Goal**: Restrict advanced Remix controls to Pro tier and enforce end‑to‑end.
**Scope**: UI gating, server‑side policy enforcement, plan checks on `/remix/melody` and `/check/similarity`.
**Acceptance**:

* Non‑Pro users see disabled slider with tooltip; Pro users can adjust.
* Server validates plan on every request; rejects non‑Pro attempts.
  **UX**: Lock icon + “Pro” badge; upsell link.
  **Deps**: Plan service; API guards.
  **Metrics**: Upsell conversion; misuse rejects.

### F-V1-PAY-03 — Priority Queue & API Access

**Goal**: Faster turnaround and programmatic control for Pro users.
**Scope**: Priority lanes for GPU jobs; API keys with rate‑limits.
**Acceptance**:

* Jobs from Pro users observe lower queue latency P50/P95.
* API keys scoped per user; rate‑limit + revoke.
  **UX**: Plan page shows current priority; API key management UI.
  **Deps**: Queue with priorities; API gateway/ratelimiter.
  **Metrics**: Queue latency by tier; API usage.

---

## 4) Future / Backlog

* **F-FUT-ART-04 Group Mode (3+ artists):** Complex ensembles, choir builder.
* **F-FUT-GEN-05 Live Co‑Compose:** Rolling preview while arranging.
* **F-FUT-COL-02 Multi‑editor:** Real‑time collab with roles.
* **F-FUT-GOV-02 Cover Licensing Helper:** Links or integrations to obtain lyric licenses for public release.
* **F-FUT-UX-01 DAW‑Lite Pianoroll:** Micro‑edits to melody contours.

---

## 5) Cross‑cutting Requirements

* **Performance Targets:** First 30‑sec preview ≤ 45s; section regen ≤ 20s.
* **Observability:** Per‑stage traces; attach plan JSON to runs; seed reproduction.
* **Determinism:** Plans checkpointed; re‑runs with same seed produce same envelope.
* **Accessibility:** Keyboard navigation for editor and mixer; captions for previews.

---

## 6) Acceptance Criteria (Consolidated)

* Plans (`ArrangementSpec`, `VocalScore`) validate against schemas.
* Stems time‑align to BPM grid and share common start.
* Duet assigns lines to two artists and renders distinct, phase‑coherent tracks.
* Mixer presets are deterministic; export equals preview within 0.5 dB peak variance.
* Exports include metadata (title, BPM, key, genre, artists) and optional cue JSON.
* **Remix**: Reference is private; transformed melody passes similarity check before export; slider respects plan gating.

---

## 7) Metrics & Instrumentation

* **Activation:** Time to first preview; % projects reaching export.
* **Quality:** User take ratings per section; regen counts; similarity block rate.
* **Engagement:** Edits per project; audition plays; duet/Remix usage.
* **Monetization:** Stem exports/user; preset usage by tier; upsell from Free→Creator→Pro.

---

## 8) Dependencies Map

* Planner pod → `ArrangementSpec`
* Vocal score generator → `VocalScore`
* Music synth pod → Instrument stems
* Melody generator (Remix) → Topline guide
* Voice synth pod → Vocal stems
* Similarity checker → Report/gating
* Mix pod → Master/render
* Storage/DB → Projects, versions, assets
* Plan service → PAY gating & priorities

---

## 9) Open Questions

* Minimum stem set per genre for MVP (2 vs 4 instruments)?
* Allow reference for rhythm/groove‑only (no pitch) as a low‑risk mode?
* Should duet be MVP or V1 if voice training time slips?

---

## 10) Out‑of‑Scope (Confirm)

* Real artist voice cloning.
* Melody extraction or reuse from copyrighted works.
* Full DAW feature parity.
