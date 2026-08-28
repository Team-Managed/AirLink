import { describe, it, expect, beforeEach, vi } from "vitest";
import { FeedbackService } from "../src/services/feedback";

describe("FeedbackService Suite", () => {
  let feedbackService: FeedbackService;

  beforeEach(() => {
    feedbackService = FeedbackService.getInstance();
    feedbackService.setAudioEnabled(true);
    feedbackService.setHapticsEnabled(true);
  });

  it("toggles audio and haptic preferences", () => {
    expect(feedbackService.getIsAudioEnabled()).toBe(true);
    expect(feedbackService.getIsHapticsEnabled()).toBe(true);

    feedbackService.setAudioEnabled(false);
    expect(feedbackService.getIsAudioEnabled()).toBe(false);

    feedbackService.setHapticsEnabled(false);
    expect(feedbackService.getIsHapticsEnabled()).toBe(false);
  });

  it("triggers approval alert without throwing errors", () => {
    expect(() => {
      feedbackService.triggerApprovalAlert();
    }).not.toThrow();
  });

  it("triggers decision feedback for approve and deny", () => {
    expect(() => {
      feedbackService.triggerDecision(true);
      feedbackService.triggerDecision(false);
    }).not.toThrow();
  });

  it("triggers selection, turn complete, and error cues", () => {
    expect(() => {
      feedbackService.triggerSelection("light");
      feedbackService.triggerSelection("heavy");
      feedbackService.triggerTurnComplete();
      feedbackService.triggerError();
    }).not.toThrow();
  });
});
