import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  calculateNights,
  calculateReservationPricing,
  generateReservationReference
} from "../src/domain/reservationLogic";
import { AURELIA_RESERVATION_CONFIG } from "../src/domain/reservationConfig";
import { reservationStore } from "../src/domain/reservationStore";
import {
  extractStayDates,
  extractGuestName,
  extractReservationIntent
} from "../src/domain/reservationExtractor";
import { aureliaProductAdapter } from "../src/ora/aureliaAdapter";
import { resolveReservationIntent } from "../src/ora/fastPath";
import {
  ConversationalOraProvider,
  registerOraTestFallback
} from "../src/ora/conversationalOraProvider";
import { defaultPropertyContext } from "../src/ora/oraPropertyContext";
import { executeOraRequest } from "../src/ora/oraProvider";
import { executeServerOraConversation } from "../server/oraConversationEngine";

registerOraTestFallback((transcript, context, session) =>
  executeServerOraConversation(transcript, context, session, { mode: "deterministic-dev" })
);

describe("Phase 3: Reservation Business Logic & Calculations", () => {
  test("calculateNights accurately calculates stay duration across valid dates", () => {
    assert.equal(calculateNights("2026-10-09", "2026-10-11"), 2);
    assert.equal(calculateNights("2026-10-09", "2026-10-10"), 1);
    assert.equal(calculateNights("2026-10-28", "2026-11-02"), 5);
    assert.equal(calculateNights("2026-12-30", "2027-01-03"), 4);
  });

  test("calculateNights throws on invalid date formats or inverted ranges", () => {
    // Check-out before check-in
    assert.throws(
      () => calculateNights("2026-10-11", "2026-10-09"),
      /Check-out date .* must be strictly after/
    );

    // Same-day check-in and check-out (0 nights)
    assert.throws(
      () => calculateNights("2026-10-09", "2026-10-09"),
      /Check-out date .* must be strictly after/
    );

    // Malformed formats
    assert.throws(() => calculateNights("10/09/2026", "2026-10-11"), /Invalid check-in date format/);
    assert.throws(() => calculateNights("2026-10-09", "tomorrow"), /Invalid check-out date format/);
  });

  test("calculateNights rejects impossible calendar dates without normalization", () => {
    // Impossible February 30th
    assert.throws(
      () => calculateNights("2026-02-30", "2026-03-05"),
      /Invalid calendar check-in date: "2026-02-30"/
    );

    // Impossible April 31st
    assert.throws(
      () => calculateNights("2026-04-31", "2026-05-05"),
      /Invalid calendar check-in date: "2026-04-31"/
    );

    // Non-leap year February 29th (2026 is not a leap year)
    assert.throws(
      () => calculateNights("2026-02-29", "2026-03-02"),
      /Invalid calendar check-in date: "2026-02-29"/
    );

    // Leap year February 29th is VALID (2028 is a leap year)
    assert.equal(calculateNights("2028-02-28", "2028-03-01"), 2);
    assert.equal(calculateNights("2028-02-29", "2028-03-01"), 1);

    // Month 00 or 13, Day 00
    assert.throws(() => calculateNights("2026-00-10", "2026-01-15"), /Invalid calendar check-in date/);
    assert.throws(() => calculateNights("2026-13-10", "2027-01-15"), /Invalid calendar check-in date/);
    assert.throws(() => calculateNights("2026-10-00", "2026-10-05"), /Invalid calendar check-in date/);
    assert.throws(() => calculateNights("2026-10-05", "2026-10-32"), /Invalid calendar check-out date/);
  });

  test("pricing is deterministically calculated by the application (nightlyRate * nights)", () => {
    const rate = AURELIA_RESERVATION_CONFIG.nightlyRate;
    assert.equal(rate, 1850);

    const pricing2Nights = calculateReservationPricing(2, rate);
    assert.equal(pricing2Nights.nightlyRate, 1850);
    assert.equal(pricing2Nights.total, 3700);

    const pricing3Nights = calculateReservationPricing(3, rate);
    assert.equal(pricing3Nights.total, 5550);

    assert.throws(() => calculateReservationPricing(0, rate), /Invalid nights value/);
    assert.throws(() => calculateReservationPricing(-1, rate), /Invalid nights value/);
  });

  test("generateReservationReference produces AUR-YYYY-XXXX with dynamic year and no collision", () => {
    const currentYear = new Date().getFullYear();
    const ref = generateReservationReference();
    
    assert.match(ref, new RegExp(`^AUR-${currentYear}-\\d{4}$`));

    // Collision avoidance
    const existing = new Set(["AUR-2026-1111", "AUR-2026-2222"]);
    const uniqueRef = generateReservationReference(existing, 2026);
    assert.equal(existing.has(uniqueRef), false);

    // Deterministic override for testing
    const testRef = generateReservationReference(existing, 2026, "4821");
    assert.equal(testRef, "AUR-2026-4821");
  });
});

