import { HUMANITIES } from "./humanities";
import { MATHS_ENGLISH } from "./maths-english";
import { MORE_HUMANITIES } from "./more-humanities";
import { MORE_MATHS_ENGLISH } from "./more-maths-english";
import { MORE_SCIENCES } from "./more-sciences";
import { SCIENCES } from "./sciences";
import type { BankTopic } from "./types";

// Order matters only for sort order on the Learn page; new topics follow the originals.
export const QUESTION_BANK: BankTopic[] = [
  ...MATHS_ENGLISH,
  ...SCIENCES,
  ...HUMANITIES,
  ...MORE_MATHS_ENGLISH,
  ...MORE_SCIENCES,
  ...MORE_HUMANITIES,
];
export type { BankQuestion, BankTopic } from "./types";
