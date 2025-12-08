# Bluebird — Product Vision

**Version:** 0.2 (Aligned)
**Created:** 11/Nov/2025
**Owner:** Mike Blakeway
**Product:** Bluebird
**Last Updated:** 11/Nov/2025

---

## 1) Vision Statement

Bluebird lets anyone turn words into **original, release‑ready songs**—composed, arranged, and performed by our **bespoke AI artists**—with the creative control of a modern producer and the legal clarity to publish. The optional Remix capability accepts a short private reference to guide vibe/contour while enforcing originality through similarity checks and export gating.

---

## 2) Problem & Opportunity

* **Creation stall**: Many creators have lyrics or themes but lack the skills/time to compose, arrange, record, and mix.
* **Workflow friction**: Prompt‑only music tools feel random; DAWs are powerful but heavy for non‑engineers.
* **Rights risk**: Voice cloning and near‑copy melodies are legally fragile, limiting commercial use.
* **Opportunity**: Provide a controllable, **rights‑aware** music creation flow from text to stems—fast enough for social, good enough for pro workflows.

---

## 3) What Bluebird Delivers

* **Original Composition**: New melody, harmony, and arrangement from lyrics and genre presets.
* **Directed Generation**: Explicit controls for structure, BPM, instrumentation, groove, harmonies, and mix.
* **AI Artist Roster**: In‑house voices with distinct timbres/ranges; duet at MVP; backing/group in V1+.
* **Remix (Guarded)**: Private reference (≤30s) informs contour/rhythm; Similarity Budget + checker protect exports.
* **Pro Output**: Master + per‑stem WAV, cue metadata, era/space presets for downstream DAW use.

---

## 4) Strategic Objectives (12–18 months)

1. **Quality at speed**: First 30‑sec preview ≤ 45s; full 3‑min track ≤ 8 min (P50).
2. **Control without overwhelm**: Defaults that sound great; progressive disclosure for power users.
3. **Publishable by default**: Original audio only, no celebrity cloning; Remix export gated by similarity.
4. **Creator‑grade workflow**: Stems, snapshots, shareable previews, and collaboration hooks.
5. **Healthy unit economics**: Section‑scoped jobs, cache by seed, Pro priority lanes.

---

## 5) Product Pillars

* **Original by Design** — Never copy masters or melodies; always compose anew.
* **Explainable Control** — Show the plan (ArrangementSpec/VocalScore) and let users tweak it.
* **House Voices** — Ownable timbres with documented ranges and style notes.
* **Remix, Safely** — Reference guidance + Similarity Budget + export gating.
* **Pro‑Ready Output** — Stems, cue sheets, era presets, consistent loudness.
* **Trust & Compliance** — Clear policy, minimal data retention, transparent checks.

---

## 6) Target Users & Jobs‑to‑Be‑Done

* **Indie Songwriter** — “Turn my lyrics into a compelling song in X genre with Y voice.”
* **Producer/Beatmaker** — “Give me stems I can arrange/mix quickly in my DAW.”
* **Video Creator** — “I need safe soundtrack cues that nod to a vibe without licensing headaches.”
* **Educator** — “Demonstrate genre translation, arrangement, and vocal production safely.”

---

## 7) Differentiation

* **Schema‑driven planning** (ArrangementSpec/VocalScore) vs one‑shot generation.
* **Multi‑artist direction** (duet/group) with line‑level mapping.
* **Similarity‑guarded Remix** that is measurable, explainable, and enforceable.
* **Consistent stems + cue metadata** that drop cleanly into pro workflows.

---

## 8) Success Metrics

**North Star**: Count of **export‑safe songs** created per week with MTR ≥ 4.2/5.

### **Drivers**

* Time‑to‑first‑preview; D1 activation.
* Section regen acceptance rate.
* Remix compliance pass rate (auto, no human intervention).
* Stems exports/user/week; share rate; D7/D30 retention.
* GPU minutes per exported minute (cost efficiency).

---

## 9) Scope (MVP) & Non‑Goals

### **MVP**

* Lyrics → original composition (melody/harmony/arrangement).
* Genre presets; structure editor; 3–5 AI artists; duet; simple harmonies.
* Per‑section instrument generation; lead vocal synthesis; mixer with era presets.
* Master + stems export; autosave + snapshots; shareable low‑bitrate previews (optional V1).
* Remix: Private reference ≤ 30s; Similarity Budget (default only); similarity check on export.

### **Non‑Goals (MVP)**

* Real‑artist voice cloning.
* Near‑identical melody replication.
* Full DAW parity (advanced MIDI/plugins) or live continuous performance.

---

## 10) Go‑to‑Market (first 6 months)

* **Audience**: Indie creators, producers, and short‑form video editors.
* **Positioning**: "Original songs from your lyrics—Remix the vibe, not the melody."
* **Beta**: Closed cohort (50–100) for preset/genre coverage tuning and AI‑artist QA.
* **Launch**: Tiered plans (Free/Creator/Pro) with Pro priority lanes + Similarity Budget controls.
* **Content**: Tutorials on lyrics→song, arrangement basics, and Remix safety.

---

## 11) Ethics & Policy Commitments

* No celebrity cloning; disclose synthetic vocals.
* Store **feature vectors** not raw reference audio (opt‑in for retention).
* Clear block reasons on export with practical guidance to pass.
* Disallow hateful/illegal content; rate‑limit abuse; auditable decisions.
* Right‑to‑erasure for projects and media.

---

## 12) Roadmap Themes

* **MVP**: Composition → stems → vocals → mix → export; Remix analyzer + checker.
* **V1**: Backing vocals, groove/humanization, era/space presets, blueprint forms, Similarity Budget slider, shareable previews.
* **V2**: Group mode (3+ voices), DAW‑lite pianoroll, live co‑compose, cover‑licensing helper.

---

## 13) Risks & Mitigations

* **Quality variance** → schema‑driven plans; per‑section regen; user ratings loop; golden tests.
* **Similarity false blocks** → transparent reports; Auto‑diversify; genre‑adjusted thresholds.
* **GPU cost spikes** → section‑scoped jobs; caching; spot capacity; Pro priority.
* **User overwhelm** → opinionated presets; progressive disclosure; clear meters and copy.

---

## 14) Alignment Check (with Overview & Architecture)

* Canonical endpoints: `/remix/*`, `/plan/*`, `/render/*`, `/mix/final`, `/check/similarity`, `/export`.
* Strict types: `ArrangementSpec`, `VocalScore`, `RemixFeatures`, `SimilarityReport`, `ExportBundle`.
* Performance targets and plan gating (Similarity Budget controls for Pro) are consistent.

---

## 15) Open Questions

* Default Similarity Budget & thresholds by genre?
* Reference length cap (30s vs 45s) vs analyzer cost/quality.
* Launch set of 6–8 genres and 3–5 AI artists for widest coverage.
* Rhythm‑only Remix mode as a low‑risk preset?
