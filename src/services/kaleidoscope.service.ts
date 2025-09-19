import { Injectable } from '@angular/core';

interface Shape {
  x: number;
  y: number;
  radius: number;
  color: string;
  speedX: number;
  speedY: number;
}

interface KaleidoscopeConfig {
  numSlices?: number;
  maxShapes?: number;
  shapeSize?: number;
  shapeSpeed?: number;
  colorPalette?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KaleidoscopeService {
  private numSlices = 12;
  private maxShapes = 20;
  private shapeSize = 25; // max radius
  private shapeSpeed = 1; // speed multiplier
  private currentColorPalette = 'Random';

  private shapes: Shape[] = [];
  
  private palettes: Record<string, string[]> = {
    'Cosmic Fusion': ['#3d2c8d', '#916bbf', '#c9a7eb', '#f1e8ff', '#ffabe1', '#ff54d6', '#a239ea', '#6a0dad'],
    'Oceanic Dream': ['#003b46', '#07575b', '#66a5ad', '#c4dfe6', '#a1cae2', '#72bcd4', '#55b3d9', '#4281a4'],
    'Sunset Blaze': ['#ff4800', '#ff6b35', '#ff875e', '#ffb59a', '#f9c784', '#e85d04', '#dc2f02', '#6a040f'],
    'Enchanted Forest': ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#d8f3dc', '#1b4332'],
    'Neon Noir': ['#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff0055', '#7f00ff', '#007fff', '#ff5e00'],
  };

  constructor() {
    this.adjustShapesArray();
  }

  public updateConfig(config: KaleidoscopeConfig): void {
    let needsShapeReset = false;
    if (config.numSlices !== undefined) this.numSlices = config.numSlices;

    if (config.colorPalette !== undefined && config.colorPalette !== this.currentColorPalette) {
      this.currentColorPalette = config.colorPalette;
      needsShapeReset = true;
    }
    
    if (config.shapeSize !== undefined && config.shapeSize !== this.shapeSize) {
      this.shapeSize = config.shapeSize;
      needsShapeReset = true;
    }
    if (config.shapeSpeed !== undefined && config.shapeSpeed !== this.shapeSpeed) {
      this.shapeSpeed = config.shapeSpeed;
      needsShapeReset = true;
    }

    if (config.maxShapes !== undefined && config.maxShapes !== this.maxShapes) {
      this.maxShapes = config.maxShapes;
      this.adjustShapesArray();
    } else if (needsShapeReset) {
      // Re-initialize all shapes with new speed/size/color parameters
      this.shapes = [];
      this.adjustShapesArray();
    }
  }

  private adjustShapesArray(): void {
    const diff = this.maxShapes - this.shapes.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        this.shapes.push(this.createRandomShape());
      }
    } else {
      this.shapes.length = this.maxShapes;
    }
  }

  private createRandomShape(): Shape {
    let color: string;
    const palette = this.palettes[this.currentColorPalette];

    if (palette) {
      color = palette[Math.floor(Math.random() * palette.length)];
    } else {
      // Default to 'Random' behavior
      color = `hsl(${Math.random() * 360}, 100%, 70%)`;
    }

    return {
      x: Math.random() * 400 - 200,
      y: Math.random() * 400 - 200,
      radius: Math.random() * (this.shapeSize - 5) + 5,
      color: color,
      speedX: (Math.random() * 2 - 1) * this.shapeSpeed,
      speedY: (Math.random() * 2 - 1) * this.shapeSpeed,
    };
  }

  public draw(ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, width, height);

    const angleIncrement = (Math.PI * 2) / this.numSlices;

    ctx.save();
    ctx.translate(width / 2, height / 2);

    this.updateShapes(time, width, height);

    for (let i = 0; i < this.numSlices; i++) {
      ctx.save();
      ctx.rotate(i * angleIncrement);
      
      this.drawShapes(ctx, time);

      ctx.scale(1, -1);
      this.drawShapes(ctx, time);

      ctx.restore();
    }

    ctx.restore();
  }

  private updateShapes(time: number, width: number, height: number): void {
    this.shapes.forEach(shape => {
      const timeFactor = time * 0.0005;
      shape.x += shape.speedX * Math.cos(timeFactor + shape.radius);
      shape.y += shape.speedY * Math.sin(timeFactor + shape.radius);

      const bounds = Math.min(width, height) * 0.3;
      if (Math.abs(shape.x) > bounds) shape.speedX *= -1;
      if (Math.abs(shape.y) > bounds) shape.speedY *= -1;
      
      // Only shift hue if we're in 'Random' mode
      if (this.currentColorPalette === 'Random') {
        const hue = (parseFloat(shape.color.substring(4)) + 0.1) % 360;
        shape.color = `hsl(${hue}, 100%, 70%)`;
      }
    });
  }

  private drawShapes(ctx: CanvasRenderingContext2D, time: number): void {
    this.shapes.forEach((shape, index) => {
      ctx.beginPath();
      ctx.fillStyle = shape.color;
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2;

      const dynamicRadius = shape.radius * (1 + 0.2 * Math.sin(time * 0.001 + index));

      if (index % 3 === 0) {
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + dynamicRadius * 2, shape.y + dynamicRadius * 2);
        ctx.stroke();
      } else {
        ctx.arc(shape.x, shape.y, dynamicRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.closePath();
    });
  }
}