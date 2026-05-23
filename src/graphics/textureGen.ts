import type { Biome } from '../types/interfaces';

const floorCache: Record<string, HTMLCanvasElement> = {};
const wallCache: Record<string, HTMLCanvasElement> = {};

function createStoneFloorTexture(biome: Biome = 'dungeon'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  let bg = '#111827';
  let brickColors = ['#374151', '#111827'];
  let strokeColor = '#0f172a';

  if (biome === 'blood') { bg = '#3f1118'; brickColors = ['#7f1d1d', '#3f1118']; strokeColor = '#29070c'; }
  else if (biome === 'abyss') { bg = '#170c2a'; brickColors = ['#3b2361', '#170c2a']; strokeColor = '#0b051a'; }
  else if (biome === 'moss') { bg = '#112718'; brickColors = ['#236132', '#112718']; strokeColor = '#06160a'; }
  else if (biome === 'hell') { bg = '#2e0906'; brickColors = ['#991b1b', '#450a0a']; strokeColor = '#290606'; }

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;

  const rows = 8;
  const cols = 8;
  const cellW = 256 / cols;
  const cellH = 256 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offsetX = (Math.random() - 0.5) * 4;
      const offsetY = (Math.random() - 0.5) * 4;
      
      const x = c * cellW + offsetX;
      const y = r * cellH + offsetY;
      const w = cellW - 2 - Math.random() * 4;
      const h = cellH - 2 - Math.random() * 4;

      // Gradient tạo độ nổi 3D cho viên đá
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, brickColors[0]);
      grad.addColorStop(1, brickColors[1]);
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.fill();
      ctx.stroke();

      // Thêm vài vết nứt ngẫu nhiên
      if (Math.random() > 0.6) {
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w/2 + (Math.random() - 0.5)*10, y + h/2 + (Math.random() - 0.5)*10);
        ctx.strokeStyle = '#030712';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Thêm một lớp noise (bụi) lên trên
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() > 0.8) {
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
    }
    // Rêu mốc xanh (Moss) xen kẽ rãnh gạch
    if (Math.random() > 0.98) {
      data[i] = 20;   // R
      data[i+1] = 60; // G
      data[i+2] = 20; // B
      data[i+3] = 180; // Alpha
    }
    // Vết máu khô (Dried blood)
    if (Math.random() > 0.995) {
      data[i] = 100;  // R
      data[i+1] = 10; // G
      data[i+2] = 10; // B
      data[i+3] = 200; // Alpha
    }
  }
  ctx.putImageData(imgData, 0, 0);

  return canvas;
}

function createWallTexture(biome: Biome = 'dungeon'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  let bg = '#1c1917';
  let brickColors = ['#292524', '#0c0a09'];
  let mossColor = `rgba(21, 128, 61, ${Math.random() * 0.3})`;

  if (biome === 'blood') { bg = '#2c0a10'; brickColors = ['#4c0a15', '#1a0408']; mossColor = `rgba(153, 27, 27, ${Math.random() * 0.4})`; }
  else if (biome === 'abyss') { bg = '#110526'; brickColors = ['#240a59', '#080214']; mossColor = `rgba(139, 92, 246, ${Math.random() * 0.2})`; }
  else if (biome === 'moss') { bg = '#0f2413'; brickColors = ['#164a21', '#071609']; mossColor = `rgba(34, 197, 94, ${Math.random() * 0.5})`; }
  else if (biome === 'hell') { bg = '#2a0905'; brickColors = ['#5e1208', '#140301']; mossColor = `rgba(239, 68, 68, ${Math.random() * 0.3})`; }

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 128, 128);

  // Lớp gạch ngang sần sùi
  for (let y = 0; y < 128; y += 16) {
    for (let x = 0; x < 128; x += 32) {
      const offset = (y / 16) % 2 === 0 ? 0 : 16;
      
      const grad = ctx.createLinearGradient(x + offset, y, x + offset, y + 16);
      grad.addColorStop(0, brickColors[0]);
      grad.addColorStop(1, brickColors[1]);
      
      ctx.fillStyle = grad;
      ctx.fillRect(x + offset, y, 30, 14);
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + offset, y, 30, 14);
    }
  }

  // Phủ rêu / nấm / dung nham
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = mossColor;
    ctx.beginPath();
    ctx.arc(Math.random() * 128, Math.random() * 128, Math.random() * 10 + 5, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

export function getStoneFloorTexture(biome: Biome = 'dungeon'): HTMLCanvasElement {
  if (!floorCache[biome]) floorCache[biome] = createStoneFloorTexture(biome);
  return floorCache[biome];
}

export function getWallTexture(biome: Biome = 'dungeon'): HTMLCanvasElement {
  if (!wallCache[biome]) wallCache[biome] = createWallTexture(biome);
  return wallCache[biome];
}
