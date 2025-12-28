# Open-Source Audio Separation and Speaker Diarization: A Technical Guide

**Demucs + pyannote.audio** form the strongest open-source stack for your requirements, both MIT-licensed and Python-native. For audio source separation, Demucs v4 (htdemucs) delivers state-of-the-art quality at **9.2 dB SDR** for 4-stem separation, while BS-Roformer models push to **11.9 dB** for vocal/instrumental separation. For speaker diarization, pyannote.audio dominates with **11-17% DER** across standard benchmarks and offers a unique speech-separation pipeline that outputs actual per-speaker audio tracks rather than just timestamps. Both technologies run efficiently on 8-24GB VRAM GPUs and integrate cleanly with Runpod serverless infrastructure using standard PyTorch containers.

## Audio source separation: Demucs leads for versatility

The audio source separation landscape in 2025 centers on three architectures: hybrid transformer (Demucs), band-split transformer (BS-Roformer), and the older U-Net (Spleeter). Your requirements for music/speech isolation, vocal extraction, and 4-stem separation are best served by **Demucs v4** as the primary tool, with **Audio-Separator** wrapping multiple model types for flexibility.

| Model                  | Vocals SDR   | 4-Stem | Min VRAM | Speed (5min) | License |
| ---------------------- | ------------ | ------ | -------- | ------------ | ------- |
| **Demucs htdemucs_ft** | 8.33 dB      | ✓      | 3GB      | 40s          | MIT     |
| **BS-Roformer (2025)** | **11.89 dB** | ✓      | 8GB      | 60-120s      | MIT     |
| Spleeter               | 5.90 dB      | ✓      | 4GB      | **3s**       | MIT     |
| Open-Unmix             | 5.60 dB      | ✓      | 4GB      | 30s          | MIT\*   |

