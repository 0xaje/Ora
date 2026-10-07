/**
 * AURELIA — Shortlet Reservation Intent & Detail Extractor
 * 
 * Extracts guest name and stay dates deterministically from visitor natural language.
 * Never invents dates or silent defaults from vague phrases (e.g. "next weekend").
 * Supports multi-turn continuity to aggregate details across conversational turns.
 */

import { calculateNights } from "./reservationLogic";
import { reservationStore } from "./reservationStore";
import type { OraConversationContext } from "../ora/oraTypes";

export interface ExtractedReservationIntent {
  hasReservationIntent: boolean;
  isComplete: boolean;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  missingFields: Array<"guestName" | "checkIn" | "checkOut">;
  validationError?: string;
}

const MONTH_NAMES: Record<string, string> = {
  january: "01",
  jan: "01",
  february: "02",
  feb: "02",
  march: "03",
  mar: "03",
  april: "04",
  apr: "04",
  may: "05",
  june: "06",
  jun: "06",
  july: "07",
  jul: "07",
  august: "08",
  aug: "08",
  september: "09",
  sep: "09",
  sept: "09",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12"
};

const MONTH_PATTERN = Object.keys(MONTH_NAMES).join("|");

/**
 * Normalizes day string (e.g. "9th", "11", "1st") to two-digit format ("09", "11", "01").
 */
function normalizeDay(dayStr: string): string {
  const digits = dayStr.replace(/\D/g, "");
  return digits.padStart(2, "0");
}

/**
 * Calculates a future ISO date string given a base date and number of days.
 */
function addDaysToIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const ry = dt.getUTCFullYear();
  const rm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const rd = String(dt.getUTCDate()).padStart(2, "0");
  return `${ry}-${rm}-${rd}`;
}

const DURATION_WORDS: Record<string, number> = {
  a: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10
};

/**
 * Common conversational and architectural stop words that should not be extracted as names.
 */
const GUEST_NAME_STOP_WORDS = new Set([
  "aurelia",
  "sanctuary",
  "shortlet",
  "estate",
  "house",
  "property",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "next",
  "weekend",
  "tonight",
  "today",
  "tomorrow",
  "the",
  "a",
  "an",
  "me",
  "us",
  "my",
  "our",
  "him",
  "her",
  "them",
  "from",
  "to",
  "until",
  "through",
  "between",
  "starting",
  "on",
  "at",
  "in",
  "with",
  "dates",
  "night",
  "nights",
  "day",
  "days",
  "check",
  "checking",
  "in",
  "out",
  "checkout",
  "checkin",
  "want",
  "would",
  "like",
  "will",
  "please",
  "can",
  "could",
  "be",
  "here",
  "there",
  "stay",
  "staying",
  "book",
  "booking",
  "reserve",
  "reservation",
  "period",
  "time",
  "so",
  "now",
  "and",
  "or",
  "but",
  "for",
  "october",
  "november",
  "december",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september"
]);

/**
 * Cleans candidate words, stopping at any stop word, and returns a title-cased name.
 */
function cleanNameCandidate(candidate: string): string | undefined {
  const words = candidate.split(/\s+/).filter(Boolean);
  const validWords: string[] = [];

  for (const w of words) {
    if (GUEST_NAME_STOP_WORDS.has(w.toLowerCase())) {
      break;
    }
    validWords.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }

  if (validWords.length > 0) {
    return validWords.join(" ");
  }
  return undefined;
}

/**
 * Extracts guest name from natural language:
 * Supports:
 * - "for John", "for John Doe", "for Sarah Connor"
 * - "My name is John", "My name's Sarah", "Name is David"
 * - "I am John Doe", "I'm Michael"
 * - "This is John", "Call me Alice", "Under the name Sarah"
 */
export function extractGuestName(input: string): string | undefined {
  const text = input.trim();

  // 1. Introductions: "My name is <Name>", "Name is <Name>", "I am <Name>", "I'm <Name>", "Under the name <Name>"
  const introMatch = text.match(
    /\b(?:my\s+name\s+is|my\s+name's|name\s+is|i\s+am|i'm|this\s+is|call\s+me|under(?:\s+the)?\s+name)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b/i
  );
  if (introMatch) {
    const candidate = cleanNameCandidate(introMatch[1].trim());
    if (candidate) return candidate;
  }

  // 2. Prepositional: "for <GuestName>" (e.g. "for John", "for John Doe", "for Sarah")
  const forMatch = text.match(/\bfor\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b/i);
  if (forMatch) {
    const candidate = cleanNameCandidate(forMatch[1].trim());
    if (candidate) return candidate;
  }

  return undefined;
}

