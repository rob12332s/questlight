import type { Lesson } from "@/domain/lesson";

/** Exam Answer Coach lessons for GCSE Maths, keyed by library topic slug. */
export const MATHS_LESSONS: Record<string, Lesson> = {
  "linear-equations": {
    style: "calculation",
    summary: "Solve linear equations by doing the same thing to both sides, one step per line, until the unknown is on its own — including equations with brackets and unknowns on both sides.",
    knowledge: [
      "An equation stays balanced if you do the same operation to both sides.",
      "Undo operations in reverse order: deal with + and − before × and ÷.",
      "Expand brackets first, or divide both sides by the number outside the bracket.",
      "With unknowns on both sides, move the smaller x term so the x coefficient stays positive.",
      "Check by substituting your answer back into the original equation.",
    ],
    vocabulary: [
      { term: "Equation", meaning: "A statement that two expressions are equal, which is true for particular values of the unknown." },
      { term: "Coefficient", meaning: "The number multiplying a variable, such as 5 in 5x." },
      { term: "Inverse operation", meaning: "The operation that undoes another: subtraction undoes addition, division undoes multiplication." },
    ],
    recognise: "The question says 'solve' and gives an equation with one unknown and no powers of x, for example 3(x − 4) = 2x + 5.",
    commandWords: [
      { word: "Solve", meaning: "Find the value(s) of the unknown that make the equation true." },
      { word: "Show that", meaning: "Write every step so the given answer clearly follows — the answer alone earns nothing." },
    ],
    method: [
      { title: "Expand any brackets", detail: "Multiply every term inside the bracket by the number outside, watching signs." },
      { title: "Collect the x terms on one side", detail: "Subtract the smaller x term from both sides." },
      { title: "Collect the numbers on the other side", detail: "Add or subtract numbers from both sides." },
      { title: "Divide by the coefficient", detail: "Divide both sides by the number in front of x. Leave the answer as a fraction if it doesn't divide exactly." },
      { title: "Check", detail: "Substitute your value into both sides of the original equation: they should be equal." },
    ],
    mistakes: [
      { tag: "sign_error", text: "Expanding −2(x − 3) as −2x − 6 instead of −2x + 6." },
      { tag: "rearranging_error", text: "Doing an operation to one side only, for example subtracting 5 from the left but not the right." },
      { tag: "no_working", text: "Writing just the answer. Each correct step can earn a method mark." },
    ],
    worked: {
      question: "Solve 3(x − 4) = 2x + 5",
      marks: 3,
      steps: [
        {
          prompt: "What should you do first?",
          choices: [
            { text: "Expand the bracket: 3x − 12 = 2x + 5", correct: true, feedback: "Yes — multiply both terms in the bracket by 3." },
            { text: "Expand the bracket: 3x − 4 = 2x + 5", correct: false, feedback: "The 3 multiplies both terms, so 3 × −4 = −12.", tag: "arithmetic_slip" },
            { text: "Divide both sides by 2", correct: false, feedback: "That doesn't remove anything useful. Start by removing the bracket.", tag: "rearranging_error" },
          ],
          reveal: "3x − 12 = 2x + 5",
        },
        {
          prompt: "Now collect the x terms. What do you get?",
          choices: [
            { text: "Subtract 2x from both sides: x − 12 = 5", correct: true, feedback: "Right — subtracting the smaller x term keeps x positive." },
            { text: "Add 2x to both sides: 5x − 12 = 5", correct: false, feedback: "To remove 2x from the right you subtract it.", tag: "sign_error" },
            { text: "Subtract 2x from the left only: x − 12 = 2x + 5", correct: false, feedback: "Whatever you do to one side you must do to the other.", tag: "rearranging_error" },
          ],
          reveal: "x − 12 = 5",
        },
        {
          prompt: "Finish solving.",
          choices: [
            { text: "Add 12 to both sides: x = 17", correct: true, feedback: "Correct. Check: 3(17 − 4) = 39 and 2(17) + 5 = 39 ✓" },
            { text: "Subtract 12 from both sides: x = −7", correct: false, feedback: "To undo − 12 you add 12.", tag: "sign_error" },
          ],
          reveal: "x = 17",
        },
      ],
      finalAnswer: "x = 17 (check: both sides equal 39).",
    },
    guided: [
      {
        question: "Solve 5x + 7 = 2x − 8",
        marks: 3,
        answer: { type: "numeric", value: -5 },
        hints: ["Subtract 2x from both sides.", "You should have 3x + 7 = −8. Now subtract 7 from both sides.", "3x = −15, so divide by 3."],
        solution: "5x + 7 = 2x − 8 → 3x + 7 = −8 → 3x = −15 → x = −5",
      },
      {
        question: "Solve (x + 3) / 4 = 5",
        marks: 2,
        answer: { type: "numeric", value: 17 },
        hints: ["Multiply both sides by 4 to clear the fraction.", "x + 3 = 20. Now subtract 3."],
        solution: "x + 3 = 20 → x = 17",
      },
    ],
    exam: [
      {
        question: "Solve 4(2x − 1) = 3x + 11",
        marks: 3,
        answer: { type: "numeric", value: 3 },
        markScheme: [
          { point: "Expands the bracket correctly: 8x − 4", marks: 1 },
          { point: "Collects terms correctly: 5x = 15", marks: 1 },
          { point: "x = 3", marks: 1 },
        ],
        modelAnswer: "8x − 4 = 3x + 11 → 5x − 4 = 11 → 5x = 15 → x = 3",
        mistakeTags: ["sign_error", "rearranging_error"],
      },
      {
        question: "Solve 7 − 2x = 3(x + 4)",
        marks: 3,
        answer: { type: "numeric", value: -1 },
        markScheme: [
          { point: "Expands to 3x + 12", marks: 1 },
          { point: "Collects to −5 = 5x or 5x = −5", marks: 1 },
          { point: "x = −1", marks: 1 },
        ],
        modelAnswer: "7 − 2x = 3x + 12 → 7 = 5x + 12 → −5 = 5x → x = −1",
        mistakeTags: ["sign_error", "rearranging_error"],
      },
    ],
  },

  "percentage-change": {
    style: "calculation",
    summary: "Use multipliers to increase or decrease by a percentage in one step, and find the percentage change between two values using change ÷ original × 100.",
    knowledge: [
      "A multiplier is 1 + the percentage as a decimal for an increase, or 1 − it for a decrease.",
      "Increase by 15%: × 1.15. Decrease by 15%: × 0.85.",
      "Percentage change = (new − original) ÷ original × 100.",
      "Always divide by the ORIGINAL value, not the new one.",
    ],
    vocabulary: [
      { term: "Multiplier", meaning: "The decimal you multiply by to apply a percentage change in one step." },
      { term: "Original value", meaning: "The amount before the change happened." },
    ],
    recognise: "Look for words like 'increase by', 'decrease by', 'sale', 'profit', 'loss' or 'percentage change'.",
    commandWords: [
      { word: "Work out", meaning: "Calculate and show your method." },
      { word: "Give your answer to…", meaning: "Round only the final answer to the accuracy stated." },
    ],
    method: [
      { title: "Decide: apply a change, or find a change?", detail: "If you know the percentage, use a multiplier. If you know both values, find the percentage change." },
      { title: "Build the multiplier", detail: "Convert the percentage to a decimal and add it to or subtract it from 1." },
      { title: "Multiply", detail: "Original × multiplier = new value." },
      { title: "For percentage change, divide by the original", detail: "Work out the difference, divide by the original value, then multiply by 100." },
    ],
    mistakes: [
      { tag: "misread_question", text: "Finding 15% of the amount and stopping, when the question asks for the new amount." },
      { tag: "wrong_formula", text: "Dividing the change by the new value instead of the original." },
      { tag: "rounding_too_early", text: "Rounding a multiplier such as 1.035 to 1.04." },
    ],
    worked: {
      question: "A bike costs £240. Its price is reduced by 15%. Work out the sale price.",
      marks: 2,
      steps: [
        {
          prompt: "What is the multiplier for a 15% decrease?",
          choices: [
            { text: "0.85", correct: true, feedback: "Yes: 100% − 15% = 85% = 0.85." },
            { text: "0.15", correct: false, feedback: "0.15 gives you the discount, not the price after the discount.", tag: "misread_question" },
            { text: "1.15", correct: false, feedback: "1.15 is for an increase of 15%.", tag: "wrong_formula" },
          ],
          reveal: "Multiplier = 0.85",
        },
        {
          prompt: "Apply the multiplier.",
          choices: [
            { text: "£240 × 0.85 = £204", correct: true, feedback: "Correct — the sale price is £204." },
            { text: "£240 × 0.85 = £36", correct: false, feedback: "£36 is the discount (15%). Check your multiplication.", tag: "arithmetic_slip" },
            { text: "£240 ÷ 0.85 = £282.35", correct: false, feedback: "Dividing by the multiplier reverses a change — that's for reverse percentages.", tag: "wrong_formula" },
          ],
          reveal: "£240 × 0.85 = £204",
        },
      ],
      finalAnswer: "£204",
    },
    guided: [
      {
        question: "Increase £60 by 35%.",
        marks: 2,
        answer: { type: "numeric", value: 81, unit: "£" },
        hints: ["The multiplier for a 35% increase is 1 + 0.35.", "Work out 60 × 1.35."],
        solution: "60 × 1.35 = £81",
      },
      {
        question: "A plant grows from 40 cm to 46 cm. Work out the percentage increase.",
        marks: 2,
        answer: { type: "numeric", value: 15, unit: "%" },
        hints: ["Find the increase first: 46 − 40.", "Divide the increase by the original height, 40, then multiply by 100."],
        solution: "6 ÷ 40 × 100 = 15%",
      },
    ],
    exam: [
      {
        question: "In January a phone cost £350. In February its price went up by 8%. Work out the price in February.",
        marks: 2,
        answer: { type: "numeric", value: 378, tolerance: 0.001, unit: "£" },
        markScheme: [
          { point: "Uses 1.08 (or finds 8% = £28)", marks: 1 },
          { point: "£378", marks: 1 },
        ],
        modelAnswer: "350 × 1.08 = £378",
        mistakeTags: ["misread_question", "wrong_formula"],
      },
      {
        question: "A car was bought for £12 500 and sold for £9 750. Work out the percentage loss.",
        marks: 3,
        answer: { type: "numeric", value: 22, tolerance: 0.001, unit: "%" },
        markScheme: [
          { point: "Finds the loss: £2 750", marks: 1 },
          { point: "Divides by the original price: 2750 ÷ 12500", marks: 1 },
          { point: "22%", marks: 1 },
        ],
        modelAnswer: "Loss = 12 500 − 9 750 = 2 750. 2 750 ÷ 12 500 × 100 = 22%",
        mistakeTags: ["wrong_formula", "incomplete_method"],
      },
    ],
  },

  pythagoras: {
    style: "calculation",
    summary: "Use a² + b² = c² to find a missing side in a right-angled triangle: add the squares to find the hypotenuse, subtract them to find a shorter side.",
    knowledge: [
      "Pythagoras' theorem only works in right-angled triangles.",
      "The hypotenuse (c) is the longest side, opposite the right angle.",
      "Finding the hypotenuse: square, add, square root.",
      "Finding a shorter side: square, subtract, square root.",
      "Your answer for the hypotenuse must be longer than both other sides.",
    ],
    vocabulary: [
      { term: "Hypotenuse", meaning: "The longest side of a right-angled triangle, opposite the right angle." },
      { term: "Square root", meaning: "The number that multiplied by itself gives the original number." },
    ],
    recognise: "A right-angled triangle with two sides known and the third side asked for, and no angles (other than the right angle) involved.",
    commandWords: [
      { word: "Calculate", meaning: "Work out using a calculator, showing your method." },
      { word: "Give your answer to 1 decimal place", meaning: "Keep full accuracy until the end, then round." },
    ],
    method: [
      { title: "Label the hypotenuse", detail: "Find the side opposite the right angle and label it c." },
      { title: "Choose add or subtract", detail: "If you want c, add the squares. If you know c, subtract the other square from c²." },
      { title: "Square root", detail: "Take the square root and round only at the end." },
      { title: "Sense check", detail: "The hypotenuse must be the longest side." },
    ],
    mistakes: [
      { tag: "wrong_formula", text: "Adding the squares when finding a shorter side." },
      { tag: "incomplete_method", text: "Forgetting to square root at the end." },
      { tag: "rounding_too_early", text: "Rounding the squared values before square rooting." },
    ],
    worked: {
      question: "A right-angled triangle has a hypotenuse of 13 cm and one other side of 5 cm. Find the length of the third side.",
      marks: 3,
      steps: [
        {
          prompt: "Are you finding the hypotenuse or a shorter side?",
          choices: [
            { text: "A shorter side, so subtract", correct: true, feedback: "Yes — the hypotenuse (13 cm) is already known." },
            { text: "The hypotenuse, so add", correct: false, feedback: "13 cm is the hypotenuse already, and it's given.", tag: "misread_question" },
          ],
          reveal: "a² = c² − b²",
        },
        {
          prompt: "Substitute the values.",
          choices: [
            { text: "a² = 13² − 5² = 169 − 25 = 144", correct: true, feedback: "Correct." },
            { text: "a² = 13² + 5² = 194", correct: false, feedback: "Adding gives a side longer than the hypotenuse, which is impossible.", tag: "wrong_formula" },
            { text: "a² = 13 − 5 = 8", correct: false, feedback: "You need to square the sides first.", tag: "wrong_formula" },
          ],
          reveal: "a² = 144",
        },
        {
          prompt: "Find a.",
          choices: [
            { text: "a = √144 = 12 cm", correct: true, feedback: "Correct, and 12 < 13 so it makes sense." },
            { text: "a = 144 cm", correct: false, feedback: "Don't forget the square root.", tag: "incomplete_method" },
            { text: "a = 72 cm", correct: false, feedback: "Square rooting isn't halving.", tag: "arithmetic_slip" },
          ],
          reveal: "a = 12 cm",
        },
      ],
      finalAnswer: "12 cm",
    },
    guided: [
      {
        question: "The two shorter sides of a right-angled triangle are 6 cm and 8 cm. Find the hypotenuse in cm.",
        marks: 3,
        answer: { type: "numeric", value: 10, unit: "cm" },
        hints: ["You are finding the hypotenuse, so add the squares.", "6² + 8² = 36 + 64 = 100.", "Now square root 100."],
        solution: "c² = 36 + 64 = 100, c = 10 cm",
      },
    ],
    exam: [
      {
        question: "A ladder 4.5 m long leans against a vertical wall. The foot of the ladder is 1.2 m from the wall on horizontal ground. How far up the wall does the ladder reach? Give your answer to 1 decimal place.",
        marks: 3,
        answer: { type: "numeric", value: 4.3, tolerance: 0.051, unit: "m" },
        markScheme: [
          { point: "Uses 4.5² − 1.2² (20.25 − 1.44)", marks: 1 },
          { point: "Finds √18.81", marks: 1 },
          { point: "4.3 m", marks: 1 },
        ],
        modelAnswer: "h² = 4.5² − 1.2² = 20.25 − 1.44 = 18.81. h = √18.81 = 4.337… ≈ 4.3 m",
        mistakeTags: ["wrong_formula", "incomplete_method", "rounding_too_early"],
      },
      {
        question: "Point A is at (1, 2) and point B is at (7, 10). Work out the length of AB.",
        marks: 3,
        answer: { type: "numeric", value: 10 },
        markScheme: [
          { point: "Finds the horizontal and vertical distances 6 and 8", marks: 1 },
          { point: "Uses 6² + 8² = 100", marks: 1 },
          { point: "AB = 10", marks: 1 },
        ],
        modelAnswer: "Across 7 − 1 = 6, up 10 − 2 = 8. AB² = 36 + 64 = 100, AB = 10",
        mistakeTags: ["incomplete_method", "arithmetic_slip"],
      },
    ],
  },

  "sharing-in-a-ratio": {
    style: "calculation",
    summary: "Share an amount in a ratio by finding the value of one part, and solve problems where you're told one share or the difference between shares instead of the total.",
    knowledge: [
      "Add the parts of the ratio to find the total number of parts.",
      "Value of one part = total ÷ total number of parts.",
      "If you're given a difference, divide it by the difference in parts.",
      "If you're given one share, divide it by that share's parts.",
      "Check the shares add up to the total.",
    ],
    vocabulary: [
      { term: "Ratio", meaning: "A comparison of the sizes of two or more quantities, written like 3 : 5." },
      { term: "Part", meaning: "One unit of the ratio. In 3 : 5 there are 8 parts in total." },
    ],
    recognise: "Something is 'shared' or 'divided' in a ratio, or the question gives a ratio and one amount.",
    commandWords: [{ word: "How much", meaning: "Give an amount with units — make sure it's the share the question asks for." }],
    method: [
      { title: "Work out what you know", detail: "Is the amount the total, one share or a difference?" },
      { title: "Find one part", detail: "Divide that amount by the matching number of parts." },
      { title: "Multiply up", detail: "Multiply one part by each share's number of parts." },
      { title: "Answer the question asked", detail: "Give the share the question wants and check the shares add up." },
    ],
    mistakes: [
      { tag: "misread_question", text: "Treating a difference or one person's share as if it were the total." },
      { tag: "incomplete_method", text: "Finding one part and stopping before multiplying." },
    ],
    worked: {
      question: "Amy and Ben share £72 in the ratio 3 : 5. How much does Ben get?",
      marks: 2,
      steps: [
        {
          prompt: "How many parts are there in total?",
          choices: [
            { text: "8", correct: true, feedback: "3 + 5 = 8 parts." },
            { text: "15", correct: false, feedback: "Add the parts, don't multiply them.", tag: "arithmetic_slip" },
            { text: "2", correct: false, feedback: "The difference isn't needed here — the total is.", tag: "misread_question" },
          ],
          reveal: "3 + 5 = 8 parts",
        },
        {
          prompt: "What is one part worth?",
          choices: [
            { text: "£72 ÷ 8 = £9", correct: true, feedback: "Correct." },
            { text: "£72 ÷ 5 = £14.40", correct: false, feedback: "Divide by the total number of parts.", tag: "wrong_formula" },
          ],
          reveal: "1 part = £9",
        },
        {
          prompt: "How much does Ben get?",
          choices: [
            { text: "5 × £9 = £45", correct: true, feedback: "Yes. Amy gets £27 and £27 + £45 = £72 ✓" },
            { text: "3 × £9 = £27", correct: false, feedback: "That's Amy's share. Ben has 5 parts.", tag: "misread_question" },
          ],
          reveal: "Ben gets £45",
        },
      ],
      finalAnswer: "£45",
    },
    guided: [
      {
        question: "Sweets are shared between Cal and Dev in the ratio 2 : 7. Dev gets 25 more sweets than Cal. How many sweets does Cal get?",
        marks: 3,
        answer: { type: "numeric", value: 10 },
        hints: ["The difference in parts is 7 − 2 = 5.", "5 parts = 25 sweets, so 1 part = 5 sweets.", "Cal has 2 parts."],
        solution: "1 part = 25 ÷ 5 = 5. Cal gets 2 × 5 = 10 sweets.",
      },
    ],
    exam: [
      {
        question: "Orange paint is made by mixing red and yellow paint in the ratio 2 : 3. Jo has 450 ml of yellow paint and plenty of red. What is the most orange paint she can make, in ml?",
        marks: 3,
        answer: { type: "numeric", value: 750, unit: "ml" },
        markScheme: [
          { point: "3 parts = 450 ml, so 1 part = 150 ml", marks: 1 },
          { point: "Red = 2 × 150 = 300 ml", marks: 1 },
          { point: "750 ml", marks: 1 },
        ],
        modelAnswer: "Yellow is 3 parts, so 1 part = 150 ml. Total = 5 parts = 750 ml.",
        mistakeTags: ["misread_question", "incomplete_method"],
      },
    ],
  },
};
