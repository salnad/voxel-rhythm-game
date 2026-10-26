import * as THREE from 'three';

interface Label {
  el: HTMLDivElement;
  world: THREE.Vector3;
  age: number;
}

/** DOM labels anchored to world positions (damage numbers, CRIT, PARRY). */
export class FloatingText {
  private labels: Label[] = [];
  private readonly v = new THREE.Vector3();

  constructor(
    private readonly layer: HTMLElement,
    private readonly camera: THREE.Camera,
    private readonly canvas: HTMLCanvasElement,
  ) {}

  spawn(world: THREE.Vector3, text: string, color: string): void {
    const el = document.createElement('div');
    el.className = 'float-label';
    el.textContent = text;
    el.style.color = color;
    el.style.textShadow = `0 0 8px ${color}`;
    this.layer.appendChild(el);
    this.labels.push({ el, world: world.clone(), age: 0 });
    if (this.labels.length > 24) this.labels.shift()!.el.remove();
  }

  update(dt: number): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.labels = this.labels.filter((l) => {
      l.age += dt;
      if (l.age > 0.8) {
        l.el.remove();
        return false;
      }
      this.v
        .copy(l.world)
        .setY(l.world.y + l.age * 1.2)
        .project(this.camera);
      l.el.style.transform = `translate(${((this.v.x + 1) / 2) * w}px, ${((1 - this.v.y) / 2) * h}px) translate(-50%, -50%)`;
      l.el.style.opacity = String(Math.min(1, (0.8 - l.age) * 3));
      return true;
    });
  }

  clear(): void {
    for (const l of this.labels) l.el.remove();
    this.labels = [];
  }
}
