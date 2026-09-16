import "@testing-library/jest-dom/vitest";

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Testing Library only auto-registers cleanup when Vitest globals are enabled.
afterEach(cleanup);

// jsdom implements neither of these, and a component that measures itself or asks
// whether motion is welcome — the toast region does both — throws outright without
// them. Answering "no preference" and "no size" keeps a component's ordinary path
// under test rather than its reduced one.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
