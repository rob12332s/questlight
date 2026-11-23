import { HUMANITIES } from "./humanities";
import { MATHS_ENGLISH } from "./maths-english";
import { SCIENCES } from "./sciences";
import type { BankTopic } from "./types";

export const QUESTION_BANK: BankTopic[] = [...MATHS_ENGLISH, ...SCIENCES, ...HUMANITIES];
export type { BankQuestion, BankTopic } from "./types";
