import * as v from "valibot";

import { isValidDate } from "./date";

const koreanOrEnglishOnly = /^[가-힣a-zA-Z\s]+$/;
const phoneDigits = /^01[0-9]\d{7,8}$/;
const dateFormat = /^\d{8}$/;

export const kycFormSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Please enter your name."),
    v.minLength(2, "Name must be at least 2 characters."),
    v.maxLength(30, "Name must be at most 30 characters."),
    v.regex(koreanOrEnglishOnly, "Use only Korean or English letters."),
  ),
  phone: v.pipe(
    v.string(),
    v.transform((val) => val.replace(/-/g, "")),
    v.nonEmpty("Please enter your phone number."),
    v.regex(phoneDigits, "Enter a valid 10 or 11-digit phone number."),
  ),
  birthdate: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your date of birth."),
    v.regex(dateFormat, "Enter 8 digits in YYYYMMDD format."),
    v.check(isValidDate, "Please enter a valid date."),
  ),
  agreement: v.pipe(
    v.boolean(),
    v.check((val) => val === true),
  ),
});

export type KycFormValues = v.InferOutput<typeof kycFormSchema>;
