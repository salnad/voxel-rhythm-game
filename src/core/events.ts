/** Minimal typed event bus. Handlers run synchronously in emit order. */
export class EventBus<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: Array<(e: Events[K]) => void> } = {};

  on<K extends keyof Events>(type: K, fn: (e: Events[K]) => void): () => void {
    const list = (this.handlers[type] ??= []);
    list.push(fn);
    return () => {
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    };
  }

  emit<K extends keyof Events>(type: K, e: Events[K]): void {
    const list = this.handlers[type];
    if (list) for (const fn of [...list]) fn(e);
  }

  clear(): void {
    this.handlers = {};
  }
}
