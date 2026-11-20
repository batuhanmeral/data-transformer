// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { PipelineClientContext } from "@/app/pipeline-provider";
import { useIoStore } from "@/stores/io";
import { useUiStore } from "@/stores/ui";
import type { PipelineClient } from "@/worker/client";
import { useBake } from "./use-bake";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  useIoStore.setState(useIoStore.getInitialState());
  useUiStore.setState(useUiStore.getInitialState());
});

function setup() {
  useUiStore.setState({ autoBake: false });
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  let busy = false;
  const run = vi.fn(() => {
    busy = true;
    return 1;
  });
  const cancel = vi.fn(() => { busy = false; });
  const client: PipelineClient = { run, cancel, isBusy: () => busy, getStep: vi.fn(), dispose: vi.fn() };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PipelineClientContext value={() => client}>{children}</PipelineClientContext>
  );
  const { result } = renderHook(() => useBake(), { wrapper });
  return { result, run, cancel };
}

it("queues a new bake while the worker has been busy for less than 150 ms", () => {
  const { result, run, cancel } = setup();
  act(() => {
    result.current.bake();
    vi.advanceTimersByTime(50);
    result.current.bake();
  });
  expect(run).toHaveBeenCalledTimes(2);
  expect(cancel).not.toHaveBeenCalled();
  expect(result.current.canCancel).toBe(false);
});

it("cancels a worker busy for over 150 ms before starting a new bake", () => {
  const { result, run, cancel } = setup();
  act(() => result.current.bake());
  act(() => vi.advanceTimersByTime(151));
  expect(result.current.canCancel).toBe(true);
  act(() => result.current.bake());
  expect(cancel).toHaveBeenCalledOnce();
  const stopped = cancel.mock.invocationCallOrder[0];
  const restarted = run.mock.invocationCallOrder[1];
  expect(stopped).toBeLessThan(restarted ?? 0);
});
