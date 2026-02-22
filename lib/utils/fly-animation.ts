/**
 * Fly-to-icon animation utility.
 * Uses getBoundingClientRect + transform: translate3d for GPU-accelerated,
 * zero-reflow animation.
 */

export interface FlyOptions {
  sourceEl: HTMLElement;
  targetEl: HTMLElement;
  cloneType: 'image' | 'heart';
  imageSrc?: string;
  onComplete?: () => void;
  duration?: number; // ms, default 680
}

export function flyToTarget({
  sourceEl,
  targetEl,
  cloneType,
  imageSrc,
  onComplete,
  duration = 680,
}: FlyOptions): void {
  // Guard: both elements must be in DOM
  if (!sourceEl || !targetEl) return;

  const srcRect = sourceEl.getBoundingClientRect();
  const dstRect = targetEl.getBoundingClientRect();

  // Build the flying element
  const clone = document.createElement('div');
  clone.style.cssText = `
    position: fixed;
    z-index: 99999;
    pointer-events: none;
    border-radius: 50%;
    overflow: hidden;
    will-change: transform, opacity;
    top: ${srcRect.top + srcRect.height / 2}px;
    left: ${srcRect.left + srcRect.width / 2}px;
    width: ${cloneType === 'image' ? '60px' : '28px'};
    height: ${cloneType === 'image' ? '60px' : '28px'};
    margin-top: -${cloneType === 'image' ? 30 : 14}px;
    margin-left: -${cloneType === 'image' ? 30 : 14}px;
    transform: translate3d(0,0,0) scale(1) rotate(0deg);
    transition: none;
  `;

  if (cloneType === 'image' && imageSrc) {
    clone.style.border = '2px solid white';
    clone.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    clone.appendChild(img);
  } else if (cloneType === 'image') {
    // fallback: shopping cart circle
    clone.style.background = '#1f2937';
    clone.style.display = 'flex';
    clone.style.alignItems = 'center';
    clone.style.justifyContent = 'center';
    clone.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    clone.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>`;
  } else {
    // Heart SVG
    clone.style.background = '#ef4444';
    clone.style.display = 'flex';
    clone.style.alignItems = 'center';
    clone.style.justifyContent = 'center';
    clone.style.boxShadow = '0 2px 8px rgba(239,68,68,0.5)';
    clone.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`;
  }

  document.body.appendChild(clone);

  // Calculate the translation needed to reach target center
  const targetCenterX = dstRect.left + dstRect.width / 2;
  const targetCenterY = dstRect.top + dstRect.height / 2;
  const startX = srcRect.left + srcRect.width / 2;
  const startY = srcRect.top + srcRect.height / 2;

  const dx = targetCenterX - startX;
  const dy = targetCenterY - startY;

  // Bezier control point: arc upward
  const cpX = dx * 0.3;
  const cpY = Math.min(dy * 0.2, -80);

  // Run animation using requestAnimationFrame
  let start: number | null = null;

  function ease(t: number): number {
    // Cubic-bezier approximation (ease-in)
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function step(timestamp: number) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const t = ease(progress);

    // Quadratic bezier: P = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
    // P0 = (0,0), P1 = (cpX, cpY), P2 = (dx, dy)
    const currentX = 2 * (1 - t) * t * cpX + t * t * dx;
    const currentY = 2 * (1 - t) * t * cpY + t * t * dy;
    const scale = 1 - t * 0.7;
    const rotate = t * (cloneType === 'image' ? 15 : 0);
    const opacity = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

    clone.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${scale}) rotate(${rotate}deg)`;
    clone.style.opacity = String(opacity);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Cleanup
      clone.remove();
      onComplete?.();
    }
  }

  requestAnimationFrame(step);
}