describe("Phase 3: Natural Language Reservation Intent Extractor", () => {
  const CURRENT_YEAR = new Date().getFullYear();

  test("extracts stay dates from natural speech Phrasing", () => {
    const range1 = extractStayDates("from October 9th to October 11th");
    assert.equal(range1.checkIn, `${CURRENT_YEAR}-10-09`);
    assert.equal(range1.checkOut, `${CURRENT_YEAR}-10-11`);

    const range2 = extractStayDates("from October 9 to 11");
    assert.equal(range2.checkIn, `${CURRENT_YEAR}-10-09`);
    assert.equal(range2.checkOut, `${CURRENT_YEAR}-10-11`);

    const range3 = extractStayDates("from October 28th to November 2nd");
    assert.equal(range3.checkIn, `${CURRENT_YEAR}-10-28`);
    assert.equal(range3.checkOut, `${CURRENT_YEAR}-11-02`);

    const range4 = extractStayDates("from 2026-10-09 to 2026-10-11");
    assert.equal(range4.checkIn, "2026-10-09");
    assert.equal(range4.checkOut, "2026-10-11");
  });

  test("extracts guest name cleanly without capturing stop words", () => {
    assert.equal(extractGuestName("reserve Aurelia for John from Oct 9 to 11"), "John");
    assert.equal(extractGuestName("book this for Sarah Connor from Nov 1 to Nov 5"), "Sarah Connor");
    assert.equal(extractGuestName("book for David"), "David");
    assert.equal(extractGuestName("reserve for three nights"), undefined); // "three" is a stop word
    assert.equal(extractGuestName("book for next weekend"), undefined); // "next" is a stop word
  });

  test("full extraction for complete demo scenario: 'reserve AURELIA for John from October 9th to October 11th'", () => {
    const res = extractReservationIntent("Ora, I’d like to reserve AURELIA for John from October 9th to October 11th.");
    assert.equal(res.hasReservationIntent, true);
    assert.equal(res.isComplete, true);
    assert.equal(res.guestName, "John");
    assert.equal(res.checkIn, `${CURRENT_YEAR}-10-09`);
    assert.equal(res.checkOut, `${CURRENT_YEAR}-10-11`);
    assert.equal(res.nights, 2);
    assert.equal(res.missingFields.length, 0);
  });

  test("identifies missing information and does NOT guess dates for vague phrases", () => {
    const vague = extractReservationIntent("Book it for next weekend.");
    assert.equal(vague.hasReservationIntent, true);
    assert.equal(vague.isComplete, false);
    assert.ok(vague.validationError?.includes("explicit calendar dates"));

    const missingAll = extractReservationIntent("I want to reserve the shortlet.");
    assert.equal(missingAll.hasReservationIntent, true);
    assert.equal(missingAll.isComplete, false);
    assert.deepEqual(missingAll.missingFields, ["guestName", "checkIn", "checkOut"]);
  });
});

