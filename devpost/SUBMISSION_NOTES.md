# Devpost Submission Preparation Notes — AURELIA

> **Authoritative submission preparation guide for Devpost "Build With AI: Basics".**  
> Formulated from the active repository, verified runtime behavior, and approved planning artifacts.

---

### 1. Project Title
**AURELIA — Conversational Spatial Luxury Sanctuary**

---

### 2. One-Line Elevator Pitch
The space itself is the interface: a conversational luxury estate that glides, breathes, and prepares verified reservations through voice.

---

### 3. What AURELIA Does (Plain English)
AURELIA transforms the static booking page into an embodied architectural concierge. Instead of clicking dropdown menus and booking forms, visitors talk naturally with **ORA**, an intelligent voice and spatial agent. As guests speak, the application scrubs through a 300-frame photographic canvas, crossfades daylight to evening dusk, centers architectural detail placards, coordinates ambient soundscape ducking, extracts stay dates and guest details, and issues an itemized glassmorphic **Reservation Pass** with direct WhatsApp messaging handoff to the host.

---

### 4. Who It Is For
- **Experiential Travelers & Retreat Planners:** Discerning clients who want to explore and understand an estate's ambiance, architecture, and lighting naturally before reserving a stay.
- **Bespoke Shortlet & Estate Owners:** Luxury property hosts seeking to convert high-net-worth inquiries without friction-heavy checkout forms or impersonal chatbot popups.

---

### 5. The Problem Being Solved
Standard luxury travel platforms suffer from:
1. **Dropdown & Carousel Fatigue:** Visitors must endlessly click tabs to find specific views, amenities, or lighting conditions.
2. **Disconnected Chatbots:** AI assistants typically exist as isolated text bubbles in the corner of the screen, blind to the visuals on page.
3. **Fictitious Checkout Promises:** Chatbots often hallucinate prices or claim a room is booked without authentic verification.

AURELIA eliminates these issues by making the product surface itself respond directly to voice with deterministic pricing and verified reservation passes.

---

### 6. What Makes It Distinctive
- **The Screen is the Body of the AI:** Voice commands control physical camera position, lighting moods, and soundscape volume directly.
- **Sub-Millisecond Fast-Path Router:** Instant regex/keyword routing (<1ms) handles common navigation and reservation phrases without waiting for cloud LLMs.
- **Hardware-Accelerated Scrubber:** A 300-frame canvas timeline supporting smooth transitions across three distinct times of day (`day`, `sunset`, `night`).
- **Deterministic Commerce:** Zero hallucinated rates; stays calculate at the verified $1,850/night estate rate with authenticated `AUR-YYYY-XXXX` references.
- **Frictionless Handoff:** Bridges conversational exploration directly to real-world mobile messaging via prefilled WhatsApp deep links.

---

### 7. How the Devpost Learn Skill Pack Was Used
The project adhered strictly to the Devpost Learn Skill Pack (`challengepost/learn-ai-basics`) planning workflow:
- **`scope.md`:** Defined the core thesis (*"The space itself is the interface"*), target personas, and strict proof-of-concept boundaries.
- **`prd.md`:** Detailed the user journey, functional requirements (FR-01 through FR-14), and truthfulness guardrails.
- **`spec.md`:** Specified the dual-plane architecture, state machine lifecycles (`DRAFT` &rarr; `READY_FOR_HANDOFF` &rarr; `HANDOFF_OPENED`), and the `ProductAdapter` boundary.
- **`checklist.md`:** Guided incremental implementation slices verified by an automated test suite of 261 test cases.

---

### 8. What Was Learned During the Build
- **Embodied AI Requires Tight Latency Loops:** A conversational agent that controls visual surfaces feels disjointed if STT and routing have high latency. Combining AssemblyAI v3 streaming with local fast-path extraction was crucial for a responsive feel.
- **Acoustic Harmony Matters:** Background soundscapes create immersion, but they must automatically duck during speech turns so synthesized voice remains crystal-clear.
- **Domain Truth Over Hallucination:** In luxury hospitality, an AI assistant must never fabricate room inventory or make false booking promises. Restricting the agent to verified reservation requests with mobile host handoff preserves complete customer trust.

---

### 9. Working End-to-End Demo Flow
1. **Explore:** *"Ora, show me the living room at sunset."* &rarr; Camera timeline glides into living area, lighting transitions to dusk.
2. **Detail:** *"Show me the master bedroom."* &rarr; Detail architectural card centers into view.
3. **Tour:** *"Give me a tour."* &rarr; Autonomous 8-stop tour begins with calm concierge narration (barge-in enabled).
4. **Reserve:** *"Ora, I’d like to reserve Aurelia for John from October 9th to October 11th."* &rarr; Calculates 2 nights at $1,850/night ($3,700 total), generates pass `AUR-2026-XXXX`.
5. **Handoff:** Click **"Continue on WhatsApp"** &rarr; Opens prefilled `wa.me` message with full reservation summary.

---

### 10. Technologies Actually Used
- **Frontend:** React 18, TypeScript, Vite, Vanilla CSS
- **Audio & Media:** WebAudio API (`AureliaAtmosphere`), Web Speech Synthesis
- **Voice STT:** AssemblyAI Universal Streaming STT v3 WebSocket
- **Intelligence:** Sub-millisecond Fast-Path Router, Ollama (`llama3.2:1b`), OpenRouter API fallback
- **Verification:** Node.js native test runner + `tsx` (261 automated tests)

---

### 11. Current Proof-of-Concept Boundaries
- **Single Estate:** Modeled for the private Aurelia Sanctuary estate ($1,850/night exclusive buyout), not a multi-room hotel PMS.
- **Reservation Request:** Focuses on verified request generation and direct WhatsApp handoff rather than live credit card processing.
- **Session Persistence:** Relies on in-memory and `sessionStorage` state to eliminate external database setup requirements.

---

### 12. Demo Video Checklist (<3 Minutes)
- [ ] Show arriving on the landing page and unmute ambient soundscape.
- [ ] Speak: *"Show me the living room at sunset"* (demonstrate spatial camera move + ambiance shift).
- [ ] Speak: *"Show me the pool"* (demonstrate detail placard).
- [ ] Interrupt Ora mid-sentence to prove voice barge-in.
- [ ] Speak: *"Reserve Aurelia for John from October 9th to October 11th"*.
- [ ] Highlight the glassmorphic **Reservation Pass** ($3,700 total, 2 nights).
- [ ] Click **"Continue on WhatsApp"** and show the prefilled WhatsApp tab opening.
