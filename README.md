# ORA

> **Talk to the space. Watch it respond.**  
> A reusable conversational intelligence and spatial action layer for high-value visual digital products.  
> *Demonstrated via the **AURELIA Sanctuary** luxury architectural shortlet reference implementation.*

[![Test Suite](https://img.shields.io/badge/tests-261%20passing-brightgreen)](tests/)
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

## Flagship Showcase: AURELIA Sanctuary

To prove ORA in a demanding real-world domain, this repository includes **AURELIA Sanctuary** as its flagship reference implementation.

AURELIA is a private modernist desert shortlet residence. Rather than clicking through static photo galleries and room forms, guests explore the estate through spoken conversation with ORA:
- *"Show me the living room at sunset."* &rarr; The 300-frame canvas smoothly glides to the living room, lighting warms to evening dusk, and background music ducks.
- *"Show me the master suite."* &rarr; Architectural detail placards center into view.
- *"Give me a tour."* &rarr; ORA leads an autonomous 8-stop guided tour with instant voice barge-in.
- *"Reserve Aurelia for John from October 9th to October 11th."* &rarr; ORA verifies stay dates, calculates verified pricing ($1,850/night), and generates a glassmorphic **Reservation Pass** with one-click **WhatsApp handoff** to the estate host.

---

## The Experience Loop

$$\text{SPEAK} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{EXPLORE} \longrightarrow \text{DECIDE} \longrightarrow \text{TRANSACT} \longrightarrow \text{HANDOFF}$$

1. **SPEAK:** Speak naturally via hands-free streaming microphone input.
2. **UNDERSTAND:** Continuous 16kHz PCM audio streams to AssemblyAI v3 WebSocket; sub-millisecond fast-path router (<1ms) or LLM extracts intent.
3. **EXPLORE:** The decoupled `ProductAdapter` navigates the visual canvas: scrubbing frames, switching camera viewpoints, or adjusting lighting.
4. **DECIDE:** The visitor explores architectural features, takes guided tours, and asks questions with instant voice interruption (barge-in).
5. **TRANSACT:** Natural language extraction captures customer parameters (guest name, dates, preferences), and authoritative domain logic computes verified pricing.
6. **HANDOFF:** Generates a structured digital pass (`READY_FOR_HANDOFF`) and transfers directly to mobile messaging channels (WhatsApp, Telegram, or CRM).

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
│  ┌───────────────────────┐   Audio Duck       │ • Fast-Path Router (<1ms) │  │
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

- **261 Automated Tests Passing** (`npm test`, 0 failures) across 63 test suites.
- **Production Build Verified** (`npm run build`) compiling in ~3.2 seconds.
- **Continuous Voice Streaming:** Real-time microphone worklet with AssemblyAI Universal Streaming v3 and server-side ephemeral token minting.
- **Instant Voice Barge-In:** Immediate speech cancellation and tour abort when user speaks.
- **Acoustic Harmony:** WebAudio soundscape with dynamic volume ducking during speech turns.
- **Verified Commerce Flow:** Spoken reservation extraction, deterministic calculations ($1,850 × nights), authentic `AUR-YYYY-XXXX` reference generator, and WhatsApp browser deep link handoff.
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

## Environment Variables

| Variable | Description | Exposure |
| :--- | :--- | :--- |
| `ASSEMBLYAI_API_KEY` | AssemblyAI key used by the local Vite server plugin to mint ephemeral v3 WebSocket tokens. | Server-only (Never bundled in client) |
| `LLM_PROVIDER` | `ollama` (default for private local execution) or `openrouter`. | Server-only |
| `OLLAMA_BASE_URL` | Endpoint for local Ollama server (default: `http://127.0.0.1:11434`). | Server-only |
| `OLLAMA_MODEL` | Local model name (default: `llama3.2:1b`). | Server-only |
| `OPENROUTER_API_KEY` | OpenRouter API Key (optional fallback). | Server-only |
| `OPENROUTER_MODEL` | OpenRouter model name (e.g., `liquid/lfm-2.5-2.6b:free`). | Server-only |

---

## Testing & Verification

```bash
# Run all 261 tests
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
