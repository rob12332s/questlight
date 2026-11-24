/** Exam boards supported in course settings. Specification codes live in the database. */
export type Board = "aqa" | "edexcel" | "ocr";
export const BOARDS: Board[] = ["aqa", "edexcel", "ocr"];
export const BOARD_NAMES: Record<Board, string> = { aqa: "AQA", edexcel: "Pearson Edexcel", ocr: "OCR" };
