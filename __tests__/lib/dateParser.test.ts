import { parseReminderDate } from "../../src/lib/dateParser";

describe("parseReminderDate", () => {
  const now = new Date("2026-03-24T10:00:00Z");

  it("parses 'tomorrow' to next day at 9am", () => {
    const result = parseReminderDate("tomorrow", now);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(25);
    expect(result!.getHours()).toBe(9);
  });

  it("parses 'next Wednesday' to the upcoming Wednesday at 9am", () => {
    const result = parseReminderDate("next Wednesday", now);
    expect(result).not.toBeNull();
    expect(result!.getDay()).toBe(3);
    expect(result!.getHours()).toBe(9);
  });

  it("parses 'on Friday' to the upcoming Friday at 9am", () => {
    const result = parseReminderDate("on Friday", now);
    expect(result).not.toBeNull();
    expect(result!.getDay()).toBe(5);
    expect(result!.getHours()).toBe(9);
  });

  it("returns null for ambiguous references like 'soon'", () => {
    const result = parseReminderDate("soon", now);
    expect(result).toBeNull();
  });

  it("returns null for 'later'", () => {
    const result = parseReminderDate("later", now);
    expect(result).toBeNull();
  });

  it("parses 'in 2 hours' relative to now", () => {
    const result = parseReminderDate("in 2 hours", now);
    expect(result).not.toBeNull();
    expect(result!.getHours()).toBe(12);
  });

  it("parses 'today at 3pm'", () => {
    const result = parseReminderDate("today at 3pm", now);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(24);
    expect(result!.getHours()).toBe(15);
  });
});
