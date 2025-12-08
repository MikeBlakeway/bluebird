# UI/UX Requirements (high level)

U1: Primary screens: (a) Project Dashboard, (b) Song Workspace (Lyrics panel, Structure grid/timeline, Artist & Genre sidebar, Mixer tab, Remix panel, Similarity Report drawer, Export modal).

U2: Song Workspace layout: 2‑pane—left (Lyrics + structure), right (Preview/Mixer). Section chips show status: Generated / Locked / Dirty / Rendering.

U3: Remix panel: drag‑and‑drop reference (≤30s), waveform preview, helper text about originality, similarity status pill (Pass/Borderline/Block) with “View Report”.

U4: Similarity Report drawer: sections with melody/rhythm similarity gauge, top offending intervals/motifs, recommendation to tweak BPM/key/contour. CTA: “Auto‑diversify and regen”.

U5: Takes & Snapshots: vertical list with seed, date, rating; hover to audition; pin favorite; compare A/B.

U6: Per‑section controls: regen, lock, solo playback, harmony on/off, instrument preset.

U7: Mixer: simple channel list with meters; per‑track gain + mute/solo; preset selector; loudness readout.

U8: Export modal: select duration (full/preview), stems on/off, formats, include markers, include report; shows similarity status and blocks if “Block”.

U9: Empty/error/loading states: skeletons during plan/render; toast with ETA; retry with last seed.

U10: Keyboard shortcuts: space = play/stop; R = regen section; L = lock; H = toggle harmonies; E = export; ? = cheatsheet.

U11: Add to Song Workspace: A/B compare controls and Local Preview Mixer area; similarity Status Pill shows Pass/Borderline/Block with link to report; Budget slider (Pro) in Remix panel.

U12: Add to Export modal: Sample rate selection (48 kHz default; 44.1 kHz optional) + warning if similarity verdict=block.

U13: Add Job Timeline: live updates via SSE (progress %, stage, ETA hint, run‑ID).