/**
 * Parses natural language check-in and check-out dates from an utterance.
 * Supports:
 * - ISO dates: "from 2026-10-09 to 2026-10-11"
 * - Explicit check-in/out: "check in October 9th, check out October 12th", "check in on October 9 and check out October 12"
 * - Natural range: "from October 9th to October 11th", "from October 9 to 11", "from October 28th to November 2nd"
 * - Sentence context: "be in here for October 9th and check out October 12th"
 * Returns YYYY-MM-DD format with dynamic current year.
 */
export function extractStayDates(
  input: string,
  referenceYear: number = new Date().getFullYear()
): { checkIn?: string; checkOut?: string } {
  const text = input.trim();
  const explicitYearMatch = text.match(/\b(20\d{2})\b/);
  const year = explicitYearMatch ? parseInt(explicitYearMatch[1], 10) : referenceYear;

  // 1. ISO Date Range Format: YYYY-MM-DD to YYYY-MM-DD
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|-|until|through|and|\s)\s*(?:check\s*out\s*(?:on\s*)?)?(\d{4}-\d{2}-\d{2})/i);
  if (isoMatch) {
    return {
      checkIn: isoMatch[1],
      checkOut: isoMatch[2]
    };
  }

  // 2. Explicit Check-in and Check-out Phrasing:
  // e.g. "check in October 9th, check out October 12th", "check in on Oct 9 and check out Oct 12"
  const checkInOutRegex = new RegExp(
    `check(?:ing)?\\s*in\\s+(?:on\\s+)?(?:from\\s+)?(${MONTH_PATTERN})\\s+(\\d{1,2}(?:st|nd|rd|th)?)[^a-z0-9]*.*?(?:and\\s+)?check(?:ing)?\\s*out\\s+(?:on\\s+)?(?:(${MONTH_PATTERN})\\s+)?(\\d{1,2}(?:st|nd|rd|th)?)`,
    "i"
  );
  const m1 = text.match(checkInOutRegex);
  if (m1) {
    const sm = MONTH_NAMES[m1[1].toLowerCase()];
    const sd = normalizeDay(m1[2]);
    const em = m1[3] ? MONTH_NAMES[m1[3].toLowerCase()] : sm;
    const ed = normalizeDay(m1[4]);
    return {
      checkIn: `${year}-${sm}-${sd}`,
      checkOut: `${year}-${em}-${ed}`
    };
  }

  // Day-first explicit check-in / check-out: "check in 5th of October, check out 8th of October"
  const checkInOutDayFirstRegex = new RegExp(
    `check(?:ing)?\\s*in\\s+(?:on\\s+)?(?:from\\s+)?(?:the\\s+)?(\\d{1,2}(?:st|nd|rd|th)?)\\s+(?:of\\s+)?(${MONTH_PATTERN})[^a-z0-9]*.*?(?:and\\s+)?check(?:ing)?\\s*out\\s+(?:on\\s+)?(?:the\\s+)?(\\d{1,2}(?:st|nd|rd|th)?)(?:\\s+(?:of\\s+)?(${MONTH_PATTERN}))?`,
    "i"
  );
  const m1b = text.match(checkInOutDayFirstRegex);
  if (m1b) {
    const sd = normalizeDay(m1b[1]);
    const sm = MONTH_NAMES[m1b[2].toLowerCase()];
    const ed = normalizeDay(m1b[3]);
    const em = m1b[4] ? MONTH_NAMES[m1b[4].toLowerCase()] : sm;
    return {
      checkIn: `${year}-${sm}-${sd}`,
      checkOut: `${year}-${em}-${ed}`
    };
  }

  // 3. Day-First Natural Date Range (Single Month):
  // e.g. "from 5th to like 8th of October 2026", "5th to 8th of October", "the 5th to the 8th of October", "from 5th to 8th October"
  const dayFirstSingleMonthRegex = new RegExp(
    `(?:from|between)?\\s*(?:the\\s+)?(\\d{1,2}(?:st|nd|rd|th)?)\\s*(?:to|-|until|through|and|\\s+and\\s+)\\s*(?:like\\s+)?(?:the\\s+)?(\\d{1,2}(?:st|nd|rd|th)?)\\s*(?:of\\s+)?(${MONTH_PATTERN})`,
    "i"
  );
  const mDayFirst = text.match(dayFirstSingleMonthRegex);
  if (mDayFirst) {
    const sm = MONTH_NAMES[mDayFirst[3].toLowerCase()];
    const sd = normalizeDay(mDayFirst[1]);
    const ed = normalizeDay(mDayFirst[2]);
    return {
      checkIn: `${year}-${sm}-${sd}`,
      checkOut: `${year}-${sm}-${ed}`
    };
  }

  // 4. Day-First Natural Date Range (Across Two Months):
  // e.g. "from 28th of October to 2nd of November", "5th October to 8th October"
  const dayFirstTwoMonthsRegex = new RegExp(
    `(?:from|between)?\\s*(?:the\\s+)?(\\d{1,2}(?:st|nd|rd|th)?)\\s+(?:of\\s+)?(${MONTH_PATTERN})\\s*(?:to|-|until|through|and)\\s*(?:the\\s+)?(\\d{1,2}(?:st|nd|rd|th)?)\\s+(?:of\\s+)?(${MONTH_PATTERN})`,
    "i"
  );
  const mDayFirst2 = text.match(dayFirstTwoMonthsRegex);
  if (mDayFirst2) {
    const sd = normalizeDay(mDayFirst2[1]);
    const sm = MONTH_NAMES[mDayFirst2[2].toLowerCase()];
    const ed = normalizeDay(mDayFirst2[3]);
    const em = MONTH_NAMES[mDayFirst2[4].toLowerCase()];
    return {
      checkIn: `${year}-${sm}-${sd}`,
      checkOut: `${year}-${em}-${ed}`
    };
  }

  // 5. Month-First Natural Month + Day Range:
  // e.g. "from October 9th to October 11th", "from October 9 to 11", "October 9th through 12th"
  const dateRangeRegex = new RegExp(
    `(?:from|for|between)?\\s*(${MONTH_PATTERN})\\s+(\\d{1,2}(?:st|nd|rd|th)?)\\s*(?:to|-|until|through|and\\s+check\\s*out\\s*(?:on\\s*)?)\\s*(?:(${MONTH_PATTERN})\\s+)?(\\d{1,2}(?:st|nd|rd|th)?)`,
    "i"
  );
  const m2 = text.match(dateRangeRegex);
  if (m2) {
    const sm = MONTH_NAMES[m2[1].toLowerCase()];
    const sd = normalizeDay(m2[2]);
    const em = m2[3] ? MONTH_NAMES[m2[3].toLowerCase()] : sm;
    const ed = normalizeDay(m2[4]);
    return {
      checkIn: `${year}-${sm}-${sd}`,
      checkOut: `${year}-${em}-${ed}`
    };
  }

  // 6. Duration + Start Date (or Start Date + Duration):
  // e.g. "a night from October 5th", "for 3 nights from October 5th", "from 5th of October for 2 nights", "for 3 days from October 5th"
  const durThenDateRegex = new RegExp(
    `(?:for\\s+)?(\\d+|a|one|two|three|four|five|six|seven|eight|nine|ten)\\s+(?:nights?|days?)\\s+(?:from|starting(?:\\s+on)?|beginning(?:\\s+on)?)\\s+(?:the\\s+)?(?:(${MONTH_PATTERN})\\s+(\\d{1,2}(?:st|nd|rd|th)?)|(\\d{1,2}(?:st|nd|rd|th)?)\\s+(?:of\\s+)?(${MONTH_PATTERN}))`,
    "i"
  );
  const mDur1 = text.match(durThenDateRegex);
  if (mDur1) {
    const durStr = mDur1[1].toLowerCase();
    const nights = DURATION_WORDS[durStr] ?? parseInt(durStr, 10);
    const month = mDur1[2] ? MONTH_NAMES[mDur1[2].toLowerCase()] : MONTH_NAMES[mDur1[5].toLowerCase()];
    const day = mDur1[3] ? normalizeDay(mDur1[3]) : normalizeDay(mDur1[4]);
    const checkIn = `${year}-${month}-${day}`;
    const checkOut = addDaysToIso(checkIn, nights);
    return { checkIn, checkOut };
  }

  const dateThenDurRegex = new RegExp(
    `(?:from|starting(?:\\s+on)?)\\s+(?:the\\s+)?(?:(${MONTH_PATTERN})\\s+(\\d{1,2}(?:st|nd|rd|th)?)|(\\d{1,2}(?:st|nd|rd|th)?)\\s+(?:of\\s+)?(${MONTH_PATTERN}))(?:\\s+to\\s+stay)?(?:\\s+for)?(?:\\s+like)?\\s+(\\d+|a|one|two|three|four|five|six|seven|eight|nine|ten)\\s+(?:nights?|days?)`,
    "i"
  );
  const mDur2 = text.match(dateThenDurRegex);
  if (mDur2) {
    const month = mDur2[1] ? MONTH_NAMES[mDur2[1].toLowerCase()] : MONTH_NAMES[mDur2[4].toLowerCase()];
    const day = mDur2[2] ? normalizeDay(mDur2[2]) : normalizeDay(mDur2[3]);
    const durStr = mDur2[5].toLowerCase();
    const nights = DURATION_WORDS[durStr] ?? parseInt(durStr, 10);
    const checkIn = `${year}-${month}-${day}`;
    const checkOut = addDaysToIso(checkIn, nights);
    return { checkIn, checkOut };
  }

  // 7. Two distinct month/day expressions anywhere in the text:
  // e.g. "I want to be in here for October 9th and check out October 12th"
  const allDatesRegex = new RegExp(`(?:(${MONTH_PATTERN})\\s+(\\d{1,2}(?:st|nd|rd|th)?)|(\\d{1,2}(?:st|nd|rd|th)?)\\s+(?:of\\s+)?(${MONTH_PATTERN}))`, "gi");
  const matches = [...text.matchAll(allDatesRegex)];
  if (matches.length >= 2) {
    const sm = matches[0][1] ? MONTH_NAMES[matches[0][1].toLowerCase()] : MONTH_NAMES[matches[0][4].toLowerCase()];
    const sd = matches[0][2] ? normalizeDay(matches[0][2]) : normalizeDay(matches[0][3]);
    const em = matches[1][1] ? MONTH_NAMES[matches[1][1].toLowerCase()] : MONTH_NAMES[matches[1][4].toLowerCase()];
    const ed = matches[1][2] ? normalizeDay(matches[1][2]) : normalizeDay(matches[1][3]);
    return {
      checkIn: `${year}-${sm}-${sd}`,
      checkOut: `${year}-${em}-${ed}`
    };
  }

  // 8. Single check-in or single check-out specification
  const singleCheckIn = text.match(/check(?:ing)?\s*in\s+(?:on\s+)?(?:from\\s+)?(?:(${MONTH_PATTERN})\s+(\\d{1,2}(?:st|nd|rd|th)?)|(?:the\\s+)?(\\d{1,2}(?:st|nd|rd|th)?)\\s+(?:of\\s+)?(${MONTH_PATTERN}))/i);
  const singleCheckOut = text.match(/check(?:ing)?\s*out\s+(?:on\\s+)?(?:(${MONTH_PATTERN})\s+(\\d{1,2}(?:st|nd|rd|th)?)|(?:the\\s+)?(\\d{1,2}(?:st|nd|rd|th)?)\\s+(?:of\\s+)?(${MONTH_PATTERN}))/i);

  const res: { checkIn?: string; checkOut?: string } = {};
  if (singleCheckIn) {
    const m = singleCheckIn[1] ? MONTH_NAMES[singleCheckIn[1].toLowerCase()] : MONTH_NAMES[singleCheckIn[4].toLowerCase()];
    const d = singleCheckIn[2] ? normalizeDay(singleCheckIn[2]) : normalizeDay(singleCheckIn[3]);
    res.checkIn = `${year}-${m}-${d}`;
  }
  if (singleCheckOut) {
    const m = singleCheckOut[1] ? MONTH_NAMES[singleCheckOut[1].toLowerCase()] : MONTH_NAMES[singleCheckOut[4].toLowerCase()];
    const d = singleCheckOut[2] ? normalizeDay(singleCheckOut[2]) : normalizeDay(singleCheckOut[3]);
    res.checkOut = `${year}-${m}-${d}`;
  }
  if (res.checkIn || res.checkOut) {
    return res;
  }

  return {};
}

