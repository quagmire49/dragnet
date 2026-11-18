// 64x64 soft-sphere matcap for additive sprite particle rendering

let cachedMatcapUri = '';

export function getSoftSphereMatcapUri(): string {
  if (cachedMatcapUri) return cachedMatcapUri;
  
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);
      
      // Soft radial glow with lavender / white core
      const grad = ctx.createRadialGradient(28, 26, 1, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(235, 220, 255, 0.95)');
      grad.addColorStop(0.55, 'rgba(170, 136, 255, 0.7)');
      grad.addColorStop(0.85, 'rgba(100, 70, 180, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 31, 0, Math.PI * 2);
      ctx.fill();
      
      cachedMatcapUri = canvas.toDataURL('image/png');
      return cachedMatcapUri;
    }
  }

  // Fallback 1x1 transparent png if SSR
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
}
