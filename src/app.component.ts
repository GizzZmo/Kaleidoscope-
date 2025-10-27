import { Component, ChangeDetectionStrategy, viewChild, ElementRef, AfterViewInit, inject, signal, effect, untracked } from '@angular/core';
import { KaleidoscopeService } from './services/kaleidoscope.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  private kaleidoscopeService = inject(KaleidoscopeService);
  
  canvasEl = viewChild.required<ElementRef<HTMLCanvasElement>>('kaleidoscopeCanvas');
  
  private ctx!: CanvasRenderingContext2D;
  showTitle = signal(true);

  // --- UI Controls State ---
  showControls = signal(false);
  numSlices = signal(12);
  maxShapes = signal(20);
  shapeSize = signal(25);
  shapeSpeed = signal(1);
  rotationSpeed = signal(1);
  palettes = signal(['Random', 'Cosmic Fusion', 'Oceanic Dream', 'Sunset Blaze', 'Enchanted Forest', 'Neon Noir', 'Pastel Dreams', 'Cyberpunk Sunset', 'Mystic Forest', 'Retro Arcade']);
  selectedPalette = signal('Random');
  mousePosition = signal({ x: -1000, y: -1000 });

  host = {
    '(window:resize)': 'onResize()',
    '(window:mousemove)': 'onMouseMove($event)'
  };

  constructor() {
    effect(() => {
      // This effect will run whenever any of the control signals change.
      const config = {
        numSlices: this.numSlices(),
        maxShapes: this.maxShapes(),
        shapeSize: this.shapeSize(),
        shapeSpeed: this.shapeSpeed(),
        rotationSpeed: this.rotationSpeed(),
        colorPalette: this.selectedPalette(),
      };
      
      // Pass the new configuration to the service.
      // Use untracked as we don't want this effect to re-run if kaleidoscopeService changes.
      untracked(() => {
        this.kaleidoscopeService.updateConfig(config);
      });
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasEl().nativeElement;
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Could not get 2D context from canvas');
      return;
    }
    this.ctx = context;
    
    this.onResize();
    
    this.animate(0);

    setTimeout(() => {
      this.showTitle.set(false);
    }, 3000);
  }

  onResize(): void {
    if (this.ctx) {
      this.ctx.canvas.width = window.innerWidth;
      this.ctx.canvas.height = window.innerHeight;
    }
  }

  onMouseMove(event: MouseEvent): void {
    this.mousePosition.set({ x: event.clientX, y: event.clientY });
  }

  private animate(timestamp: number): void {
    if (!this.ctx) return;
    this.kaleidoscopeService.draw(this.ctx, this.ctx.canvas.width, this.ctx.canvas.height, timestamp, this.mousePosition());
    requestAnimationFrame((t) => this.animate(t));
  }
}