/**
 * Detects whether the visitor's utterance expresses a reservation intent and extracts
 * all available booking parameters. Supports session history to aggregate details
 * across conversational turns.
 */
export function extractReservationIntent(
  input: string,
  referenceYear?: number,
  session?: OraConversationContext
): ExtractedReservationIntent {
  const norm = input.toLowerCase().replace(/[^a-z0-9_\s-]/g, " ").replace(/\s+/g, " ").trim();

  // 1. Direct reservation & billing phrasing
  const hasBillingPhrases =
    norm.includes("bill") ||
    norm.includes("bills") ||
    norm.includes("prepare my bill") ||
    norm.includes("prepare me my bill") ||
    norm.includes("prepare me my bills") ||
    norm.includes("prepare the bill") ||
    norm.includes("calculate my bill") ||
    norm.includes("show my bill") ||
    norm.includes("show me my bill") ||
    norm.includes("show the bill") ||
    norm.includes("show me the bill") ||
    norm.includes("do my payment") ||
    norm.includes("make payment") ||
    norm.includes("payment details") ||
    norm.includes("how much do i pay") ||
    norm.includes("my payment") ||
    norm.includes("pay for") ||
    norm.includes("checkout bill");

  const hasDirectPhrases =
    hasBillingPhrases ||
    norm.includes("reserve") ||
    norm.includes("reservation") ||
    norm.includes("book") ||
    norm.includes("booking") ||
    norm.includes("stay for") ||
    norm.includes("plan a stay") ||
    norm.includes("stay in") ||
    norm.includes("stay here") ||
    norm.includes("stay at") ||
    norm.includes("stay from") ||
    norm.includes("check in") ||
    norm.includes("checking in") ||
    norm.includes("check out") ||
    norm.includes("checking out") ||
    norm.includes("be in here") ||
    norm.includes("be here") ||
    norm.includes("dates from");

  // Extract from current turn
  let guestName = extractGuestName(input);
  let { checkIn, checkOut } = extractStayDates(input, referenceYear);

  const hasDatesInCurrentTurn = Boolean(checkIn || checkOut);
  const hasNameInCurrentTurn = Boolean(guestName);
  const hasDurationInCurrentTurn = /\b(\d+|a|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:nights?|days?)\b/i.test(norm);
  const providesReservationDetail =
    hasDatesInCurrentTurn ||
    hasNameInCurrentTurn ||
    hasDurationInCurrentTurn ||
    hasDirectPhrases ||
    hasBillingPhrases;

  // Direct cancellation or deflection phrases:
  const isCancellationOrDeflection =
    norm === "never mind" ||
    norm === "nevermind" ||
    norm === "cancel" ||
    norm === "cancel reservation" ||
    norm === "cancel booking" ||
    norm === "forget it" ||
    norm === "forget that" ||
    norm === "stop" ||
    norm === "not now" ||
    norm === "stop booking";

  // Check if utterance is navigation / tour / ambiance directive:
  const isDirectNavigationOrAmbiance =
    norm.includes("see the whole house") ||
    norm.includes("see the building") ||
    norm.includes("see the house") ||
    norm.includes("take me around") ||
    norm.includes("show me around") ||
    norm.includes("take me inside") ||
    norm.includes("show me inside") ||
    norm.includes("show me outside") ||
    norm.includes("take me back") ||
    norm.includes("go back") ||
    norm.includes("sunset") ||
    norm.includes("golden hour") ||
    norm.includes("after dark") ||
    norm.includes("full tour") ||
    norm.includes("grand tour") ||
    norm.includes("everything");

  // 2. Check conversational context from previous turns
  let hasContextualReservationIntent = false;
  if (!isCancellationOrDeflection && (!isDirectNavigationOrAmbiance || providesReservationDetail)) {
    if (session?.recentTurns && session.recentTurns.length > 0) {
      const recent = session.recentTurns.slice(-4);
      for (let i = recent.length - 1; i >= 0; i--) {
        const turn = recent[i];
        if (turn.role === "ora") {
          const textLower = turn.text.toLowerCase();
          if (
            textLower.includes("reservation") ||
            textLower.includes("bill") ||
            textLower.includes("desired check-in") ||
            textLower.includes("what dates would you like") ||
            textLower.includes("share your name") ||
            turn.decision?.type === "BOOKING_INTENT" ||
            (turn.decision?.type === "CLARIFICATION" && (turn.decision as any).reason?.includes("reservation")) ||
            (turn.decision?.type === "CLARIFICATION" && (turn.decision as any).reason?.includes("missing_"))
          ) {
            // Only activate contextual intent if the current turn actually provides reservation details
            if (providesReservationDetail) {
              hasContextualReservationIntent = true;
            }
            break;
          }
        }
      }

      // Inherit missing fields from earlier turns if user is continuing the reservation flow
      if (hasContextualReservationIntent || hasDirectPhrases || providesReservationDetail) {
        if (!guestName || !checkIn || !checkOut) {
          for (let i = recent.length - 1; i >= 0; i--) {
            const turn = recent[i];
            if (turn.decision && turn.decision.type === "INITIATE_TRANSACTION") {
              if (!guestName && (turn.decision as any).guestName && (turn.decision as any).guestName !== "Guest") {
                guestName = (turn.decision as any).guestName;
              }
              if (!checkIn && (turn.decision as any).checkIn) {
                checkIn = (turn.decision as any).checkIn;
              }
              if (!checkOut && (turn.decision as any).checkOut) {
                checkOut = (turn.decision as any).checkOut;
              }
            }
            if (turn.role === "user") {
              if (!guestName) {
                const prevName = extractGuestName(turn.text);
                if (prevName) guestName = prevName;
              }
              if (!checkIn || !checkOut) {
                const prevDates = extractStayDates(turn.text, referenceYear);
                if (!checkIn && prevDates.checkIn) checkIn = prevDates.checkIn;
                if (!checkOut && prevDates.checkOut) checkOut = prevDates.checkOut;
              }
            }
          }
        }
      }
    }

    // Also inherit from latest active reservation in session store if user asks for bill or details are missing
    if (hasBillingPhrases || hasDirectPhrases || hasContextualReservationIntent) {
      if (!guestName || !checkIn || !checkOut) {
        try {
          const latestReq = reservationStore.getLatest();
          if (latestReq) {
            if (!guestName && latestReq.guestName && latestReq.guestName !== "Guest") {
              guestName = latestReq.guestName;
            }
            if (!checkIn && latestReq.checkIn) {
              checkIn = latestReq.checkIn;
            }
            if (!checkOut && latestReq.checkOut) {
              checkOut = latestReq.checkOut;
            }
          }
        } catch {
          // In environments without session store, proceed gracefully
        }
      }

      // For explicit billing inquiries, if dates are known, default guestName to "Guest" so bill is prepared
      if (hasBillingPhrases && checkIn && checkOut && !guestName) {
        guestName = "Guest";
      }
    }
  }

  const hasValidDates = Boolean(checkIn && checkOut);
  const hasNameAndDates = Boolean(guestName && (checkIn || checkOut));
  const hasReservationIntent =
    !isCancellationOrDeflection &&
    !(!providesReservationDetail && isDirectNavigationOrAmbiance) &&
    (hasDirectPhrases || hasContextualReservationIntent || hasNameAndDates || hasValidDates);

  if (!hasReservationIntent) {
    return {
      hasReservationIntent: false,
      isComplete: false,
      missingFields: ["guestName", "checkIn", "checkOut"]
    };
  }

  const missingFields: Array<"guestName" | "checkIn" | "checkOut"> = [];
  if (!guestName) missingFields.push("guestName");
  if (!checkIn) missingFields.push("checkIn");
  if (!checkOut) missingFields.push("checkOut");

  // Vague relative dates check: e.g. "next weekend", "next week", "tomorrow"
  if (norm.includes("next weekend") || norm.includes("next week") || norm.includes("tomorrow")) {
    if (!checkIn || !checkOut) {
      return {
        hasReservationIntent: true,
        isComplete: false,
        guestName,
        missingFields: ["checkIn", "checkOut"],
        validationError: "Please provide explicit calendar dates (for example, from October 9th to October 11th)."
      };
    }
  }

  if (checkIn && checkOut) {
    try {
      const nights = calculateNights(checkIn, checkOut);
      return {
        hasReservationIntent: true,
        isComplete: missingFields.length === 0,
        guestName,
        checkIn,
        checkOut,
        nights,
        missingFields
      };
    } catch (err) {
      return {
        hasReservationIntent: true,
        isComplete: false,
        guestName,
        checkIn,
        checkOut,
        missingFields,
        validationError: (err as Error).message
      };
    }
  }

  return {
    hasReservationIntent: true,
    isComplete: false,
    guestName,
    checkIn,
    checkOut,
    missingFields
  };
}
