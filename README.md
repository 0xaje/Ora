# AURELIA

> **Talk to the space. Watch it respond.**  
> A conversational spatial luxury sanctuary experience powered by ORA — an embodied voice and spatial intelligence layer.

[![Test Suite](https://img.shields.io/badge/tests-261%20passing-brightgreen)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Devpost](https://img.shields.io/badge/Devpost-Build%20With%20AI%3A%20Basics-blueviolet)](https://learn-ai-basics.devpost.com/)

---

## What is AURELIA?

AURELIA is a luxury modernist private shortlet sanctuary where the architectural environment itself acts as the body of the AI conversation. Rather than interacting with a detached floating chatbot widget, visitors explore the estate through spoken dialogue: camera perspectives glide through the residence, lighting ambiances dissolve from morning daylight to dusk, acoustic soundscapes breathe with speech turns, and guests initiate verified reservation requests with mobile messaging handoffs.

**ORA** is the underlying reusable conversational intelligence layer that decodes natural speech, navigates spatial coordinates, coordinates soundscape ducking, and handles commerce handoffs.

---

## The Problem

Traditional luxury travel and vacation estate booking interfaces are fractured and uninspired:
1. **Menu & Filter Fatigue:** Travelers are forced through endless dropdowns, thumbnail carousels, and multi-step forms to find specific views or amenities.
2. **Disconnected Chatbots:** Existing AI assistants sit in small text bubbles in the corner of the screen, completely blind and detached from the visual product being presented.
3. **Fictitious Checkout Promises:** Chatbots often hallucinate availability or pretend to complete instant hotel room bookings without authentic host verification.

AURELIA replaces this fragmented experience with an embodied spatial concierge that visually guides visitors and provides a verified reservation request path.

---

## The Experience

$$\text{SPEAK} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{EXPLORE} \longrightarrow \text{DECIDE} \longrightarrow \text{RESERVE} \longrightarrow \text{HANDOFF}$$

1. **SPEAK:** Speak naturally into hands-free microphone streaming (*"Ora, show me the living room at sunset"*, *"Take me on a tour"*).
2. **UNDERSTAND:** Low-latency speech recognition streams audio to AssemblyAI v3, parsed by sub-millisecond fast-path intent extractors (<1ms) or conversational LLM reasoning.
3. **EXPLORE:** The 300-frame photographic canvas scrubs smoothly to the requested architectural space, and detail placards center into view.
4. **DECIDE:** The visitor inspects estate features, listens to autonomous guided tour narrations, and interrupts at any moment via instant voice barge-in.
5. **RESERVE:** The visitor states stay dates and name (*"Reserve Aurelia for John from October 9th to October 11th"*). Deterministic business logic validates stay duration, calculates verified pricing ($1,850/night), and generates an authentic `AUR-YYYY-XXXX` reservation pass in `READY_FOR_HANDOFF` status.
6. **HANDOFF:** Clicking **"Continue on WhatsApp"** opens an authentic prefilled `https://wa.me/?text=...` browser deep link directly transferring the itemized request to host concierge messaging.

---

## Why It Is Different

| Traditional Booking UI | Generic AI Chatbot | AURELIA with ORA |
| :--- | :--- | :--- |
| Click filter dropdowns & thumbnail carousels | Floating text bubble in bottom corner | **Viewport canvas is the interface** |
| Silent, disconnected browsing | Text-only answers with static URLs | **Synchronized WebAudio soundscape with voice ducking** |
| Rigid calendar date pickers | Hallucinates dates or unavailable rates | **Deterministic reservation logic ($1,850/night) & verified reference generation** |
| Forced multi-page form checkouts | Fake "Your room is booked" claims | **Transparent `READY_FOR_HANDOFF` pass & direct WhatsApp mobile dispatch** |

---

## Demo & Video Walkthrough

- **Demonstration Video:** `[Demo Video Link — Under 3 Minutes — To Be Added]`
- **Interactive Prototype:** Local or deployed environment (see [Getting Started](#getting-started)).

---

## Architecture

AURELIA operates on a dual-plane architecture:

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
│  │                 ReservationPass Modal (Phase 3 & 4)                    │  │
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

## AI & Voice Flow

1. **Continuous Speech-to-Text:** The browser captures microphone audio at 16kHz PCM mono and streams via WebSocket directly to AssemblyAI Universal Streaming v3.
2. **Ephemeral Security:** Client requests short-lived 60-second tokens from the server via `GET /api/assemblyai/token`, ensuring API keys are never exposed in client bundles.
3. **Intent Resolution (<1ms Fast-Path & Fallback LLM):** Common spatial and reservation commands are resolved instantly via client-side regex extractors. Complex queries fall back to `POST /api/ora/converse` powered by local Ollama (`llama3.2:1b`) or OpenRouter models.
4. **Instant Voice Barge-In:** When user speech is detected, active speech synthesis and camera tour tweens immediately abort.
5. **Speech Synthesis (TTS):** Responses are vocalized using Web Speech API with serene, natural pacing.

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

## End-to-End Judge Demonstration Workflow

Try the following interactive flow:

1. **Arrival:** Open the application. Experience the cinematic 300-frame landing canvas with ambient soundscape.
2. **Audio Activation:** Click the speaker icon to unmute the living soundscape.
3. **Voice Inquiry:** Click the microphone or speak:  
   *"Ora, show me the living room at sunset."*  
   *Result:* Camera scrubs to the living room, lighting warms to evening amber, and soundscape gently ducks during Ora's response.
4. **Sanctuary Placard:** Speak:  
   *"Show me the master bedroom."*  
   *Result:* The Master Bedroom detail placard centers onto the screen.
5. **Grand Tour:** Speak:  
   *"Give me a full tour."*  
   *Result:* Ora leads an autonomous guided sequence through all architectural zones. Interrupt at any time by speaking.
6. **Reservation Request:** Speak:  
   *"Ora, I'd like to reserve Aurelia for John from October 9th to October 11th."*  
   *Result:* ORA verifies stay dates, calculates 2 nights at $1,850/night ($3,700 total), and displays the glassmorphic Reservation Pass modal.
7. **Mobile Handoff:** Click **"Continue on WhatsApp"** on the Reservation Pass modal.  
   *Result:* Opens an authentic prefilled WhatsApp deep link ready to send to the host.

---

## Devpost Learn Skill Pack Workflow

This project was built following the disciplined, learner-led planning workflow defined by the official Devpost Learn Skill Pack (`challengepost/learn-ai-basics`):

- **[devpost/scope.md](devpost/scope.md)** — Kernel definition, audience, and strict proof-of-concept boundaries.
- **[devpost/prd.md](devpost/prd.md)** — Product Requirements Document detailing user personas, journeys, functional requirements, and guardrails.
- **[devpost/spec.md](devpost/spec.md)** — Technical Specification detailing dual-plane architecture, state lifecycles, and Product Adapter interfaces.
- **[devpost/checklist.md](devpost/checklist.md)** — Incremental implementation slices verified by automated test suites.

---

## Project Structure

```text
Aurelia/
├── data/
│   └── shortlet.json               # Authoritative estate spaces, pricing & metadata
├── devpost/
│   ├── scope.md                    # Approved Scope document
│   ├── prd.md                      # Approved Product Requirements Document
│   ├── spec.md                     # Approved Technical Specification
│   ├── checklist.md                # Implementation verification checklist
│   ├── DEMO_PLAN.md                # 3-minute video walkthrough guide
│   └── SUBMISSION_NOTES.md         # Devpost submission prompts and answers
├── public/
│   ├── audio/                      # Soundscape audio assets
│   ├── frames/                     # 300 photographic canvas scrubber frames (day/sunset/night)
│   └── spaces/                     # Architectural detail photography
├── server/
│   ├── oraConversationEngine.ts    # Server-side Ollama / OpenRouter LLM orchestration
│   └── oraPrompt.ts                # Structured JSON prompt instructions
├── src/
│   ├── audio/                      # AureliaAtmosphere WebAudio coordinator & ducking
│   ├── camera/                     # CameraTimeline controller & frame interpolation
│   ├── components/                 # ScrollHero, OraPresence, SpaceDetail, ReservationPass
│   ├── domain/                     # Reservation logic, pricing, reference generator & handoff
│   ├── ora/                        # ProductAdapter, fastPath router, conversational provider
│   └── voice/                      # AssemblyAI streaming client & speech synthesis
├── tests/                          # 261 passing unit & integration tests
├── LICENSE                         # MIT License
└── package.json
```

---

## Testing & Verification

Run the comprehensive test suite verifying property domain integrity, spatial navigation, reservation extraction, WhatsApp handoff, and audio resampling:

```bash
# Run all 261 tests
npm test

# Build production bundle (TypeScript typechecking + Vite bundle)
npm run build
```

---

## Current Scope & Honest POC Boundaries

- **Single Private Estate:** Aurelia Sanctuary is an exclusive buyout estate ($1,850/night), not a multi-room hotel with PMS room inventory.
- **Reservation Request Lifecycle:** Generates verified `READY_FOR_HANDOFF` requests; does not process live credit cards or mock real-time bank charges.
- **WhatsApp Direct Deep Link:** Employs client-side `wa.me` URL-encoded deep links rather than paid third-party WhatsApp Business Cloud API servers.
- **Session Persistence:** Reservation state is persisted in `sessionStorage` for demo resilience without external database overhead.

---

## License

This project is open-source under the [MIT License](LICENSE).
