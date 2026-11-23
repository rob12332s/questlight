import type { AnswerOption, OptionId } from "@/domain/types";

/**
 * Original sample questions for the public landing page. They are answered entirely
 * in the browser because nothing is scored or saved here — real quizzes are checked
 * on the server and never send the answer before you submit.
 */
export interface SampleQuestion {
  subject: string;
  topic: string;
  text: string;
  options: AnswerOption[];
  correct: OptionId;
  explanation: string;
}

export const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    subject: "Biology",
    topic: "Cell biology",
    text: "Which part of an animal cell is where most aerobic respiration happens?",
    options: [
      { id: "A", text: "Nucleus" },
      { id: "B", text: "Mitochondria" },
      { id: "C", text: "Ribosomes" },
      { id: "D", text: "Cell membrane" },
    ],
    correct: "B",
    explanation:
      "Mitochondria release energy from glucose in aerobic respiration. Ribosomes make proteins, and the nucleus holds genetic material.",
  },
  {
    subject: "Mathematics",
    topic: "Ratio and proportion",
    text: "£45 is shared between Sam and Priya in the ratio 2 : 7. How much does Priya get?",
    options: [
      { id: "A", text: "£10" },
      { id: "B", text: "£31.50" },
      { id: "C", text: "£35" },
      { id: "D", text: "£38" },
    ],
    correct: "C",
    explanation: "There are 2 + 7 = 9 parts, so one part is £45 ÷ 9 = £5. Priya gets 7 parts: 7 × £5 = £35.",
  },
  {
    subject: "Chemistry",
    topic: "Atomic structure",
    text: "An atom has 11 protons and 12 neutrons. What is its mass number?",
    options: [
      { id: "A", text: "11" },
      { id: "B", text: "12" },
      { id: "C", text: "23" },
      { id: "D", text: "1" },
    ],
    correct: "C",
    explanation:
      "Mass number is protons plus neutrons: 11 + 12 = 23. The atomic number is the number of protons alone, which is 11.",
  },
];
