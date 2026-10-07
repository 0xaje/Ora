# 3-Minute Video Demonstration Plan — AURELIA

> **Target Duration:** 2 minutes 30 seconds (Hard limit: under 3:00)  
> **Core Principle:** Show the product WORKING live on screen. Prioritize genuine voice interaction and spatial response over slides.

---

## Timeline & Scene Choreography

| Timestamp | Screen Action | Voice / Spoken Script | Technical Highlight |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:25** | **The Thesis & Arrival:**<br>Full screen view of Aurelia Sanctuary landing page. Unmute atmospheric audio. Smoothly scroll through the 300-frame canvas hero. | *"Traditional estate booking is broken by endless filter dropdowns and disconnected chatbots. With Aurelia, the architectural space itself is the interface."* | Hardware-accelerated 300-frame photographic canvas + WebAudio soundscape. |
| **0:25 – 0:55** | **Spatial & Ambiance Voice Control:**<br>Mic active. Speak naturally to ORA. | **Speaker:** *"Ora, show me the living room at sunset."*<br>**Ora:** *"Here is the living room at sunset."* | AssemblyAI v3 streaming STT, <1ms fast-path intent router, camera scrubs to living room, lighting warms to sunset, audio ducks. |
| **0:55 – 1:20** | **Architectural Detail & Instant Barge-In:**<br>Request a detail sanctuary space, then interrupt Ora. | **Speaker:** *"Show me the master bedroom."*<br>*(Placard centers)*<br>**Ora begins speaking...**<br>**Speaker (interrupts):** *"Actually, let's see the infinity pool."* | Spatial detail view centering + immediate voice barge-in canceling active speech. |
| **1:20 – 1:45** | **Autonomous Grand Tour:**<br>Initiate guided exploration. | **Speaker:** *"Give me a tour of the sanctuary."*<br>*(Ora guides sequential camera tour across estate spaces with concierge narration)* | Autonomous multi-stop tour sequencer with timed camera moves and narration. |
| **1:45 – 2:15** | **Spoken Reservation Request:**<br>Initiate verified stay booking. | **Speaker:** *"Ora, I'd like to reserve Aurelia for John from October 9th to October 11th."*<br>**Ora:** *"I've prepared your reservation request for Aurelia."*<br>*(Glassmorphic Reservation Pass animates into view)* | Natural language entity extraction (name + dates), deterministic pricing ($1,850 × 2 = $3,700), dynamic `AUR-YYYY-XXXX` reference. |
| **2:15 – 2:35** | **Mobile WhatsApp Handoff:**<br>Inspect the itemized Reservation Pass and click CTA. | *(Cursor clicks **"Continue on WhatsApp"**)*<br>*(Browser tab opens with prefilled WhatsApp message containing dates, reference, and total)* | Client-side URL-encoded `wa.me` deep link, state transitions to `HANDOFF_OPENED`. |
| **2:35 – 2:50** | **Closing Summary:**<br>Brief architecture slide or camera overview. | *"Aurelia proves that conversational AI can move beyond text boxes to embody high-value spaces and drive real commerce. Built for Devpost Build With AI: Basics."* | Product Adapter architecture, 261 automated tests, MIT open-source repository. |

---

## Screen Recording Guidelines
1. **Screen Resolution:** 1080p (1920x1080) at 60fps for smooth canvas scrub visuals.
2. **Audio Setup:** Enable desktop system audio (to capture WebAudio soundscape and Ora TTS) and microphone input for your spoken questions.
3. **Pacing:** Speak at a natural, calm cadence; pause briefly after commands to let the spatial transitions breathe.