describe("Phase 3: Session Reservation Store", () => {
  beforeEach(() => {
    reservationStore.clear();
  });

  test("creates a READY_FOR_HANDOFF reservation when all required details are present", () => {
    const record = reservationStore.create({
      guestName: "John",
      checkIn: "2026-10-09",
      checkOut: "2026-10-11",
      propertyId: "aurelia-sanctuary",
      source: "ORA"
    });

    assert.ok(record.reference.startsWith("AUR-"));
    assert.equal(record.status, "READY_FOR_HANDOFF");
    assert.equal(record.guestName, "John");
    assert.equal(record.checkIn, "2026-10-09");
    assert.equal(record.checkOut, "2026-10-11");
    assert.equal(record.nights, 2);
    assert.equal(record.nightlyRate, 1850);
    assert.equal(record.total, 3700);
    assert.equal(record.currency, "USD");
    assert.equal(record.source, "ORA");

    // Retrieve from store
    const retrieved = reservationStore.get(record.reference);
    assert.deepEqual(retrieved, record);
    assert.deepEqual(reservationStore.getLatest(), record);
  });

  test("creates a DRAFT reservation when details are incomplete", () => {
    const draft = reservationStore.create({
      guestName: "John",
      source: "ORA"
    });

    assert.equal(draft.status, "DRAFT");
    assert.equal(draft.nights, 0);
    assert.equal(draft.total, 0);
  });

  test("manages status transitions: DRAFT -> READY_FOR_HANDOFF -> HANDOFF_OPENED", () => {
    const record = reservationStore.create({
      guestName: "John",
      checkIn: "2026-10-09",
      checkOut: "2026-10-11"
    });

    assert.equal(record.status, "READY_FOR_HANDOFF");

    const updated = reservationStore.updateStatus(record.reference, "HANDOFF_OPENED");
    assert.equal(updated?.status, "HANDOFF_OPENED");
    assert.equal(reservationStore.get(record.reference)?.status, "HANDOFF_OPENED");
  });

  test("subscribers receive updates when reservations are created or updated", () => {
    let notified = 0;
    const unsubscribe = reservationStore.subscribe(() => {
      notified++;
    });

    reservationStore.create({
      guestName: "Alice",
      checkIn: "2026-11-01",
      checkOut: "2026-11-04"
    });
    assert.equal(notified, 1);

    const latest = reservationStore.getLatest()!;
    reservationStore.updateStatus(latest.reference, "HANDOFF_OPENED");
    assert.equal(notified, 2);

    unsubscribe();
    reservationStore.clear();
    assert.equal(notified, 2); // Unsubscribed, no more calls
  });
});

describe("Phase 3: AureliaProductAdapter INITIATE_TRANSACTION Action", () => {
  beforeEach(() => {
    reservationStore.clear();
  });

  test("executeAction(INITIATE_TRANSACTION) creates a real ReservationRequest", async () => {
    const actionResult = await aureliaProductAdapter.executeAction({
      type: "INITIATE_TRANSACTION",
      payload: {
        transactionType: "RESERVATION",
        guestName: "John",
        checkIn: "2026-10-09",
        checkOut: "2026-10-11"
      }
    });

    assert.equal(actionResult.success, true);
    if (actionResult.success) {
      const reservation = actionResult.data as any;
      assert.ok(reservation);
      assert.ok(reservation.reference.startsWith("AUR-"));
      assert.equal(reservation.status, "READY_FOR_HANDOFF");
      assert.equal(reservation.guestName, "John");
      assert.equal(reservation.nights, 2);
      assert.equal(reservation.total, 3700);

      // Verify stored in session store
      assert.equal(reservationStore.get(reservation.reference)?.guestName, "John");
    }
  });
});