**Demucs v4** (https://github.com/adefossez/demucs) provides the best balance of quality, speed, and versatility. The htdemucs model handles all your use cases: **4-stem** (vocals, drums, bass, other), **6-stem** (adds piano, guitar), and **2-stem** vocal/instrumental via the `--two-stems=vocals` flag. GPU requirements scale from 3GB VRAM with `--segment 8` to 7GB for default settings. Processing a 5-minute song takes 4-8 seconds on a V100 with htdemucs, or 30-40 seconds with the fine-tuned htdemucs_ft variant that delivers slightly better quality.

**BS-Roformer and Mel-Band Roformer** models represent the current quality ceiling, reaching **11.89 dB** vocal SDR on benchmarks—substantially better than Demucs. These models are accessible through the **Audio-Separator** library (https://github.com/nomadkaraoke/python-audio-separator), which provides a unified Python API for Demucs, UVR-MDX, and Roformer models. The tradeoff is 2-4x slower inference and 8-16GB VRAM requirements.

```python
# Audio-Separator with best quality model
from audio_separator.separator import Separator
separator = Separator(output_format="wav")
separator.load_model("model_mel_band_roformer_ep_3005_sdr_11.4360.ckpt")
vocals, instrumental = separator.separate("audio.mp3")
```

**Critical limitation**: None of these tools directly separate speech from music in dialogue-over-background-music scenarios. They're designed for music demixing. For speech/music separation, you'll need to chain with a Voice Activity Detection model like **Silero VAD** or use the diarization pipeline described below.

## Speaker diarization: pyannote delivers both timestamps and separation

Speaker diarization tools fall into two categories: those providing **timestamps only** ("Speaker A: 0:00-0:15") versus actual **audio separation** (separate WAV per speaker). Most tools only do the former. **pyannote.audio** uniquely offers both through its speech-separation pipeline.

| Tool                           | DER (AMI) | Separation | VRAM | License      | Speed   |
| ------------------------------ | --------- | ---------- | ---- | ------------ | ------- |
| **pyannote 3.1**               | 22.4%     | Timestamps | 8GB  | MIT          | 37x RT  |
| **pyannote community-1**       | 17.0%     | Timestamps | 8GB  | CC-BY-4.0    | 37x RT  |
| **pyannote speech-separation** | —         | **Audio**  | 16GB | MIT          | ~10x RT |
| SpeechBrain SepFormer          | —         | **Audio**  | 8GB  | Apache 2.0   | ~5x RT  |
| NVIDIA NeMo Sortformer         | 13-21%    | Timestamps | 48GB | Apache 2.0   | 214x RT |
| DiariZen                       | **13.9%** | Timestamps | 8GB  | **CC-BY-NC** | ~30x RT |

**pyannote/speaker-diarization-3.1** (https://huggingface.co/pyannote/speaker-diarization-3.1) handles standard diarization with **15.3M downloads** and active maintenance. It achieves 11-28% DER across standard benchmarks (VoxConverse: 11.2%, CALLHOME: 26.7%, AMI: 17.0%). Processing runs at **31 seconds per hour of audio** on an H100, or roughly 37x real-time.

**pyannote/speech-separation-ami-1.0** (https://huggingface.co/pyannote/speech-separation-ami-1.0) is the critical model for your requirement of isolating each speaker's audio. This pipeline jointly performs diarization and separation, outputting both timestamps and **separate WAV files per speaker**:

```python
from pyannote.audio import Pipeline
pipeline = Pipeline.from_pretrained(
    "pyannote/speech-separation-ami-1.0",
    use_auth_token="HF_TOKEN"
)
diarization, sources = pipeline("meeting.wav")
# sources.data contains separated audio: shape (samples, num_speakers)
for i, speaker in enumerate(diarization.labels()):
    scipy.io.wavfile.write(f"{speaker}.wav", 16000, sources.data[:, i])
```

**SpeechBrain SepFormer** (https://huggingface.co/speechbrain/sepformer-wsj02mix) offers an Apache 2.0 alternative for actual audio separation, achieving **22.4 dB SI-SNRi** on the WSJ0-2Mix benchmark. The limitation: it requires knowing the speaker count in advance and was primarily trained on 2-speaker mixtures. For unknown speaker counts, combine pyannote diarization first to count speakers, then apply SepFormer.

## Licensing considerations prevent surprises in production

All recommended tools are **commercially viable** with careful attention to specific license terms:

| Component         | Code License | Model License       | Commercial OK |
| ----------------- | ------------ | ------------------- | ------------- |
| Demucs            | MIT          | MIT                 | ✓             |
| Audio-Separator   | MIT          | MIT                 | ✓             |
| Spleeter          | MIT          | MIT                 | ✓             |
| pyannote.audio    | MIT          | MIT + HF conditions | ✓\*           |
| SpeechBrain       | Apache 2.0   | Apache 2.0          | ✓             |
| DiariZen          | Apache 2.0   | **CC-BY-NC**        | ✗             |
| Open-Unmix (umxl) | MIT          | **CC-BY-NC-SA**     | ✗             |

**pyannote licensing nuance**: The code and models are MIT-licensed, but accessing models requires a free Hugging Face account and accepting user conditions (primarily data collection for analytics). This isn't a commercial restriction but requires the HF account integration in your deployment.

**DiariZen** offers the best DER scores (13.9% on AMI) but its **CC-BY-NC-4.0** license restricts commercial use—only suitable if your deployment is non-commercial.

Demucs was archived by Meta in January 2025; development continues at the maintainer's fork (github.com/adefossez/demucs). Spleeter is in maintenance mode since 2020 but remains functional.

## Architecture recommendation: modular pods with shared patterns

Your existing modular inference pod architecture maps well to this stack. The decision between unified and modular deployment depends on scaling requirements:

**Option A: Unified Service (MVP recommended)**
Single 24GB GPU pod handles both source separation and diarization sequentially. This minimizes infrastructure complexity and works well for moderate throughput.

```
┌─────────────┐    ┌──────────────────────────────────┐    ┌─────────────┐
│ Audio Input │───▶│ Combined Pod (A10 24GB)          │───▶│ Results     │
│             │    │ - Demucs (source separation)     │    │ (S3 bucket) │
│             │    │ - pyannote (diarization)         │    │             │
└─────────────┘    └──────────────────────────────────┘    └─────────────┘
```

**Option B: Modular Microservices (scaling recommended)**
Separate pods allow independent scaling and GPU optimization per task:

```
┌─────────────┐    ┌────────────────────┐
│ Audio Input │───▶│ Source Separation  │ (A10 24GB - Demucs)
└─────────────┘    │ Pod                │
       │          └────────────────────┘
       │
       └──────────▶┌────────────────────┐
                   │ Speaker Diarization│ (L4 24GB - pyannote)
                   │ Pod                │
                   └────────────────────┘
```

**No unified model exists** that performs both music source separation AND speaker diarization well. These are architecturally different problems (frequency-domain demixing vs. embedding-space clustering). Research prototypes like **PixIT** explore joint training but aren't production-ready.

**Practical recommendation**: Start with Option A for your MVP using a single **A10 24GB or RTX A5000** pod. The processing flow separates vocals first (Demucs), then runs diarization on the vocal track (pyannote). Split into microservices when you need independent scaling.

## Runpod deployment: Docker templates and GPU selection

The recommended Runpod configuration uses **PyTorch 2.1 with CUDA 12.1** and pre-baked models to minimize cold starts:

```dockerfile
FROM runpod/pytorch:2.1.0-py3.10-cuda12.1.0-devel-ubuntu22.04
RUN apt-get update && apt-get install -y ffmpeg libsndfile1
RUN pip install --no-cache-dir runpod demucs>=4.0.1 pyannote.audio>=3.3.0 torchaudio>=2.1.0

# Fix pyannote GPU support
RUN pip uninstall -y onnxruntime && pip install onnxruntime-gpu

# Pre-download models during build
RUN python -c "from demucs.pretrained import get_model; get_model('htdemucs')"
ENV HF_TOKEN=""
COPY handler.py /
CMD ["python", "-u", "/handler.py"]
```

**GPU selection for Runpod serverless:**

| Workload    | GPU  | VRAM | Est. Cost  | Use Case                       |
| ----------- | ---- | ---- | ---------- | ------------------------------ |
| Testing     | T4   | 16GB | $0.031/min | Development, short files       |
| Production  | A10  | 24GB | $0.076/min | Balanced quality/cost          |
| Heavy batch | A100 | 40GB | $0.14/min  | Long recordings, parallel jobs |

**Critical dependency issue**: pyannote ships with CPU-only onnxruntime by default. Force-reinstall onnxruntime-gpu as shown above or diarization will run on CPU despite having a GPU.

**Cold start mitigation**: Model loading adds 30-60 seconds to cold starts. Pre-download models into the Docker image and maintain 1-2 warm workers in production. Runpod's Hugging Face caching can also reduce this.

## Implementation complexity and processing estimates

Based on the research, here are realistic complexity estimates:

**Source Separation Pod (Demucs):**

- Implementation: **Low** (2-3 days). Demucs has excellent Python API and documentation
- Processing: 4-40 seconds per 5-minute song depending on model
- Memory: Load model once, process sequentially; ~2GB model weight + ~4GB working memory

**Speaker Diarization Pod (pyannote):**

- Implementation: **Medium** (3-5 days). Requires HF token setup, understanding pipeline config
- Processing: ~31 seconds per hour of audio on H100 (scales with GPU tier)
- Memory: 4-8GB base; speech-separation pipeline needs 16GB

**Speaker Audio Separation (pyannote speech-separation):**

- Implementation: **Medium-High** (1 week). Less documentation, newer pipeline
- Processing: Slower than diarization alone (~10x real-time)
- Memory: 16GB recommended for reliable operation

**Combined Pipeline:**

- Total implementation: **1-2 weeks** for production-ready deployment
- Total processing: ~2-5 minutes for a 1-hour podcast episode (separation + diarization)

## Gotchas and limitations to anticipate

Several technical issues surfaced across the research that warrant attention:

**pyannote CPU bottleneck**: The clustering step in pyannote is CPU-bound. GitHub issues report V100 GPUs sitting idle while CPU runs at 100%. Select Runpod instances with strong CPUs (8+ vCPUs) alongside GPUs.

**Overlapping speech**: Standard diarization assigns each audio frame to one speaker. Overlapping speech (two people talking simultaneously) requires pyannote's speech-separation pipeline or SpeechBrain's SepFormer—timestamp-only diarization cannot handle this.

**Speaker count limits**: NVIDIA NeMo Sortformer caps at 4 speakers with degraded performance above that. SpeechBrain SepFormer assumes 2 speakers unless retrained. pyannote handles variable speaker counts dynamically.

**Background noise extraction**: None of the source separation tools directly extract "background noise" as a category. For noise removal, use the UVR de-noise models available through Audio-Separator, or chain with a denoising model like **DeepFilterNet**.

**Long file handling**: Memory grows with audio length. For recordings over 30 minutes, implement chunked processing with overlap windows to avoid OOM errors. Demucs has a `--segment` flag for this; pyannote handles it internally.

**Spleeter deprecation**: While functional, Spleeter uses TensorFlow 1.x patterns and has known compatibility issues with modern Python/CUDA stacks. Avoid mixing with PyTorch-based tools in the same container.

## Recommended implementation path

For your MVP with zero API costs on Runpod serverless:

1. **Phase 1 - Source Separation Pod** (Week 1): Deploy Demucs htdemucs for 4-stem separation. Use Audio-Separator wrapper if you need access to higher-quality Roformer models later.

2. **Phase 2 - Speaker Diarization Pod** (Week 2): Deploy pyannote/speaker-diarization-3.1 for timestamp-based diarization. If you need actual audio separation per speaker, use pyannote/speech-separation-ami-1.0 instead.

3. **Phase 3 - Integration** (Week 3): Connect pods through your existing orchestration. For speaker-separated audio from music, chain: audio → Demucs vocals extraction → pyannote speech-separation.

**Key resources:**

- Demucs: https://github.com/adefossez/demucs
- Audio-Separator: https://github.com/nomadkaraoke/python-audio-separator
- pyannote.audio: https://github.com/pyannote/pyannote-audio
- pyannote models: https://huggingface.co/pyannote
- SpeechBrain: https://github.com/speechbrain/speechbrain
- Runpod serverless docs: https://docs.runpod.io/serverless/overview

All recommended tools are MIT or Apache 2.0 licensed, Python-native, GPU-accelerated, and actively maintained—matching your technical constraints precisely.
