---
project: ORA
reference_implementation: AURELIA Sanctuary
builder: Aje oluwaseun isaac (@0xaje)
github: https://github.com/0xaje/Ora
devpost: https://devpost.com/Cryptoverse
hackathon: Devpost Build With AI: Basics
status: approved
---

# Devpost Submission Preparation Notes — ORA

> **Authoritative submission preparation guide for Devpost "Build With AI: Basics".**  
> Formulated from the active repository, verified runtime behavior, and approved planning artifacts.

---

### Builder & Project Information
- **Builder / Developer:** Aje Oluwaseun Isaac ([@0xaje](https://github.com/0xaje))
- **Devpost Profile:** [Cryptoverse](https://devpost.com/Cryptoverse)
- **Public GitHub Repository:** [https://github.com/0xaje/Ora](https://github.com/0xaje/Ora)
- **Project Title:** **ORA — Conversational Spatial Intelligence for High-Value Digital Products** *(Demonstrated via AURELIA Sanctuary Reference Implementation)*
- **Hackathon:** Devpost Build With AI: Basics (October 2026)

---

### 1. Project Title
**ORA — Conversational Spatial Intelligence for High-Value Digital Products**  
*(Demonstrated via AURELIA Sanctuary Reference Implementation)*

---

### 2. One-Line Elevator Pitch
The product canvas is the body of the AI: a reusable voice and spatial action layer that turns visual web experiences into conversationally controllable environments.

---

### 3. What ORA Does (Plain English)
**ORA** is an embodied conversational intelligence and action layer that makes high-value visual products conversationally controllable. 

Instead of trapping AI inside a blind chat widget in the corner of a screen, ORA directly manipulates the digital canvas in response to spoken voice: navigating camera coordinates, shifting environmental ambiances (daylight to evening dusk), coordinating background soundscape ducking, and driving verified transactions with mobile messaging handoffs.

**AURELIA Sanctuary** is the flagship reference implementation: an exclusive modernist shortlet estate where visitors explore 8 architectural spaces and book complete estate stays entirely through natural speech.

---

### 4. Who It Is For
- **High-Value Product Creators & Platforms:** Luxury real estate, automotive/EV configurators, architectural studios, and bespoke luxury commerce seeking an embodied conversational sales agent.
- **Experiential Travelers & Clients:** Visitors who discover, explore, and transact through natural human dialogue (*"show me the pool at sunset"*, *"reserve for John from October 9th to 11th"*) rather than clicking through cumbersome dropdown menus and forms.

---

### 5. The Problem Being Solved
1. **Disconnected Chatbots:** Existing AI assistants sit in small text bubbles in the corner of the screen, completely blind to what the user sees.
2. **Filter & Form Fatigue:** Visitors are forced through complex dropdowns, thumbnail carousels, and multi-step forms to find specific views or amenities.
3. **Fictitious Checkout Promises:** Chatbots frequently hallucinate availability or pretend to complete instant bookings without authentic verification.

ORA replaces this with an embodied spatial agent that directly controls visual surfaces and delivers verified, itemized transactions.

---

### 6. What Makes It Distinctive
- **The Screen is the Body of the AI:** Voice commands control physical camera position, lighting moods, and soundscape volume directly.
- **Deterministic Fast-Path Router:** Instant in-process regex/keyword routing handles common navigation and reservation phrases without waiting for cloud LLMs.
- **Hardware-Accelerated Scrubber:** A 300-frame canvas timeline supporting smooth transitions across three distinct times of day (`day`, `sunset`, `night`).
- **Deterministic Commerce:** Zero hallucinated rates; stays calculate at the configured demonstration $1,850/night reference rate with unique `AUR-YYYY-XXXX` references.
- **Frictionless Handoff:** Bridges conversational exploration directly to real-world mobile messaging via prefilled WhatsApp deep links.

---

### 7. How the Devpost Learn Skill Pack Was Used
The project adhered strictly to the Devpost Learn Skill Pack (`challengepost/learn-ai-basics`) planning workflow:
- **`scope.md`:** Defined the core thesis (*"The space itself is the interface"*), target personas, and strict proof-of-concept boundaries.
- **`prd.md`:** Detailed the user journey, functional requirements (FR-01 through FR-14), and truthfulness guardrails.
- **`spec.md`:** Specified the dual-plane architecture, state machine lifecycles (`DRAFT` &rarr; `READY_FOR_HANDOFF` &rarr; `HANDOFF_OPENED`), and the `ProductAdapter` boundary.
- **`checklist.md`:** Guided incremental implementation slices verified by an automated test suite of 272 test cases.

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
- **Intelligence:** Deterministic Fast-Path Router, Local Ollama (`qwen2.5:1.5b` or configured local tag), OpenRouter API fallback
- **Verification:** Node.js native test runner + `tsx` (272 automated tests)

---

### 11. Current Proof-of-Concept Boundaries & Architecture Choice
- **Single Estate Reference Environment:** Modeled for the private Aurelia Sanctuary concept estate ($1,850/night reference buyout rate), demonstrating the `ProductAdapter` boundary.
- **Reservation Request:** Focuses on verified request generation, deterministic pricing, and WhatsApp handoff rather than live card processing or false booking confirmation.
- **Session Persistence:** Relies on in-memory and `sessionStorage` state to eliminate external database setup requirements.
- **Execution & Privacy Architecture:** Speech audio is sent to AssemblyAI for streaming transcription. When local Ollama is used, conversational LLM inference is run on-device with zero LLM API token charges; OpenRouter can be configured as an external alternative.
- **Why Local Architecture Over Cloud Hosting:** Running locally preserves direct access to local Ollama inference without requiring external GPU container hosting. In line with Devpost guidelines, reviewer evaluation is based on the video walkthrough and open repository code.

---

### 12. Concise Submission Checklist
- [ ] **Public GitHub Repository:** Ensure `https://github.com/0xaje/Ora` is public and accessible, containing the full codebase and documentation.
- [ ] **Demonstration Video:** Video walkthrough under 3 minutes uploaded and linked on the Devpost submission page.
- [ ] **Skill Pack Usage Answer:** Complete the required Devpost question detailing the Build With AI Basics planning docs (`scope.md`, `prd.md`, `spec.md`, `checklist.md`) and actual development workflow.
- [ ] **Age & Eligibility Checkbox:** Review and check the mandatory entrant age and eligibility confirmation boxes on the Devpost submission form.
