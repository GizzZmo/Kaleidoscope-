import { Injectable } from '@angular/core';

type ShapeType = 'circle' | 'triangle' | 'square' | 'line' | 'pentagon' | 'hexagon' | 'star' | 'cross';

interface Shape {
  x: number;
  y: number;
  radius: number;
  color: string;
  speedX: number;
  speedY: number;
  opacity: number;
  type: ShapeType;
  angle: number;
  rotationSpeed: number;
  // For color animation
  hue?: number;
  paletteIndex?: number;
  transitionProgress?: number;
  transitionSpeed?: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  baseSpeedX: number;
  baseSpeedY: number;
  opacity: number;
  trail: { x: number, y: number }[];
}

interface KaleidoscopeConfig {
  numSlices?: number;
  maxShapes?: number;
  shapeSize?: number;
  shapeSpeed?: number;
  rotationSpeed?: number;
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
  private rotationSpeed = 1; // rotation speed multiplier
  private currentColorPalette = 'Random';

  private shapes: Shape[] = [];
  private particles: Particle[] = [];
  private lastWidth = 0;
  private lastHeight = 0;
  
  private palettes: Record<string, string[]> = {
    'Cosmic Fusion': ['#3d2c8d', '#916bbf', '#c9a7eb', '#f1e8ff', '#ffabe1', '#ff54d6', '#a239ea', '#6a0dad'],
    'Oceanic Dream': ['#003b46', '#07575b', '#66a5ad', '#c4dfe6', '#a1cae2', '#72bcd4', '#55b3d9', '#4281a4'],
    'Sunset Blaze': ['#ff4800', '#ff6b35', '#ff875e', '#ffb59a', '#f9c784', '#e85d04', '#dc2f02', '#6a040f'],
    'Enchanted Forest': ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#d8f3dc', '#1b4332'],
    'Neon Noir': ['#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff0055', '#7f00ff', '#007fff', '#ff5e00'],
    'Pastel Dreams': ['#AEC6CF', '#FFB347', '#FFD1DC', '#ADD8E6', '#DFFF00', '#C5E1A5'],
    'Cyberpunk Sunset': ['#FF00E0', '#40E0D0', '#FF8C00', '#FFD700', '#8A2BE2'],
    'Mystic Forest': ['#2E8B57', '#6A5ACD', '#8FBC8F', '#DA70D6', '#483D8B'],
    'Retro Arcade': ['#FF6347', '#FFD700', '#00FFFF', '#BA55D3', '#FF4500'],
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

    if (config.rotationSpeed !== undefined) {
      this.rotationSpeed = config.rotationSpeed;
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
    const shapeTypes: ShapeType[] = ['circle', 'triangle', 'square', 'line', 'pentagon', 'hexagon', 'star', 'cross'];
    const randomType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];

    const palette = this.palettes[this.currentColorPalette];
    let shape: Partial<Shape> = {
      x: Math.random() * 400 - 200,
      y: Math.random() * 400 - 200,
      radius: Math.random() * (this.shapeSize - 5) + 5,
      speedX: (Math.random() * 2 - 1) * this.shapeSpeed,
      speedY: (Math.random() * 2 - 1) * this.shapeSpeed,
      opacity: 1,
      type: randomType,
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
    };

    if (palette) {
      const paletteIndex = Math.floor(Math.random() * palette.length);
      const nextIndex = (paletteIndex + 1) % palette.length;
      const transitionProgress = Math.random();

      shape = {
        ...shape,
        paletteIndex: paletteIndex,
        transitionProgress: transitionProgress,
        transitionSpeed: (Math.random() * 0.005) + 0.002,
        color: this.interpolateColor(palette[paletteIndex], palette[nextIndex], transitionProgress)
      };
    } else {
      // 'Random' mode
      const hue = Math.random() * 360;
      shape = {
        ...shape,
        hue: hue,
        color: `hsl(${hue}, 100%, 70%)`
      };
    }
    
    return shape as Shape;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  private hexToHsl(hex: string): { h: number, s: number, l: number } | null {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return null;
    
    let { r, g, b } = rgb;
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s, l: l };
  }

