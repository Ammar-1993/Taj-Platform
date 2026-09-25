/**
 * React 19 Legacy Compatibility Shim for White-Web-SDK
 * 
 * white-web-sdk relies on ReactDOM.render and ReactDOM.unmountComponentAtNode,
 * which were deprecated in React 18 and completely removed in React 19.
 * This shim bridges ReactDOM.render to React 19's createRoot and unmountComponentAtNode to root.unmount().
 */
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";

if (typeof window !== "undefined") {
  const rootMap = new WeakMap<Element, ReactDOMClient.Root>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rdom = ReactDOM as any;

  const render = function (
    element: React.ReactNode,
    container: Element | null,
    callback?: () => void
  ) {
    if (!container) return;
    try {
      let root = rootMap.get(container);
      if (!root) {
        root = ReactDOMClient.createRoot(container);
        rootMap.set(container, root);
      }
      root.render(element);
      if (typeof callback === "function") {
        queueMicrotask(callback);
      }
    } catch {
      // Safe fallback
    }
  };

  const unmountComponentAtNode = function (container: Element | null): boolean {
    if (!container) return false;
    try {
      const root = rootMap.get(container);
      if (root) {
        // Remove from map immediately so a subsequent render() on the same
        // container creates a fresh root without waiting for the deferred unmount.
        rootMap.delete(container);

        // Defer the actual unmount to the next task-queue turn.
        // React 19 forbids synchronous root.unmount() calls that happen INSIDE
        // a React render cycle. white-web-sdk triggers this path via:
        //   bindHtmlElement → putState → onStateUpdate → updateState → _P.set
        // Deferring to setTimeout(0) pushes the unmount past the current render
        // flush, satisfying React 19's invariant while preserving SDK behavior.
        setTimeout(() => {
          try { root.unmount(); } catch { /* ignore stale-root cleanup errors */ }
        }, 0);

        return true;
      }
    } catch {
      // Safe fallback
    }
    return false;
  };

  // 1. Direct properties on ReactDOM module
  if (typeof rdom.render !== "function") {
    rdom.render = render;
  }
  if (typeof rdom.unmountComponentAtNode !== "function") {
    rdom.unmountComponentAtNode = unmountComponentAtNode;
  }

  // 2. Default export (if Babel interop unwraps .default)
  if (rdom.default) {
    if (typeof rdom.default.render !== "function") {
      rdom.default.render = render;
    }
    if (typeof rdom.default.unmountComponentAtNode !== "function") {
      rdom.default.unmountComponentAtNode = unmountComponentAtNode;
    }
  }

  // 3. Global window.ReactDOM
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  if (!win.ReactDOM) {
    win.ReactDOM = rdom;
  }
  if (typeof win.ReactDOM.render !== "function") {
    win.ReactDOM.render = render;
  }
  if (typeof win.ReactDOM.unmountComponentAtNode !== "function") {
    win.ReactDOM.unmountComponentAtNode = unmountComponentAtNode;
  }
}
