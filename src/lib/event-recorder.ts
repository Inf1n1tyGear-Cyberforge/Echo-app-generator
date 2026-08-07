import { RecorderEvent } from '../types';

/**
 * Event recorder that captures interactions from an iframe or the recorder UI.
 * Supports both live URL recording and demo mode.
 */
export class EventRecorder {
  private events: RecorderEvent[] = [];
  private isRecording = false;
  private startTime = 0;
  private context = {
    currentUrl: '',
    currentTitle: '',
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
  // private _iframeWindow: Window | null = null;

  start(targetUrl: string): void {
    this.events = [];
    this.isRecording = true;
    this.startTime = Date.now();
    this.context = {
      currentUrl: targetUrl,
      currentTitle: '',
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
    // Reset iframe window reference
  }

  stop(): RecorderEvent[] {
    this.isRecording = false;
    return [...this.events];
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  getEvents(): RecorderEvent[] {
    return [...this.events];
  }

  getEventCount(): number {
    return this.events.length;
  }

  getDuration(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  setIframeWindow(_win: Window | null): void {
    // Store iframe reference for cross-origin recording
  }

  updateContext(url: string, title: string): void {
    this.context.currentUrl = url;
    this.context.currentTitle = title;
  }

  captureClick(target: string, selector?: string): void {
    if (!this.isRecording) return;
    this.events.push({
      type: 'click',
      target,
      value: null,
      timestamp: Date.now(),
      selector,
      context: { ...this.context },
    });
  }

  captureInput(target: string, value: string, selector?: string): void {
    if (!this.isRecording) return;
    this.events.push({
      type: 'input',
      target,
      value,
      timestamp: Date.now(),
      selector,
      context: { ...this.context },
    });
  }

  captureNavigation(url: string, title: string): void {
    if (!this.isRecording) return;
    this.events.push({
      type: 'navigation',
      target: url,
      value: title,
      timestamp: Date.now(),
      context: { ...this.context },
    });
    this.context.currentUrl = url;
    this.context.currentTitle = title;
  }

  captureSubmit(target: string, value: string, selector?: string): void {
    if (!this.isRecording) return;
    this.events.push({
      type: 'submit',
      target,
      value,
      timestamp: Date.now(),
      selector,
      context: { ...this.context },
    });
  }

  captureScreenshot(dataUrl: string): void {
    if (!this.isRecording) return;
    this.events.push({
      type: 'screenshot',
      target: 'viewport-capture',
      value: null,
      timestamp: Date.now(),
      screenshot: dataUrl,
      context: { ...this.context },
    });
  }

  /**
   * Inject click/input listeners into the iframe document.
   * Only works for same-origin iframes.
   */
  injectIframeListeners(iframeDoc: Document): void {
    if (!this.isRecording) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const text = target.textContent?.trim().slice(0, 50) || '';
      const id = target.id ? `#${target.id}` : '';
      const classes = Array.from(target.classList).slice(0, 3).join('.');
      const selector = `${tagName}${id}${classes ? '.' + classes : ''}`;
      const label = text || selector || tagName;
      this.captureClick(label.slice(0, 100), selector);
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target) return;
      const name = target.name || target.id || target.tagName.toLowerCase();
      const value = (target as HTMLInputElement).value?.slice(0, 100) || '';
      const selector = `${target.tagName.toLowerCase()}#${target.id || ''}`;
      this.captureInput(name, value, selector);
    };

    const handleSubmit = (e: Event) => {
      const target = e.target as HTMLElement;
      const form = target.closest('form');
      const formId = form?.id || form?.name || 'unknown-form';
      this.captureSubmit(`form-${formId}`, formId);
    };

    iframeDoc.addEventListener('click', handleClick, true);
    iframeDoc.addEventListener('input', handleInput, true);
    iframeDoc.addEventListener('submit', handleSubmit, true);

    // Track page visibility and URL changes
    let lastUrl = iframeDoc.URL;
    const urlCheckInterval = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(urlCheckInterval);
        return;
      }
      try {
        if (iframeDoc.URL !== lastUrl) {
          lastUrl = iframeDoc.URL;
          this.captureNavigation(lastUrl, iframeDoc.title);
        }
      } catch {
        clearInterval(urlCheckInterval);
      }
    }, 1000);
  }
}

// Singleton instance
export const eventRecorder = new EventRecorder();
