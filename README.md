# ORA

> **Talk to the space. Watch it respond.**  
> A reusable conversational intelligence and spatial action layer for high-value visual digital products.  
> *Demonstrated via the **AURELIA Sanctuary** luxury architectural shortlet reference implementation.*

[![Test Suite](https://img.shields.io/badge/tests-270%20passing-brightgreen)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Devpost](https://img.shields.io/badge/Devpost-Build%20With%20AI%3A%20Basics-blueviolet)](https://learn-ai-basics.devpost.com/)
[![Repository](https://img.shields.io/badge/GitHub-0xaje%2FOra-black)](https://github.com/0xaje/Ora)

---

## What is ORA?

**ORA** is an embodied conversational intelligence layer designed for high-value visual products.

Most websites today trap AI inside a disconnected floating chat bubble in the lower corner of the screen. The chatbot is blind to what the user sees, and the user must still click through complex menus, carousels, and dropdown filters.

**ORA changes this fundamental paradigm:**
Instead of a separate chatbot on top of a website, **the product surface becomes the body of the AI**. 

When a user speaks, ORA directly controls the digital canvas:
- **Navigates spatial coordinates & camera angles** across 2D/3D visualizers.
- **Crossfades environmental ambiances** (e.g., morning daylight to evening sunset).
- **Coordinates acoustic soundscapes** with automated volume ducking during speech turns.
- **Extracts transaction intent** and generates verified transaction passes with mobile messaging handoffs.

---

## Flagship Showcase: AURELIA Sanctuary Reference Environment

To prove ORA in a demanding visual domain, this repository includes **AURELIA Sanctuary** as its flagship concept reference implementation.

AURELIA is a concept modernist desert shortlet residence. Rather than clicking through static photo galleries and room forms, visitors explore the estate through spoken conversation with ORA:
- *"Show me the living room at sunset."* &rarr; The 300-frame canvas smoothly glides to the living room, lighting warms to evening dusk, and background music ducks.
- *"Show me the master suite."* &rarr; Architectural detail placards center into view.
- *"Give me a tour."* &rarr; ORA leads an autonomous guided tour with instant voice barge-in.
- *"Reserve Aurelia for John from October 9th to October 11th."* &rarr; ORA verifies stay dates, deterministically calculates stay total based on the demonstration reference rate ($1,850/night), and generates a glassmorphic **Reservation Request Pass** with **WhatsApp handoff** to coordinate with the host.

---

## The Experience Loop

$$\text{SPEAK} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{EXPLORE} \longrightarrow \text{DECIDE} \longrightarrow \text{REQUEST} \longrightarrow \text{HANDOFF}$$

1. **SPEAK:** Speak naturally via hands-free streaming microphone input.
2. **UNDERSTAND:** Continuous 16kHz PCM audio streams to AssemblyAI v3 WebSocket; fast-path router resolves common directives deterministically in-process, while conversational queries leverage the configured LLM provider.
3. **EXPLORE:** The decoupled `ProductAdapter` navigates the visual canvas: scrubbing frames, switching camera viewpoints, or adjusting lighting.
4. **DECIDE:** The visitor explores architectural features, takes guided tours, and asks questions with genuine voice interruption (barge-in).
5. **REQUEST:** Natural language extraction captures customer parameters (guest name, dates), and authoritative domain logic computes estimated stay totals.
6. **HANDOFF:** Generates a structured digital pass (`READY_FOR_HANDOFF`) and transfers to WhatsApp with prefilled reference details (`AUR-YYYY-XXXX`).

---

## Architecture & Decoupled Product Adapter

ORA is designed to plug into **any** high-value visual product via the formal `ProductAdapter` interface:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                            BROWSER RUNTIME CLIENT                            │
│                                                                              │
│  ┌───────────────────────┐   Spatial Action   ┌───────────────────────────┐  │
│  │     ScrollHero        │◄───────────────────┤      AureliaAdapter       │  │
│  │ (300-Frame 2D Canvas) │   Ambiance Action  │ (Implements ProductAdapter│  │
│  └───────────────────────┘                    └─────────────▲─────────────┘  │
│                                                             │ Typed Actions  │
│  ┌───────────────────────┐                    ┌─────────────┴─────────────┐  │
│  │      SpaceDetail      │◄───────────────────┤         ORA CORE          │  │
│  │ (Master/Bath/Pool)    │   Center Space     │ • Session / Turn Manager  │  │
│  └───────────────────────┘                    │ • Speech Synthesis (TTS)  │  │
│                                               │ • Audio Duck Coordinator  │  │
│  ┌───────────────────────┐   Audio Duck       │ • Fast-Path Router         │  │
│  │   AureliaAtmosphere   │◄───────────────────┤ • Action Bus Dispatcher   │  │
│  │ (WebAudio Soundscape) │                    └─────────────▲─────────────┘  │
│  └───────────────────────┘                                  │ Audio / Turns  │
│                                                             │                │
│  ┌──────────────────────────────────────────────────────────┴─────────────┐  │
│  │                               OraPresence                              │  │
│  │    • Mic Worklet (16kHz PCM16 Mono)                                    │  │
│  │    • AssemblyAI v3 Streaming Client (wss://streaming.assemblyai.com)   │  │
│  │    • Autonomous Grand Tour Sequencer                                   │  │
│  └──────────────────────────────────────────────────────────┬─────────────┘  │
│                                                             │                │
│  ┌──────────────────────────────────────────────────────────┴─────────────┐  │
│  │                 ReservationPass Modal (Commerce Engine)                │  │
│  │    • Displays Reference (AUR-YYYY-XXXX), Dates, Nights, Rate, Total    │  │
│  │    • Primary CTA: "Continue on WhatsApp" -> wa.me deep link            │  │
│  │    • Subscribed to session ReservationStore (HANDOFF_OPENED)           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┼────────────────┘
                                                              │
                              ┌───────────────────────────────┴───────────────┐
                              ▼ (HTTP Token & Converse)                       ▼ (Binary WS)
┌───────────────────────────────────────────────┐   ┌──────────────────────────────────────────┐
│              LOCAL SERVER API                 │   │       ASSEMBLYAI STREAMING STT v3        │
│  • GET  /api/assemblyai/token (Ephemeral JWT) │   │     wss://streaming.assemblyai.com/v3/ws │
│  • POST /api/ora/converse                     │   └──────────────────────────────────────────┘
│    └─ Structured LLM (Ollama / OpenRouter)    │
│    └─ Sanitization & Guardrails               │
└───────────────────────────────────────────────┘
```

---

## Where We Are Today (Current Verified Status)

- **270 Automated Tests Passing** (`npm test`, 0 failures) across 63 test suites.
- **Production Build Verified** (`npm run build`) compiling in ~3.2 seconds.
- **Continuous Voice Streaming:** Real-time microphone worklet with AssemblyAI Universal Streaming v3 and server-side ephemeral token minting.
- **Genuine Voice Barge-In:** Continuous listening during playback with immediate speech cancellation and tour abort when user speaks.
- **Acoustic Harmony:** WebAudio soundscape with dynamic volume ducking during speech turns.
- **Verified Request Flow:** Multi-turn spoken reservation extraction, deterministic calculations ($1,850 reference rate × nights), unique `AUR-YYYY-XXXX` reference generator, and WhatsApp browser deep link handoff.
- **Repository Security:** Zero committed secrets; all credentials protected by `.gitignore`.

---

## Forward Product Roadmap & Integration Ecosystem

ORA is built as an extensible conversational layer with a clear path forward:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                            ORA PRODUCT ROADMAP                               │
└───────┬──────────────────────────────┬──────────────────────────────┬────────┘
        │                              │                              │
        ▼                              ▼                              ▼
  PHASE 1 (NOW)                  PHASE 2 (NEXT)                 PHASE 3 (SCALE)
  • Verified POC                 • Multi-Channel Handoffs       • Omnichannel Enterprise
  • 300-Frame Scrubber           • Telegram & SMS / iMessage    • WhatsApp Cloud API Bot
  • AssemblyAI Streaming v3      • Multi-property catalog       • CRM Webhooks (Salesforce)
  • WhatsApp wa.me Link          • 3D Gaussian Splatting / Three • On-device Whisper / Kokoro
  • Shortlet Reference           • Automotive / Retail Adapters • Multilingual Concierge
```

### 1. Multi-Channel Transaction Handoffs
- **Current:** Verified client-side URL-encoded WhatsApp deep links (`wa.me`).
- **Next:** Direct handoff channels for **Telegram**, **SMS / Apple Messages for Business**, and **Email booking summaries**.
- **Enterprise:** Webhook adapters for **WhatsApp Business Cloud API**, **Twilio**, and **HubSpot / Salesforce Hospitality CRM**.

### 2. Pluggable `ProductAdapter` Ecosystem
- **Luxury Real Estate & Shortlets:** High-end architectural estates, vacation villas *(current Aurelia reference)*.
- **Automotive & EV Showrooms:** Conversational 3D configurators (*"Show me the cockpit in carbon fiber"*, *"Schedule a test drive"*).
- **Bespoke Retail & High Jewelry:** Guided inspection of luxury goods with itemized concierge purchase tickets.
- **Architectural Studios:** Interactive BIM / Matterport walkthroughs for remote clients.

### 3. Spatial Vision & 3D Immersion
- **WebGL / Three.js / Splatting:** Transition from photographic frame scrubber to real-time 3D Gaussian Splatting and orbit cameras.
- **Multimodal Interaction:** Combine voice with pointer/gaze tracking (*"Tell me more about this fixture"*).

### 4. Advanced Voice Intelligence
- **On-Device Speech Synthesis:** Fast local neural TTS (Kokoro / ElevenLabs streaming).
- **Multilingual Support:** Instant conversational translation in French, Spanish, Arabic, and Mandarin.

---

## Tech Stack

- **Frontend:** React 18, TypeScript 5.6, Vite 5.4, Vanilla CSS (Design Tokens, Hardware-Accelerated Transforms)
- **Audio & Media:** WebAudio API (`AureliaAtmosphere` ambient soundscape with dynamic gain ducking), Web Speech Synthesis
- **Voice Intelligence:** AssemblyAI Universal Streaming STT v3 WebSocket
- **Conversational Intelligence:** Ollama (`llama3.2:1b`) / OpenRouter API (`liquid/lfm-2.5-2.6b:free`)
- **Testing:** Node.js native test runner + `tsx` (261 unit & integration tests)

---

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- AssemblyAI API Key (for live speech streaming)
- *(Optional)* Ollama running locally with `ollama run llama3.2:1b` (or OpenRouter API Key)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/0xaje/Ora.git
cd Ora

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your ASSEMBLYAI_API_KEY
```

### Running Locally

```bash
# Start development server
npm run dev

# Open http://localhost:5173 in Chrome or modern browser
```

---

## Architecture Decision: Execution, Privacy & Host Handoff

ORA is designed to run on `localhost:5173` with flexible intelligence configurations:

1. **Inference Choices & Operating Costs:** When running with local Ollama (`llama3.2:1b`), the conversational LLM reasoning phase runs locally with zero LLM API token charges. External transcription (AssemblyAI) or optional external LLM routing (OpenRouter) utilize standard API connections.
2. **Privacy Boundary:** Microphone audio is streamed to AssemblyAI for speech-to-text transcription. When using local Ollama, the LLM reasoning stays on your local machine; when selecting OpenRouter, prompts are sent to the external provider.
3. **Truthful Host Handoff:** Opening WhatsApp formats a structured reservation request message with the local request reference (`AUR-YYYY-XXXX`). If a host number is configured, it addresses the message to that number; otherwise, the visitor chooses the recipient on WhatsApp. Opening WhatsApp does not confirm booking or charge payment.
4. **Localhost vs. Cloud Hosting:** Running locally on `localhost` preserves direct access to local Ollama inference without requiring external server GPU hosting. Devpost guidelines confirm that reviewer evaluation is based on video demonstration and repository code.

---

## Environment Variables

| Variable | Description | Exposure |
| :--- | :--- | :--- |
| `ASSEMBLYAI_API_KEY` | AssemblyAI key used exclusively by the local server/Vite middleware to mint ephemeral v3 WebSocket tokens. Required for live voice. | Server-only (Never bundled in client) |
| `LLM_PROVIDER` | `ollama` (default for private local execution) or `openrouter`. | Server-only |
| `OLLAMA_BASE_URL` | Endpoint for local Ollama server (default: `http://127.0.0.1:11434`). | Server-only |
| `OLLAMA_MODEL` | Local model name (e.g. `qwen2.5:1.5b`, `qwen2.5:7b`). Run `ollama list` to see installed models. | Server-only |
| `OPENROUTER_API_KEY` | OpenRouter API Key (alternative cloud LLM requiring reviewer's own credentials). | Server-only |
| `OPENROUTER_MODEL` | OpenRouter model name (default: `liquid/lfm-2.5-2.6b:free`). | Server-only |

> [!CAUTION]
> **Credential Security:** Never prefix `ASSEMBLYAI_API_KEY` with `VITE_` or commit credentials. The API key remains strictly on the server side to mint short-lived tokens and handle LLM requests securely. Live voice streaming requires active AssemblyAI credentials and internet access.

---

## Testing & Verification

```bash
# Run all 272 automated tests
npm test

# Build production bundle (TypeScript typechecking + Vite bundle)
npm run build
```

---

## Devpost Learn Skill Pack Workflow

This project followed the disciplined planning workflow defined by the official Devpost Learn Skill Pack (`challengepost/learn-ai-basics`):

- **[devpost/scope.md](devpost/scope.md)** — Kernel definition, audience, and strict proof-of-concept boundaries.
- **[devpost/prd.md](devpost/prd.md)** — Product Requirements Document detailing user personas, journeys, functional requirements, and guardrails.
- **[devpost/spec.md](devpost/spec.md)** — Technical Specification detailing dual-plane architecture, state lifecycles, and Product Adapter interfaces.
- **[devpost/checklist.md](devpost/checklist.md)** — Incremental implementation slices verified by automated test suites.
- **[devpost/DEMO_PLAN.md](devpost/DEMO_PLAN.md)** — Under-3-minute video walkthrough guide.
- **[devpost/SUBMISSION_NOTES.md](devpost/SUBMISSION_NOTES.md)** — Complete Devpost submission form prompts and answers.

---

## License

This project is open-source under the [MIT License](LICENSE).
