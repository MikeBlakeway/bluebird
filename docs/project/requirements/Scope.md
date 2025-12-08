# Scope & Priorities (MoSCoW)

## Must Have (MVP)

R-M1 (unchanged): Lyrics → Song flow with presets; 30s preview ≤45s.

R-M2 (unchanged): Per‑section generation & selective regen ≤20s P50.

R-M3 (unchanged): 3–5 AI artist voices; harmonies; duet.

R-M4 (clarified): Remix Reference (≤30s, private). Export gated by Similarity Checker with melody interval n‑grams + rhythmic DTW; show actionable report.

R-M5 (clarified): Pro exports: mastered stereo + aligned stems; export sample rate default 48 kHz/24‑bit, selectable 44.1 kHz/24‑bit at export; MP3 320 kbps for share; BPM/key + BWF markers.

R-M6 (unchanged): Simple mixer with era presets; loudness target −14 LUFS.

R-M7 (unchanged): Project mgmt (autosave, Takes, seeds).

R-M8 (unchanged): Observability (job timeline, seeds, artifacts, downloadable report).

R-M9 (unchanged): SLOs — First preview ≤45s P50; per‑section regen ≤20s P50; full 3‑min ≤8 min P50; P95 ≤2×.

R-M10 (tightened): Safety & compliance — reference audio never used to train; by default store feature vectors (melody/rhythm/key/BPM) instead of raw reference audio; explicit rights affirmation; profanity filter.

R-M11 (unchanged): Account & auth (magic link).

R-M12 (expanded): Cost controls — per‑job GPU mins metered; max duration 3:30; idempotency keys prevent duplicate charges; priority lanes for Pro.

R-M13 (new): Realtime progress via SSE — GET /jobs/:id/events emits typed JobEvent updates for planner/render/mix/check/export.

## Should Have

R-S1 (unchanged): Section map editor.

R-S2 (unchanged): Genre/era presets.

R-S3 (unchanged): Command palette (⌘K).

R-S4 (unchanged): In‑IDE hooks (CLI/VS Code).

R-S5 (unchanged): Take rating (1–5) with reason tags.

R-S6 (unchanged): Accessibility + themes.

R-S7 (unchanged): Usage analytics (privacy‑respecting).

R-S8 (new): Local WebAudio preview engine (client‑side mixer for instant A/B of takes/sections).

R-S9 (new): CDN fronting preview/exports with short‑TTL signed URLs.

R-S10 (new): Similarity Budget control (slider) — exposed to Pro tier; Free/Creator uses fixed safe defaults.

## Could Have

R-C1: Guide melody staff/piano‑roll view.

R-C2: Lyric syllable meter assistant.

R-C3: Backing vocal pad generator.

R-C4: Mobile share link with watermark.

## Won’t Have

R-W1: Celebrity voice cloning.

R-W2: Full DAW parity.

R-W3: Real‑time streaming generation.

R-W4: Collaboration/multi‑user editing.
