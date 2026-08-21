export const GLOBAL_IMAGE_FALLBACK = '/default-property.svg';

const INSTALL_FLAG = '__sakaniGlobalImageFallbackInstalled';

function applyFallback(image: HTMLImageElement): void {
  const currentSource = image.getAttribute('src') || '';
  if (currentSource.endsWith(GLOBAL_IMAGE_FALLBACK)) {
    return;
  }

  image.removeAttribute('srcset');
  image.src = GLOBAL_IMAGE_FALLBACK;
}

/**
 * Ensures every image rendered by the application has a safe fallback.
 * The capture-phase error listener also covers images added by lazy pages,
 * portals, admin modals, and third-party UI components.
 */
export function installGlobalImageFallback(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const appWindow = window as Window & Record<string, unknown>;
  if (appWindow[INSTALL_FLAG]) return;
  appWindow[INSTALL_FLAG] = true;

  document.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement) {
      applyFallback(event.target);
    }
  }, true);

  const ensureImageSource = (node: Node) => {
    if (node instanceof HTMLImageElement) {
      if (!(node.getAttribute('src') || '').trim()) applyFallback(node);
      return;
    }
    if (node instanceof Element) {
      node.querySelectorAll('img').forEach((image) => {
        if (!(image.getAttribute('src') || '').trim()) applyFallback(image);
      });
    }
  };

  document.querySelectorAll('img').forEach(ensureImageSource);
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach(ensureImageSource));
  }).observe(document.documentElement, { childList: true, subtree: true });
}
