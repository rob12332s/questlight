import { z } from "zod";
import { DISPLAY_NAME_MESSAGES, displayNameProblem } from "@/domain/profile";
import { EDUCATION_STAGES } from "@/domain/types";

export const displayNameSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const problem = displayNameProblem(value);
    if (problem) ctx.addIssue({ code: "custom", message: DISPLAY_NAME_MESSAGES[problem] });
  });

export const signUpSchema = z.object({
  displayName: displayNameSchema,
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Use 72 characters or fewer."),
  educationStage: z.enum(EDUCATION_STAGES, { message: "Choose your stage." }),
  ageConfirmed: z.literal("on", { message: "You need to be 13 or older to create an account." }),
});

export const logInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const profileSchema = z.object({
  displayName: displayNameSchema,
  educationStage: z.enum(EDUCATION_STAGES, { message: "Choose your stage." }),
  showOnLeaderboards: z.boolean(),
});

export type FieldErrors = Partial<Record<string, string>>;

/** First message per field, keyed by field name — simple to render next to inputs. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}

export interface FormState {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: FieldErrors;
  /** Echo back non-secret values so the form keeps them after a failed submit. */
  values?: Record<string, string>;
}

export const initialFormState: FormState = { status: "idle" };