  private hslToHex(h: number, s: number, l: number): string {
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      
      h /= 360;
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  
  private interpolateColor(color1: string, color2: string, factor: number): string {
    const hsl1 = this.hexToHsl(color1);
    const hsl2 = this.hexToHsl(color2);

    if (!hsl1 || !hsl2) {
      return color1; // fallback
    }

    let h1 = hsl1.h;
    let h2 = hsl2.h;
    
    // Shortest path for hue interpolation
    const diff = h2 - h1;
    if (Math.abs(diff) > 180) {
      if (diff > 0) {
        h1 += 360;
      } else {
        h2 += 360;
      }
    }
    
    let h = (h1 + factor * (h2 - h1));
    h = h % 360;
    if (h < 0) {
        h += 360;
    }

    const s = hsl1.s + factor * (hsl2.s - hsl1.s);
    const l = hsl1.l + factor * (hsl2.l - hsl1.l);

    return this.hslToHex(h, s, l);
  }

  private initParticles(width: number, height: number): void {
    this.particles = [];
    const numParticles = 100;
    for (let i = 0; i < numParticles; i++) {
        const speedX = (Math.random() - 0.5) * 0.6;
        const speedY = (Math.random() - 0.5) * 0.6;
        this.particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.5,
            speedX: speedX,
            speedY: speedY,
            baseSpeedX: speedX,
            baseSpeedY: speedY,
            opacity: Math.random() * 0.5 + 0.2,
            trail: []
        });
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, mousePos?: { x: number, y: number }): void {
    // Fading trail effect for the whole canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    const interactionRadius = 150;
    const repulsionStrength = 0.5;

    ctx.save();
    ctx.filter = 'blur(2px)';

    // Update and draw particles
    this.particles.forEach(p => {
        if (mousePos) {
          const dx = p.x - mousePos.x;
          const dy = p.y - mousePos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < interactionRadius) {
            const force = (interactionRadius - distance) / interactionRadius;
            p.speedX += (dx / distance) * force * repulsionStrength;
            p.speedY += (dy / distance) * force * repulsionStrength;
          }
        }

        // Ease back to base speed
        p.speedX += (p.baseSpeedX - p.speedX) * 0.05;
        p.speedY += (p.baseSpeedY - p.speedY) * 0.05;

        p.trail.push({ x: p.x, y: p.y });
        const maxTrailLength = 30;
        if (p.trail.length > maxTrailLength) {
            p.trail.shift();
        }

        p.x += p.speedX;
        p.y += p.speedY;

        let wrapped = false;
        if (p.x < 0) { p.x = width; wrapped = true; }
        if (p.x > width) { p.x = 0; wrapped = true; }
        if (p.y < 0) { p.y = height; wrapped = true; }
        if (p.y > height) { p.y = 0; wrapped = true; }

        if (wrapped) {
            p.trail = [];
        }

        // Draw trail
        if (p.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++) {
                ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }

            const first = p.trail[0];
            const last = p.trail[p.trail.length - 1];

            if (first && last) {
                const gradient = ctx.createLinearGradient(last.x, last.y, first.x, first.y);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity * 0.7})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = p.radius;
                ctx.stroke();
            }
        }

        // Draw particle head
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
  }

  public draw(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, mousePos?: { x: number, y: number }): void {
    if (this.lastWidth !== width || this.lastHeight !== height) {
      this.initParticles(width, height);
      this.lastWidth = width;
      this.lastHeight = height;
    }
    
    this.drawBackground(ctx, width, height, mousePos);
    
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
    const palette = this.palettes[this.currentColorPalette];
    
    this.shapes.forEach((shape, index) => {
      // Update position
      const timeFactor = time * 0.0005;
      shape.x += shape.speedX * Math.cos(timeFactor + shape.radius);
      shape.y += shape.speedY * Math.sin(timeFactor + shape.radius);

      const bounds = Math.min(width, height) * 0.3;
      if (Math.abs(shape.x) > bounds) shape.speedX *= -1;
      if (Math.abs(shape.y) > bounds) shape.speedY *= -1;

      // Update angle for rotation
      shape.angle += shape.rotationSpeed * this.rotationSpeed;

      // Update opacity for pulsating effect
      const baseOpacity = 0.7;
      const amplitude = 0.3;
      const frequency = 0.002;
      shape.opacity = baseOpacity + amplitude * Math.sin(frequency * time + index);
      
      // Update color
      if (palette && shape.paletteIndex !== undefined && shape.transitionProgress !== undefined && shape.transitionSpeed !== undefined) {
        // Predefined palette transition
        shape.transitionProgress += shape.transitionSpeed;
        if (shape.transitionProgress >= 1.0) {
          shape.transitionProgress = 0;
          shape.paletteIndex = (shape.paletteIndex + 1) % palette.length;
        }
        const nextIndex = (shape.paletteIndex + 1) % palette.length;
        shape.color = this.interpolateColor(palette[shape.paletteIndex], palette[nextIndex], shape.transitionProgress);
      } else if (shape.hue !== undefined) {
        // 'Random' mode hue shift
        shape.hue = (shape.hue + 0.2) % 360;
        shape.color = `hsl(${shape.hue}, 100%, 70%)`;
      }
    });
  }

  private applyOpacityToColor(color: string, opacity: number): string {
    if (color.startsWith('hsl')) {
      return color.replace('hsl', 'hsla').replace(')', `, ${opacity})`);
    } else if (color.startsWith('#')) {
      const rgb = this.hexToRgb(color);
      if (rgb) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      }
    }
    return color; // Fallback
  }

  private drawShapes(ctx: CanvasRenderingContext2D, time: number): void {
    const shapesToDraw = [...this.shapes];
    
    // Sort shapes by radius for depth effect (smaller drawn first)
    shapesToDraw.sort((a, b) => a.radius - b.radius);

    shapesToDraw.forEach((shape, index) => {
      const colorWithOpacity = this.applyOpacityToColor(shape.color, shape.opacity);

      ctx.fillStyle = colorWithOpacity;
      ctx.strokeStyle = colorWithOpacity;
      ctx.lineWidth = 2;

      const dynamicRadius = shape.radius * (1 + 0.2 * Math.sin(time * 0.001 + index));

      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.angle);

      ctx.beginPath();
      switch (shape.type) {
        case 'circle':
          ctx.arc(0, 0, dynamicRadius, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'square':
          ctx.fillRect(-dynamicRadius, -dynamicRadius, dynamicRadius * 2, dynamicRadius * 2);
          break;
        case 'triangle':
          this.drawPolygon(ctx, 3, dynamicRadius);
          ctx.fill();
          break;
        case 'pentagon':
          this.drawPolygon(ctx, 5, dynamicRadius);
          ctx.fill();
          break;
        case 'hexagon':
          this.drawPolygon(ctx, 6, dynamicRadius);
          ctx.fill();
          break;
        case 'star':
          this.drawStar(ctx, 5, dynamicRadius);
          ctx.fill();
          break;
        case 'cross':
          this.drawCross(ctx, dynamicRadius);
          ctx.fill();
          break;
        case 'line':
          ctx.moveTo(-dynamicRadius, 0);
          ctx.lineTo(dynamicRadius, 0);
          ctx.stroke();
          break;
      }
      ctx.restore();
    });
  }

  private drawPolygon(ctx: CanvasRenderingContext2D, sides: number, radius: number): void {
    const angle = (Math.PI * 2) / sides;
    ctx.moveTo(radius, 0);
    for (let i = 1; i < sides; i++) {
        ctx.lineTo(radius * Math.cos(i * angle), radius * Math.sin(i * angle));
    }
    ctx.closePath();
  }

  private drawStar(ctx: CanvasRenderingContext2D, points: number, outerRadius: number): void {
    const innerRadius = outerRadius / 2;
    const angle = Math.PI / points;
    
    ctx.moveTo(0, -outerRadius);
    for (let i = 0; i < 2 * points; i++) {
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        const currentAngle = i * angle;
        ctx.lineTo(r * Math.sin(currentAngle), -r * Math.cos(currentAngle));
    }
    ctx.closePath();
  }

  private drawCross(ctx: CanvasRenderingContext2D, radius: number): void {
    const armWidth = radius / 2.5;
    ctx.moveTo(-armWidth, -radius);
    ctx.lineTo(armWidth, -radius);
    ctx.lineTo(armWidth, -armWidth);
    ctx.lineTo(radius, -armWidth);
    ctx.lineTo(radius, armWidth);
    ctx.lineTo(armWidth, armWidth);
    ctx.lineTo(armWidth, radius);
    ctx.lineTo(-armWidth, radius);
    ctx.lineTo(-armWidth, armWidth);
    ctx.lineTo(-radius, armWidth);
    ctx.lineTo(-radius, -armWidth);
    ctx.lineTo(-armWidth, -armWidth);
    ctx.closePath();
  }
}
