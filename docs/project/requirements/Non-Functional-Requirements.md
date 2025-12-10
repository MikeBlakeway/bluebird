# Non‑Functional Requirements

NFR-Perf: Meet SLOs in R‑M9; track P50/P95; autoscale GPU pods; queueing with fair scheduling.

NFR-Reliability: Idempotent orchestrations; resumable renders; exactly‑once export packaging.

NFR-Security: All media at rest encrypted; signed URLs for artifacts; references private; audit events for uploads/exports.

NFR-Privacy: No training on user media; data retention policy configurable (default 30 days, user‑deletable).

NFR-Observability: Distributed tracing across orchestrator and pods; structured logs; metrics dashboard (TTFP, GPU‑min/minute of audio, pass rate).

NFR-Compliance: Terms/consents for uploads; export gating policy documented.

NFR-Scalability: 50 concurrent jobs at launch, target 200 with horizontal scaling.

NFR-Interoperability: Stems importable to major DAWs (Ableton/Logic/Pro Tools/Reaper) with alignment markers.

NFR‑Perf: Edge caching through CDN for previews/exports; WebAudio local audition to reduce unnecessary GPU regenerations.

NFR‑Reliability: Idempotency keys (Idempotency-Key header) enforced on all POST endpoints.

NFR‑Security/Privacy: Default persistence of reference features (not raw audio); raw reference retained only if user opts in.

NFR‑Scalability: Named queues with per‑plan priorities; fair scheduling; SSE channels fan‑out friendly.

## Constraints & Assumptions

A1: 44.1kHz/24‑bit WAV primary, 320kbps MP3 for quick share; max song length 3:30.

A2: Inference via serverless GPU; cold start amortized by warm pools.

A3: Similarity threshold calibrated on melody interval n‑grams + rhythmic DTW; blocking when score ≥ pre‑set threshold.

A4: Budget target: ≤$0.40 GPU cost per 30‑sec preview; ≤$2.50 per 3‑min full render at P50.

A5: IDE integration via CLI and VS Code extension; agent prompts supplied as system templates.

Please review this Requirements section. If approved, I’ll proceed to the Method (system architecture, data contracts, algorithms, and PlantUML diagrams).\*
