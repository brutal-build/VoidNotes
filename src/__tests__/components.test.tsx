// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No notes" description="Create one to get started." />);
    expect(screen.getByText("No notes")).toBeDefined();
    expect(screen.getByText("Create one to get started.")).toBeDefined();
  });

  it("renders action button when provided", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Empty"
        description="Nothing here."
        action={{ label: "Create", onClick }}
      />
    );
    const button = screen.getByText("Create");
    expect(button).toBeDefined();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not render action button when not provided", () => {
    render(<EmptyState title="Empty" description="Nothing here." />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders custom icon when provided", () => {
    const icon = <svg data-testid="custom-icon" />;
    render(
      <EmptyState title="Test" description="Desc" icon={icon} />
    );
    expect(screen.getByTestId("custom-icon")).toBeDefined();
  });
});

describe("Toast", () => {
  it("renders message and type class", () => {
    render(
      <Toast id={1} type="error" message="Something failed" onDismiss={vi.fn()} />
    );
    expect(screen.getByText("Something failed")).toBeDefined();
    expect(screen.getByRole("alert")).toBeDefined();
    const toastEl = document.querySelector(".toast-error");
    expect(toastEl).toBeDefined();
  });

  it("calls onDismiss when close button clicked", () => {
    const onDismiss = vi.fn();
    render(
      <Toast id={1} type="info" message="Info message" onDismiss={onDismiss} />
    );
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledWith(1);
  });

  it("auto-dismisses after 4000ms", () => {
    const onDismiss = vi.fn();
    render(
      <Toast id={2} type="success" message="Done" onDismiss={onDismiss} />
    );
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(4000);
    expect(onDismiss).toHaveBeenCalledWith(2);
  });

  it("renders different icons per type", () => {
    const types = ["success", "error", "warning", "info"] as const;
    for (const type of types) {
      const { unmount } = render(
        <Toast id={1} type={type} message="msg" onDismiss={vi.fn()} />
      );
      const el = document.querySelector(`.toast-${type}`);
      expect(el).toBeDefined();
      unmount();
    }
  });
});
