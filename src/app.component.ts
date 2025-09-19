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
  palettes = signal(['Random', 'Cosmic Fusion', 'Oceanic Dream', 'Sunset Blaze', 'Enchanted Forest', 'Neon Noir']);
  selectedPalette = signal('Random');

  host = {
    '(window:resize)': 'onResize()'
  };

  constructor() {
    effect(() => {
      // This effect will run whenever any of the control signals change.
      const config = {
        numSlices: this.numSlices(),
        maxShapes: this.maxShapes(),
        shapeSize: this.shapeSize(),
        shapeSpeed: this.shapeSpeed(),
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

  private animate(timestamp: number): void {
    if (!this.ctx) return;
    this.kaleidoscopeService.draw(this.ctx, this.ctx.canvas.width, this.ctx.canvas.height, timestamp);
    requestAnimationFrame((t) => this.animate(t));
  }
}