import {
  validateNIN,
  validatePhoneNumber,
  normalizePhoneNumber,
  validateKAROTANumber,
  validateCACNumber,
  validateState,
} from "../src/utils/validators";

describe("validators utils", () => {
  it("validates NIN as exactly 11 digits", () => {
    expect(validateNIN("12345678901")).toBe(true);
    expect(validateNIN("1234567890")).toBe(false);
    expect(validateNIN("abcdef12345")).toBe(false);
  });

  it("validates Nigerian phone numbers", () => {
    expect(validatePhoneNumber("08012345678")).toBe(true);
    expect(validatePhoneNumber("+2348012345678")).toBe(true);
    expect(validatePhoneNumber("07001234567")).toBe(true);
    expect(validatePhoneNumber("12345")).toBe(false);
  });

  it("normalizes phone numbers to +234 format", () => {
    expect(normalizePhoneNumber("08012345678")).toBe("+2348012345678");
    expect(normalizePhoneNumber("2348012345678")).toBe("+2348012345678");
    expect(normalizePhoneNumber("+2348012345678")).toBe("+2348012345678");
  });

  it("validates KAROTA number format", () => {
    expect(validateKAROTANumber("KRT-LAG-2024-001")).toBe(true);
    expect(validateKAROTANumber("KRT-LAG-24-001")).toBe(false);
    expect(validateKAROTANumber("INVALID")).toBe(false);
  });

  it("validates CAC number format", () => {
    expect(validateCACNumber("CAC123")).toBe(true);
    expect(validateCACNumber("1234567890")).toBe(true);
    expect(validateCACNumber("TOO-LONG-12345678901")).toBe(false);
    expect(validateCACNumber("short")).toBe(false);
  });

  it("validates Nigerian states", () => {
    expect(validateState("Lagos")).toBe(true);
    expect(validateState("Kano")).toBe(true);
    expect(validateState("Atlantis")).toBe(false);
  });
});