describe("Phase 3: Fast-Path & Conversational End-to-End Flow", () => {
  const provider = new ConversationalOraProvider();
  const context = defaultPropertyContext;

  beforeEach(() => {
    reservationStore.clear();
  });

  test("Primary Demo: 'Ora, I’d like to reserve AURELIA for John from October 9th to October 11th.'", async () => {
    const res = await executeOraRequest(
      "Ora, I’d like to reserve AURELIA for John from October 9th to October 11th.",
      provider,
      context
    );

    assert.ok(res.decision);
    assert.equal(res.decision.type, "INITIATE_TRANSACTION");
    if (res.decision.type === "INITIATE_TRANSACTION") {
      assert.equal(res.decision.guestName, "John");
      assert.ok(res.decision.checkIn?.endsWith("-10-09"));
      assert.ok(res.decision.checkOut?.endsWith("-10-11"));
    }

    assert.equal(res.spokenResponse, "I’ve prepared your reservation request for Aurelia.");
    assert.ok(res.transactionAction);
    assert.equal(res.transactionAction.type, "INITIATE_TRANSACTION");

    // Execute through adapter as OraPresence does
    const actionRes = await aureliaProductAdapter.executeAction(res.transactionAction);
    assert.equal(actionRes.success, true);
    if (actionRes.success) {
      const data = actionRes.data as any;
      assert.equal(data.status, "READY_FOR_HANDOFF");
      assert.equal(data.nights, 2);
      assert.equal(data.total, 3700);
      assert.equal(data.nightlyRate, 1850);
    }
  });

  test("Incomplete Request: 'I want to reserve the shortlet.' produces natural clarification without false booking", async () => {
    const res = await executeOraRequest(
      "I want to reserve the shortlet.",
      provider,
      context
    );

    assert.ok(res.decision);
    assert.equal(res.decision.type, "CLARIFICATION");
    assert.ok(res.spokenResponse.includes("name and your desired check-in and check-out dates"));
  });

  test("Vague Phrasing: 'Book it for next weekend.' requires explicit calendar dates", async () => {
    const res = await executeOraRequest(
      "Book it for next weekend.",
      provider,
      context
    );

    assert.ok(res.decision);
    assert.equal(res.decision.type, "CLARIFICATION");
    assert.ok(res.spokenResponse.includes("explicit calendar dates"));
  });

  test("General Inquiries still return BOOKING_INTENT without false reservation completion", async () => {
    const res = await executeOraRequest("How do I book?", provider, context);
    assert.ok(res.decision);
    assert.equal(res.decision.type, "BOOKING_INTENT");
    assert.ok(res.spokenResponse.includes("private stays"));
  });

  test("Natural Phrasing: 'My name is John, check in October 9, check out October 12' initiates transaction", async () => {
    const res = await executeOraRequest(
      "My name is John, check in October 9, check out October 12",
      provider,
      context
    );

    assert.ok(res.decision);
    assert.equal(res.decision.type, "INITIATE_TRANSACTION");
    if (res.decision.type === "INITIATE_TRANSACTION") {
      assert.equal(res.decision.guestName, "John");
      assert.ok(res.decision.checkIn?.endsWith("-10-09"));
      assert.ok(res.decision.checkOut?.endsWith("-10-12"));
    }

    assert.equal(res.spokenResponse, "I’ve prepared your reservation request for Aurelia.");
  });

  test("Multi-Turn Booking Flow: Inquire to book -> provide name & stay dates with check out phrasing", async () => {
    const session = { history: [], recentTurns: [] };

    // Turn 1: User expresses desire to book
    const turn1 = await executeOraRequest("I want to reserve the shortlet.", provider, context, session);
    assert.equal(turn1.decision?.type, "CLARIFICATION");
    assert.ok(turn1.spokenResponse.includes("name and your desired check-in and check-out dates"));

    // Turn 2: User provides name and stay dates: 'My name is Oye, I want to be in here for October 9th and check out October 12th'
    const turn2 = await executeOraRequest(
      "My name is Oye, I want to be in here for October 9th and check out October 12th",
      provider,
      context,
      session
    );

    assert.ok(turn2.decision);
    assert.equal(turn2.decision.type, "INITIATE_TRANSACTION");
    if (turn2.decision.type === "INITIATE_TRANSACTION") {
      assert.equal(turn2.decision.guestName, "Oye");
      assert.ok(turn2.decision.checkIn?.endsWith("-10-09"));
      assert.ok(turn2.decision.checkOut?.endsWith("-10-12"));
    }
    assert.equal(turn2.spokenResponse, "I’ve prepared your reservation request for Aurelia.");
  });

  test("Multi-Turn Incremental: Turn 1 book -> Turn 2 name only -> Turn 3 dates only", async () => {
    const session = { history: [], recentTurns: [] };

    // Turn 1
    const t1 = await executeOraRequest("I want to book the shortlet", provider, context, session);
    assert.equal(t1.decision?.type, "CLARIFICATION");

    // Turn 2: Name only
    const t2 = await executeOraRequest("My name is Sarah Connor", provider, context, session);
    assert.equal(t2.decision?.type, "CLARIFICATION");
    assert.ok(t2.spokenResponse.includes("Sarah Connor"));

    // Turn 3: Dates only
    const t3 = await executeOraRequest("from October 9th to October 12th", provider, context, session);
    assert.equal(t3.decision?.type, "INITIATE_TRANSACTION");
    if (t3.decision?.type === "INITIATE_TRANSACTION") {
      assert.equal(t3.decision.guestName, "Sarah Connor");
      assert.ok(t3.decision.checkIn?.endsWith("-10-09"));
      assert.ok(t3.decision.checkOut?.endsWith("-10-12"));
    }
  });

  test("Complete Multi-Turn Sequence: reserve -> name -> check in -> check out with deterministic pricing & checkout correction", async () => {
    const session = { history: [], recentTurns: [] };

    // Turn 1: "I'd like to reserve Aurelia."
    const t1 = await executeOraRequest("I'd like to reserve Aurelia.", provider, context, session);
    assert.equal(t1.decision?.type, "CLARIFICATION");

    // Turn 2: "My name is John."
    const t2 = await executeOraRequest("My name is John.", provider, context, session);
    assert.equal(t2.decision?.type, "CLARIFICATION");
    assert.ok(t2.spokenResponse.includes("John"));

    // Turn 3: "Check in October 20, 2026."
    const t3 = await executeOraRequest("Check in October 20, 2026.", provider, context, session);
    assert.equal(t3.decision?.type, "CLARIFICATION");

    // Turn 4: "Check out October 22, 2026." -> complete 2 nights at $1,850 = $3,700
    const t4 = await executeOraRequest("Check out October 22, 2026.", provider, context, session);
    assert.equal(t4.decision?.type, "INITIATE_TRANSACTION");
    if (t4.decision?.type === "INITIATE_TRANSACTION") {
      assert.equal(t4.decision.guestName, "John");
      assert.equal(t4.decision.checkIn, "2026-10-20");
      assert.equal(t4.decision.checkOut, "2026-10-22");
    }

    // Turn 5: Correction - "Check out October 23, 2026." -> updates checkOut to 23rd
    const t5 = await executeOraRequest("Check out October 23, 2026.", provider, context, session);
    assert.equal(t5.decision?.type, "INITIATE_TRANSACTION");
    if (t5.decision?.type === "INITIATE_TRANSACTION") {
      assert.equal(t5.decision.guestName, "John");
      assert.equal(t5.decision.checkIn, "2026-10-20");
      assert.equal(t5.decision.checkOut, "2026-10-23");
    }
  });

  test("Cancellation boundary: fresh request does not inherit details from canceled booking", async () => {
    const session = { history: [], recentTurns: [] };

    // Turn 1: User reserves under John
    await executeOraRequest("Reserve Aurelia for John from October 20 to 22, 2026", provider, context, session);

    // Turn 2: Cancel
    const cancelTurn = await executeOraRequest("cancel", provider, context, session);
    assert.equal(cancelTurn.decision?.type, "PROPERTY_ANSWER");

    // Turn 3: Fresh inquiry from Sarah
    const fresh = await executeOraRequest("I want to reserve Aurelia", provider, context, session);
    assert.equal(fresh.decision?.type, "CLARIFICATION");
    // Should NOT have preserved "John" or "2026-10-20"
    if (fresh.decision?.type === "CLARIFICATION") {
      assert.doesNotMatch(fresh.spokenResponse, /John/);
    }
  });

  test("Invalid calendar date in multi-turn prompts clarification rather than silent distortion", async () => {
    const session = { history: [], recentTurns: [] };
    await executeOraRequest("Reserve Aurelia for Alice", provider, context, session);

    // Feb 30 does not exist
    const invalidTurn = await executeOraRequest("from 2026-02-30 to 2026-03-05", provider, context, session);
    assert.equal(invalidTurn.decision?.type, "CLARIFICATION");
    assert.ok(invalidTurn.spokenResponse.includes("Invalid calendar check-in date"));
  });

  test("Day-first natural date range with speech filler: 'My name is John, from 5th to like 8th of October 2026'", async () => {
    const session = { history: [], recentTurns: [] };
    const t1 = await executeOraRequest("I want to book a night", provider, context, session);
    assert.equal(t1.decision?.type, "CLARIFICATION");

    const t2 = await executeOraRequest("My name is John, from 5th to like 8th of October 2026", provider, context, session);
    assert.equal(t2.decision?.type, "INITIATE_TRANSACTION");
    if (t2.decision?.type === "INITIATE_TRANSACTION") {
      assert.equal(t2.decision.guestName, "John");
      assert.equal(t2.decision.checkIn, "2026-10-05");
      assert.equal(t2.decision.checkOut, "2026-10-08");
    }
    assert.equal(t2.spokenResponse, "I’ve prepared your reservation request for Aurelia.");
  });

  test("Graceful Topic Switch: User deflects from booking to 'let me see the whole house' without reservation trap", async () => {
    const session = { history: [], recentTurns: [] };
    const t1 = await executeOraRequest("I want to book", provider, context, session);
    assert.ok(t1.decision);

    const t2 = await executeOraRequest("let me see the whole house", provider, context, session);
    assert.equal(t2.decision?.type, "START_TOUR");
    assert.equal(t2.spokenResponse, "Of course. Let us tour Aurelia Sanctuary step-by-step.");

    const t3 = await executeOraRequest("let me see the sunset", provider, context, session);
    assert.equal(t3.decision?.type, "CHANGE_AMBIANCE");
    if (t3.decision?.type === "CHANGE_AMBIANCE") {
      assert.equal(t3.decision.ambiance, "sunset");
    }

    const t4 = await executeOraRequest("let me see the building", provider, context, session);
    assert.equal(t4.decision?.type, "SHOW_SPACE");
    if (t4.decision?.type === "SHOW_SPACE") {
      assert.equal(t4.decision.spaceId, "exterior");
    }
  });

  test("Graceful Cancellation: 'never mind' cleanly exits reservation mode", async () => {
    const session = { history: [], recentTurns: [] };
    await executeOraRequest("I want to reserve the shortlet", provider, context, session);

    const cancel = await executeOraRequest("never mind", provider, context, session);
    assert.equal(cancel.decision?.type, "PROPERTY_ANSWER");
    assert.ok(cancel.spokenResponse.includes("Understood"));
  });

  test("Billing Flow: 'prepare me my bills' on cold start requests stay dates", async () => {
    const session = { history: [], recentTurns: [] };
    const res = await executeOraRequest("prepare me my bills", provider, context, session);
    assert.equal(res.decision?.type, "CLARIFICATION");
    assert.ok(res.spokenResponse.includes("prepare your bill and reservation pass"));
  });

  test("Billing Flow: 'from 5th to 8th of October 2026. Prepare me my bills' immediately initiates bill pass", async () => {
    const session = { history: [], recentTurns: [] };
    const res = await executeOraRequest("from 5th to 8th of October 2026. Prepare me my bills", provider, context, session);
    assert.equal(res.decision?.type, "INITIATE_TRANSACTION");
    if (res.decision?.type === "INITIATE_TRANSACTION") {
      assert.equal(res.decision.checkIn, "2026-10-05");
      assert.equal(res.decision.checkOut, "2026-10-08");
    }
    assert.equal(res.spokenResponse, "I’ve prepared your bill and reservation pass for Aurelia Sanctuary.");
  });

  test("Billing Flow: 'prepare my bill' inherits existing reservation from store", async () => {
    reservationStore.create({
      guestName: "Oye",
      checkIn: "2026-10-05",
      checkOut: "2026-10-08"
    });

    const session = { history: [], recentTurns: [] };
    const res = await executeOraRequest("prepare me my bills", provider, context, session);
    assert.equal(res.decision?.type, "INITIATE_TRANSACTION");
    if (res.decision?.type === "INITIATE_TRANSACTION") {
      assert.equal(res.decision.guestName, "Oye");
      assert.equal(res.decision.checkIn, "2026-10-05");
      assert.equal(res.decision.checkOut, "2026-10-08");
    }
    assert.equal(res.spokenResponse, "I’ve prepared your bill and reservation pass for Aurelia Sanctuary.");
  });
});
