---
project: ORA
reference_implementation: AURELIA Sanctuary
builder: Aje oluwaseun isaac (@0xaje)
github: https://github.com/0xaje/Ora
devpost: https://devpost.com/Cryptoverse
hackathon: Devpost Build With AI: Basics
status: approved
---

# Devpost Submission Notes & Ready Copy — ORA

> **Authoritative submission copy for the Devpost "Build With AI: Basics" submission form.**  
> Grounded in the active repository, verified runtime behavior, and approved planning artifacts.

---

### Builder & Project Information
- **Project Title:** **ORA — Conversational Spatial Intelligence for High-Value Digital Products** *(Demonstrated via AURELIA Sanctuary Reference Implementation)*
- **One-Line Tagline:** The website canvas is the body of the AI: a reusable voice and spatial action layer that turns visual web experiences into conversationally controllable environments.
- **Builder / Developer:** Aje Oluwaseun Isaac ([@0xaje](https://github.com/0xaje))
- **Devpost Profile:** [Cryptoverse](https://devpost.com/Cryptoverse)
- **Public GitHub Repository:** [https://github.com/0xaje/Ora](https://github.com/0xaje/Ora)
- **Demo Video URL:** *[Insert your uploaded 1–3 min YouTube/Loom video link here]*

---

## Ready-to-Paste Devpost Project Description

### Inspiration

We wanted to explore a simple question: **What if you could talk to a website and watch it respond?**

Browsing usually means translating what you want into clicks, menus, filters, and forms. Adding a chatbot often introduces another interface without changing that experience—you can ask questions, but you still have to navigate and act yourself.

Ora explores a different approach: connecting conversation directly to the website’s visual surface and supported actions.

### What it does

**Ora is a conversational interaction layer that lets people navigate, explore, and take action through natural voice commands.**

Instead of responding only with text, Ora can move the view, focus on relevant content, change the atmosphere, guide an exploration, and prepare a structured request.

We demonstrate this through **Aurelia Sanctuary**, a concept architectural property environment. Visitors can ask Ora to:

- “Show me the living room at sunset.”
- “Take me to the master bedroom.”
- “Give me a tour.”
- Ask questions about the property.
- Provide stay details and generate a reservation request with an estimated total.
- Open a prepared request in WhatsApp for continuation.

Aurelia is the first implementation of Ora’s broader interaction model. The same architectural approach could support other visual experiences, such as product showrooms, portfolios, and interactive catalogs, through additional product adapters.

Ora currently executes the actions supported by its host application. It does not have unrestricted control over arbitrary websites.

### How we built it

We built Ora with **React, TypeScript, and Vite**, using the Devpost Learn Skill Pack workflow to organize the scope, product requirements, technical specification, and implementation checklist.

The system connects several parts:

- **Voice input:** Microphone audio streams to AssemblyAI for real-time streaming transcription.
- **Intent interpretation:** A deterministic fast path handles common spatial and reservation commands in sub-milliseconds (<1ms), while a conversational engine supports local Ollama (for 100% private, on-device inference with zero API token charges) or OpenRouter as an external fallback.
- **Typed actions:** Interpreted requests become structured navigation, atmosphere, tour, or transaction actions.
- **Product adapter:** A formal `ProductAdapter` interface connects Ora’s generic actions to Aurelia’s application behavior.
- **Visual experience:** A 300-frame photographic canvas sequence provides hardware-accelerated camera movement across day, sunset, and night environments.
- **Audio:** WebAudio manages the ambient soundscape with dynamic gain ducking during voice turns, while browser speech synthesis provides serene spoken responses.
- **Request preparation:** Application code extracts stay details and deterministically calculates totals from a configured reference rate.

The reservation flow demonstrates how conversation can lead to an application action. It prepares a request for further discussion; it does not confirm availability, collect payment, or finalize a booking.

### Challenges we faced

#### 1. Coordinating conversation with the interface
Understanding a sentence was only one part of the problem. Ora also needed to connect that sentence to the right view, atmosphere, response, and application state. We separated interpretation from execution so that conversational decisions could map to explicit, supported actions.

#### 2. Managing voice and sound together
An immersive experience includes background audio, spoken responses, and microphone input. Coordinating these elements required attention to listening states, speech cancellation, sound ducking, and guided-tour timing. Reliable interruption (barge-in) is especially challenging because the system must distinguish a new user request from its own spoken output.

#### 3. Keeping actions grounded
A conversational interface should not invent missing dates, prices, availability, or successful transactions. We kept pricing arithmetic in application code and modeled the outcome as a reservation request. This makes the boundary between preparing an action and completing an external transaction explicit.

#### 4. Separating Ora from its demonstration
Aurelia gave us a concrete environment in which to build and test. We also needed a boundary between its property-specific behavior and Ora’s broader interaction model. The `ProductAdapter` interface establishes that boundary. Additional domains remain future implementations.

### What we learned

**Conversational interfaces are most useful when they connect understanding to visible, meaningful action.**

We also learned that responsiveness depends on the whole interaction loop: transcription, interpretation, visual movement, speech, and state changes. A fast intent router alone does not guarantee a fast voice experience.

Another lesson was that test coverage and live interaction checks serve different purposes. Automated tests help verify logic, but microphone behavior, external services, and handoffs also need testing in the actual browser.

Finally, planning before implementation helped us define a complete proof of concept while keeping larger ambitions outside the current build.

### Accomplishments we are proud of

- Connected spoken commands to visual navigation and atmosphere changes in real time.
- Built a sub-millisecond fast-path intent router (<1ms) for instantaneous camera and lighting responses without waiting for cloud roundtrips.
- Built a guided exploration experience with coordinated narration, soundscape ducking, and instant voice barge-in.
- Created a path from natural conversation to a structured, itemized application request with mobile WhatsApp handoff.
- Established a decoupled `ProductAdapter` boundary for future domain integrations.
- Included the complete planning documents and an automated suite of 261 passing tests.
- Produced a clean, successful production build.

### What’s next for Ora

Our next steps are to strengthen live voice reliability, improve clarification and correction flows, and test the interaction model with real users.

We also want to implement a second product adapter to evaluate how well Ora transfers beyond Aurelia—for example, to an automotive vehicle configurator, a luxury retail showcase, or an interactive architectural catalog.

The goal is to make supported website actions accessible through conversation while keeping users informed about what the system has actually done.

---

## Submission Form Field Reference

- **What did you build and who is it for?**  
  See the *What it does* and *Inspiration* sections above.
- **How did you use the Devpost Learn Skill Pack?**  
  We installed the Devpost Learn Skill Pack (`challengepost/learn-ai-basics`) at project inception and followed the disciplined, learner-led workflow: starting with `1-start` to establish our thesis, `2-scope` for our proof-of-concept boundary, `3-prd` for functional requirements, `4-spec` for the dual-plane technical architecture and ProductAdapter contract, and `5-build` to implement and test each slice verified by our 261 automated tests.
- **Why does the project run on localhost rather than cloud deployment?**  
  Ora is deliberately architected for local open-source inference via Ollama (`llama3.2:1b`), ensuring 100% data privacy and zero cloud API subscription costs. A static Vercel deployment would disconnect the application from the local Ollama instance; running locally preserves privacy and full functionality, while the video demonstration provides complete end-to-end proof for judges.
