---
doc: scope
project: ORA
reference_implementation: AURELIA Sanctuary
builder: Aje oluwaseun isaac (@0xaje)
github: https://github.com/0xaje/Ora
devpost: https://devpost.com/Cryptoverse
hackathon: Devpost Build With AI: Basics
status: approved
---

# ORA (with AURELIA Luxury Shortlet Reference Environment)

**Ora lets products become conversationally controllable.**

ORA is a reusable conversational intelligence and action layer that allows high-value visual products to be explored, controlled, and transacted through natural voice and direct manipulation.

**AURELIA** is the current reference implementation: a luxury architectural shortlet / private residence ("Aurelia Sanctuary") through which ORA demonstrates spatial control, environmental immersion, and verified transaction initiation.

---

## 1. The Unique Kernel

Instead of a floating text chatbot in a corner widget or a blind voice assistant with no visual grounding, ORA **embodies the product surface**. The application viewport, camera angle, visual focus, lighting ambiance, and soundscape dynamically respond in real time to natural spoken dialogue, closing the loop with a verified reservation request and mobile WhatsApp handoff.

---

## 2. Who It's For

* **The Guest / Buyer:** An experiential client (e.g. planning a private retreat or luxury shortlet stay) who discovers and decides through natural human conversation ("show me the infinity pool at sunset", "give me a full tour", "reserve Aurelia for John from October 9th to October 11th") rather than clicking complex filter dropdowns, thumbnail carousels, and forms.
* **The Business:** Luxury shortlets, private estates, high-end real estate, automotive showrooms, and bespoke retail seeking an autonomous spatial sales agent that guides customers and delivers qualified, itemized transaction handoffs.

---

## 3. The Core Product Distinction

### ORA (The Reusable Product Layer)
* Continuous hands-free voice input and streaming STT (AssemblyAI v3).
* Serene concierge vocalization and instant barge-in (speech interruption).
* Multi-turn conversational reasoning, context memory, and deterministic fast-path intent routing.
* Domain-agnostic Action Bus dispatching typed envelopes (`NAVIGATE`, `SET_AMBIANCE`, `START_TOUR`, `INITIATE_TRANSACTION`, `DISPATCH_HANDOFF`).
* Audio ducking coordinator (quieting background soundscapes during speech turns).
* Structured transaction intent extractor (identifying guest name and stay dates).

### AURELIA (The Reference Implementation)
* A concept modernist desert shortlet residence ("Aurelia Sanctuary") with 8 architectural spaces.
* 300-frame photographic canvas scrubber with programmatic camera timeline tweening.
* 3 authentic lighting and ambiance passes (`day`, `sunset`, `night`).
* Spatial discovery panels for detail sanctuaries (Master Bedroom, Ensuite Spa, Infinity Pool).
* Configured demonstration reference rate ($1,850/night reference buyout rate; actual property booking upon inquiry).
* Session reservation store and glassmorphic Reservation Request Pass UI.

---

## 4. The Core Customer Journey

$$\text{SPEAK} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{EXPLORE} \longrightarrow \text{DECIDE} \longrightarrow \text{REQUEST} \longrightarrow \text{HANDOFF}$$

1. **SPEAK:** The guest speaks naturally into the continuous microphone stream.
2. **UNDERSTAND:** ORA transcribes audio in real time, maintains multi-turn context, and parses spatial/transactional intent.
3. **EXPLORE:** The Product Adapter directs the viewport: the 300-frame canvas smoothly navigates to the target space, detail cards center into view, or the ambiance crossfades.
4. **DECIDE:** The guest examines features and asks questions, supported by an autonomous guided Grand Tour and genuine barge-in.
5. **REQUEST:** The guest states *"Ora, I’d like to reserve AURELIA for John from October 9th to October 11th"*. ORA validates dates, calculates 2 nights, computes $3,700 total from the configured reference rate, generates a unique request reference (`AUR-YYYY-XXXX`), and presents the digital Reservation Request Pass in `READY_FOR_HANDOFF` status.
6. **HANDOFF:** The guest clicks **"Share Request on WhatsApp"** (or configured host contact), opening a prefilled `https://wa.me/?text=...` browser deep link delivering the reservation request details, transitioning the state to `HANDOFF_OPENED`.

---

## 5. Reservation Architecture & State Lifecycle

```text
DRAFT
  ↓ (Guest name + valid calendar stay dates provided)
READY_FOR_HANDOFF
  ↓ (User activates WhatsApp handoff action)
HANDOFF_OPENED
```

* **`DRAFT`:** Reservation intent expressed, but required fields (guest name or calendar dates) are pending.
* **`READY_FOR_HANDOFF`:** Application has validated stay dates, calculated nights and estimated stay total from the reference rate, generated a unique `AUR-YYYY-XXXX` request reference, and displayed the Reservation Request Pass.
* **`HANDOFF_OPENED`:** The user has triggered the external messaging handoff link.

**Truthful Boundary:** ORA prepares a structured **Reservation Request**. It does not confirm availability, charge cards, or finalize bookings. Availability and agreements are settled directly with the host.

---

## 6. Proof-of-Concept Boundary

### Currently Implemented & Verified:
* **8 Architectural Spaces:** `exterior`, `entrance`, `living_room`, `kitchen`, `hallway`, `master_bedroom`, `ensuite_bathroom`, `infinity_pool`.
* **300-Frame Canvas Engine:** Hardware-accelerated 2D canvas scrubber with 900 physical JPEG frames across `day`, `sunset`, and `night`.
* **Acoustic Atmosphere:** Real-time WebAudio soundscape with automated volume ducking during speech turns.
* **Continuous Hands-Free Voice:** AssemblyAI v3 streaming WebSocket with ephemeral token minting.
* **Genuine Voice Barge-In:** Continuous audio listening during speech output with immediate speech synthesis and tour cancellation when the guest speaks.
* **ProductAdapter Boundary:** Formal TypeScript contract decoupling ORA Core from Aurelia's visual and spatial implementation.
* **Shortlet Reservation Request Flow:** Deterministic calendar validation, pricing engine ($1,850/night reference rate × nights), dynamic reference generation (`AUR-YYYY-XXXX`), session persistence (`sessionStorage`), and glassmorphic Reservation Request Pass UI.
* **WhatsApp Deep Link Handoff:** Client-side WhatsApp browser deep link handoff (`wa.me`) on the Reservation Pass supporting optional configured host numbers and recipient selection fallback, transitioning status to `HANDOFF_OPENED`.

### Planned Next Implementation:
* **Phase 5:** Dead code pruning and final submission assets.

### Explicitly Excluded (Out of Scope):
* **Live Credit Card Payment Gateways (Stripe/Paystack):** Webhook latency and live card handling distract from the conversational UI thesis.
* **External WhatsApp Business Cloud API / Twilio:** Adds backend server complexity without improving the customer handoff proof; browser `wa.me` deep link truthfully delivers the reservation request.
* **Production SQL / Postgres Infrastructure:** Single-property proof of concept uses in-memory session persistence backed by `sessionStorage`.
* **Hotel Inventory / Room Booking Systems:** Aurelia is a private residence shortlet estate, not a hotel with individual room allocation.
* **Live Availability Engines:** Calendar availability is represented truthfully for demo dates without mocking external PMS integration.
* **User Accounts / Passwords:** Session-level guest identification is sufficient.
