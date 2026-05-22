import React, { useEffect, useRef, useState } from 'react';
import { useEntityStore } from '../store/entityStore';
import { useMapStore, ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS, GATE_WIDTH } from '../store/mapStore';
import { useGameStore } from '../store/gameStore';
import { triggerPlayerAttack, triggerPlayerSkill } from '../systems/combatSystem';
import { useGameLoop } from '../gameLoop/useGameLoop';
import { drawPlayerChibi } from '../graphics/drawPlayer';
import type { Entity } from '../types/interfaces';

const drawMonster = (ctx: CanvasRenderingContext2D, enemy: Entity, isStunned: boolean, bounce: number) => {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.angle);

  ctx.fillStyle = isStunned ? '#67e8f9' : (enemy.color || '#ef4444');

  if (enemy.templateId === 'melee_goblin') {
    // Goblin: Xanh lá, mập mạp, cầm chùy gỗ
    // Thân
    ctx.beginPath();
    ctx.ellipse(0, bounce, enemy.radius, enemy.radius * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#064e3b';
    ctx.stroke();

    // Mắt nhỏ, dữ tợn
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.3, -enemy.radius * 0.3 + bounce, 2.5, 0, Math.PI * 2);
    ctx.arc(enemy.radius * 0.3, enemy.radius * 0.3 + bounce, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Chùy gỗ (cầm bên phải)
    ctx.fillStyle = '#78350f';
    ctx.save();
    ctx.translate(enemy.radius * 0.6, enemy.radius * 0.6 + bounce);
    const attackPhase = performance.now() - (enemy.lastAttackTime || 0);
    if (attackPhase < 300) {
      ctx.rotate(Math.PI / 4 + Math.sin(attackPhase / 50)); // Vung chùy
    } else {
      ctx.rotate(Math.PI / 4 + Math.sin(performance.now() / 200) * 0.2); // Cầm lỏng lẻo
    }
    ctx.fillRect(-3, -15, 6, 25); // Cán chùy
    ctx.beginPath();
    ctx.arc(0, 10, 6, 0, Math.PI * 2); // Đầu chùy
    ctx.fill();
    ctx.stroke();
    ctx.restore();

  } else if (enemy.templateId === 'ranged_skeleton') {
    // Skeleton: Trắng ngà, hốc mắt đen, cầm cung
    ctx.fillStyle = isStunned ? '#67e8f9' : '#e2e8f0';
    // Thân xương
    ctx.beginPath();
    ctx.arc(0, bounce * 0.5, enemy.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Hốc mắt
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.2, -enemy.radius * 0.3 + bounce * 0.5, 3, 0, Math.PI * 2);
    ctx.arc(enemy.radius * 0.2, enemy.radius * 0.3 + bounce * 0.5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Đốm đỏ trong hốc mắt
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.3, -enemy.radius * 0.3 + bounce * 0.5, 1, 0, Math.PI * 2);
    ctx.arc(enemy.radius * 0.3, enemy.radius * 0.3 + bounce * 0.5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Cung xương
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(enemy.radius + 2, bounce * 0.5, 12, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

  } else if (enemy.templateId === 'suicide_bat') {
    // Bat: Dơi vỗ cánh liên tục, đỏ rực
    const wingFlap = Math.sin(performance.now() / 50); // Vỗ cánh rất nhanh

    // Thân
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Mắt phát sáng
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.3, -enemy.radius * 0.2, 2, 0, Math.PI * 2);
    ctx.arc(enemy.radius * 0.3, enemy.radius * 0.2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Hai cánh
    ctx.fillStyle = isStunned ? '#67e8f9' : '#991b1b';
    ctx.beginPath(); // Cánh trái
    ctx.moveTo(0, -enemy.radius * 0.4);
    ctx.lineTo(-enemy.radius * 1.5, -enemy.radius - wingFlap * 10);
    ctx.lineTo(-enemy.radius * 0.5, -enemy.radius * 0.8 - wingFlap * 5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath(); // Cánh phải
    ctx.moveTo(0, enemy.radius * 0.4);
    ctx.lineTo(-enemy.radius * 1.5, enemy.radius + wingFlap * 10);
    ctx.lineTo(-enemy.radius * 0.5, enemy.radius * 0.8 + wingFlap * 5);
    ctx.closePath();
    ctx.fill();

  } else if (enemy.templateId === 'melee_skeleton') {
    // Melee Skeleton: Xương khô cầm kiếm rỉ
    ctx.fillStyle = isStunned ? '#67e8f9' : '#cbd5e1';
    
    // Thân xương
    ctx.beginPath();
    ctx.arc(0, bounce * 0.5, enemy.radius * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Hốc mắt rỗng
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.2, -enemy.radius * 0.3 + bounce * 0.5, 3.5, 0, Math.PI * 2);
    ctx.arc(enemy.radius * 0.2, enemy.radius * 0.3 + bounce * 0.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Mắt léng đốm xanh lam (khác với đỏ của Ranged)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.3, -enemy.radius * 0.3 + bounce * 0.5, 1.5, 0, Math.PI * 2);
    ctx.arc(enemy.radius * 0.3, enemy.radius * 0.3 + bounce * 0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Kiếm rỉ sét
    ctx.fillStyle = '#78716c';
    ctx.save();
    ctx.translate(enemy.radius * 0.7, enemy.radius * 0.5 + bounce);
    const attackPhase = performance.now() - (enemy.lastAttackTime || 0);
    if (attackPhase < 300) {
      ctx.rotate(Math.PI / 3 + Math.sin(attackPhase / 50)); // Chém kiếm
    } else {
      ctx.rotate(Math.PI / 4 + Math.sin(performance.now() / 200) * 0.1);
    }
    ctx.fillRect(-2, -15, 4, 35); // Lưỡi kiếm
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-5, -5, 10, 4);  // Chuôi kiếm
    ctx.restore();

  } else if (enemy.templateId === 'necromancer') {
    // Tử Linh Sư: Áo choàng đen, mắt tím, trượng đầu lâu
    const floatY = Math.sin(performance.now() / 300) * 4; // Lơ lửng chậm

    // Áo choàng (Thân)
    ctx.fillStyle = isStunned ? '#67e8f9' : '#1e1b4b'; // Đen tím sẫm
    ctx.beginPath();
    ctx.moveTo(enemy.radius, 0 + floatY);
    ctx.lineTo(-enemy.radius, enemy.radius + floatY);
    ctx.lineTo(-enemy.radius, -enemy.radius + floatY);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#312e81';
    ctx.stroke();

    // Mũ trùm đầu (Hood)
    ctx.fillStyle = '#0f172a'; // Đen sì bên trong
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.2, floatY, enemy.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4c1d95';
    ctx.stroke();

    // Hai mắt phát sáng tím rực
    ctx.fillStyle = '#c084fc';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#c084fc';
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.4, -enemy.radius * 0.2 + floatY, 2.5, 0, Math.PI * 2);
    ctx.arc(enemy.radius * 0.4, enemy.radius * 0.2 + floatY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Trượng phép thuật (Staff)
    ctx.fillStyle = '#451a03';
    ctx.save();
    ctx.translate(enemy.radius * 0.5, enemy.radius * 0.8 + floatY);
    // Vung trượng khi niệm chú (mỗi 15s)
    const timeSinceShoot = performance.now() - (enemy.lastAIShootTime || 0);
    if (timeSinceShoot < 1500) { // Đang niệm
      ctx.rotate(Math.PI / 4 + Math.sin(performance.now() / 50) * 0.2); // Rung trượng
    } else {
      ctx.rotate(Math.PI / 4 + Math.sin(performance.now() / 400) * 0.1); // Cầm lỏng lẻo
    }
    
    ctx.fillRect(-2, -30, 4, 40); // Cán trượng

    // Quả cầu năng lượng trên trượng
    ctx.fillStyle = '#a855f7';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#d8b4fe';
    ctx.beginPath();
    ctx.arc(0, -32, 6 + Math.sin(performance.now() / 100) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

  } else if (enemy.templateId === 'spirit_wolf') {
    // Sói Tinh Linh: Sói ma thuật trong suốt màu Cyan
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = enemy.color || '#2dd4bf'; // Mặc định Cyan
    
    // Thân sói (Hình elip nằm ngang)
    ctx.beginPath();
    ctx.ellipse(0, bounce, enemy.radius * 1.2, enemy.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#2dd4bf';

    // Đầu sói (về phía trước)
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.8, -enemy.radius * 0.2 + bounce, enemy.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Mõm sói
    ctx.beginPath();
    ctx.moveTo(enemy.radius * 1.2, -enemy.radius * 0.2 + bounce);
    ctx.lineTo(enemy.radius * 1.6, enemy.radius * 0.1 + bounce);
    ctx.lineTo(enemy.radius * 1.0, enemy.radius * 0.2 + bounce);
    ctx.fill();

    // Tai sói
    ctx.beginPath();
    ctx.moveTo(enemy.radius * 0.5, -enemy.radius * 0.6 + bounce);
    ctx.lineTo(enemy.radius * 0.3, -enemy.radius * 1.0 + bounce);
    ctx.lineTo(enemy.radius * 0.8, -enemy.radius * 0.5 + bounce);
    ctx.fill();

    // Mắt sói (sáng chói)
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(enemy.radius * 1.0, -enemy.radius * 0.2 + bounce, 2, 0, Math.PI * 2);
    ctx.fill();

    // Đuôi sói (về phía sau)
    ctx.fillStyle = enemy.color || '#2dd4bf';
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 1.0, bounce);
    ctx.lineTo(-enemy.radius * 1.6, -enemy.radius * 0.5 + bounce + Math.sin(performance.now() / 150) * 4); // Vẫy đuôi
    ctx.lineTo(-enemy.radius * 0.8, enemy.radius * 0.4 + bounce);
    ctx.fill();
    
    ctx.globalAlpha = 1.0;

  } else if (enemy.templateId === 'grand_slime') {
    // Boss Slime: To lớn, nén dẹt khi di chuyển
    const stretchX = 1.0 + Math.sin(performance.now() / 150) * 0.15;
    const stretchY = 1.0 - Math.sin(performance.now() / 150) * 0.15;
    const isEnraged = enemy.hp < enemy.maxHp * 0.5;

    // Aura Gai góc khi Nổi Điên
    if (isEnraged) {
      ctx.shadowBlur = 20 + Math.abs(Math.sin(performance.now() / 100)) * 10;
      ctx.shadowColor = '#ef4444';
    }

    // Thân Slime
    ctx.beginPath();
    ctx.ellipse(0, bounce, enemy.radius * stretchX, enemy.radius * stretchY, 0, 0, Math.PI * 2);
    ctx.fillStyle = isStunned ? '#67e8f9' : (isEnraged ? 'rgba(220, 38, 38, 0.9)' : 'rgba(6, 182, 212, 0.8)');
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isEnraged ? '#991b1b' : '#0891b2';
    ctx.stroke();

    ctx.shadowBlur = 0; // Reset aura

    // Hạt nhân bên trong (Lõi Slime)
    ctx.fillStyle = isEnraged ? '#f87171' : '#0ea5e9';
    ctx.beginPath();
    ctx.arc(0, bounce, enemy.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    if (isEnraged) {
      // Mắt quỷ dữ tợn (Enraged)
      ctx.fillStyle = '#0f172a'; // Đen rỗng
      ctx.beginPath();
      // Mắt trái
      ctx.moveTo(enemy.radius * 0.3, -enemy.radius * 0.4 + bounce);
      ctx.lineTo(enemy.radius * 0.5, -enemy.radius * 0.2 + bounce);
      ctx.lineTo(enemy.radius * 0.3, -enemy.radius * 0.1 + bounce);
      ctx.fill();
      // Mắt phải
      ctx.beginPath();
      ctx.moveTo(enemy.radius * 0.3, enemy.radius * 0.4 + bounce);
      ctx.lineTo(enemy.radius * 0.5, enemy.radius * 0.2 + bounce);
      ctx.lineTo(enemy.radius * 0.3, enemy.radius * 0.1 + bounce);
      ctx.fill();

      // Đốm sáng đỏ rực trong mắt
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(enemy.radius * 0.4, -enemy.radius * 0.25 + bounce, 2, 0, Math.PI * 2);
      ctx.arc(enemy.radius * 0.4, enemy.radius * 0.25 + bounce, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Mắt to ngốc nghếch (Bình thường)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(enemy.radius * 0.4, -enemy.radius * 0.3 + bounce, 6, 0, Math.PI * 2);
      ctx.arc(enemy.radius * 0.4, enemy.radius * 0.3 + bounce, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(enemy.radius * 0.5, -enemy.radius * 0.3 + bounce, 2, 0, Math.PI * 2);
      ctx.arc(enemy.radius * 0.5, enemy.radius * 0.3 + bounce, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vương miện (Gai góc hơn nếu nổi điên)
    ctx.fillStyle = isEnraged ? '#475569' : '#fbbf24'; // Vương miện hắc ám khi Enraged
    ctx.strokeStyle = isEnraged ? '#1e293b' : '#000';
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 0.2, bounce - enemy.radius * 0.8);
    ctx.lineTo(-enemy.radius * 0.5, bounce - enemy.radius * 1.3);
    ctx.lineTo(0, bounce - enemy.radius * 1.0);
    ctx.lineTo(enemy.radius * 0.5, bounce - enemy.radius * 1.3);
    ctx.lineTo(enemy.radius * 0.2, bounce - enemy.radius * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Răng nanh (Chỉ xuất hiện khi Enraged)
    if (isEnraged) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(enemy.radius * 0.8, -10 + bounce);
      ctx.lineTo(enemy.radius * 1.0, 0 + bounce);
      ctx.lineTo(enemy.radius * 0.8, 10 + bounce);
      ctx.fill();
    }

  } else {
    // Mặc định (Fallback)
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.4, -enemy.radius * 0.3 + bounce, 2, 0, Math.PI * 2);
    ctx.arc(enemy.radius * 0.4, enemy.radius * 0.3 + bounce, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // call once
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gọi custom game loop hook
  useGameLoop();

  // BỎ LẮNG NGHE (subscribe) trực tiếp từ EntityStore để tránh render lại 60 lần/giây!
  // Thay vào đó, hàm render của Canvas sẽ dùng useEntityStore.getState()

  const { rooms, currentRoomId } = useMapStore();
  useGameStore(); // Keep subscription but don't destructure unused

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredInteractive, setHoveredInteractive] = useState<string | null>(null);
  const [isFiring, setIsFiring] = useState(false);

  // Phím nhấn di chuyển
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Cập nhật toạ độ chuột liên tục
  const updateMouseCoordinates = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    window.addEventListener('mousemove', updateMouseCoordinates);
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;
      updatePlayerVelocity();

      const { player, updatePlayer } = useEntityStore.getState();

      // Đổi vũ khí (Q hoặc Space)
      if (e.key === 'q' || e.key === ' ' || key === 'spacebar') {
        e.preventDefault();
        if (player && player.weapons && player.weapons.length > 1) {
          const nextIdx = ((player.activeWeaponIndex || 0) + 1) % player.weapons.length;
          updatePlayer({ activeWeaponIndex: nextIdx });
        }
      }

      // Kích hoạt Skill (E)
      if (key === 'e') {
        triggerPlayerSkill();
      }

      // Kích hoạt Lộn nhào (Shift)
      if (key === 'shift') {
        const now = performance.now();
        if (player && now - (player.lastRollTime || 0) > 1500) {
          let rx = 0; let ry = 0;
          if (keysPressed.current['w'] || keysPressed.current['arrowup']) ry -= 1;
          if (keysPressed.current['s'] || keysPressed.current['arrowdown']) ry += 1;
          if (keysPressed.current['a'] || keysPressed.current['arrowleft']) rx -= 1;
          if (keysPressed.current['d'] || keysPressed.current['arrowright']) rx += 1;

          if (rx === 0 && ry === 0) {
            rx = player.facingDirection || 1;
          } else {
            const len = Math.sqrt(rx * rx + ry * ry);
            rx /= len; ry /= len;
          }

          updatePlayer({
            vx: rx * 4, // Tốc độ lướt
            vy: ry * 4,
            animState: 'roll',
            invincibleUntil: now + 400, // 0.4s i-frames
            lastRollTime: now,
            ...({ isRolling: true } as any)
          });

          setTimeout(() => {
            const currentP = useEntityStore.getState().player;
            if (currentP) {
              useEntityStore.getState().updatePlayer({
                animState: currentP.vx !== 0 || currentP.vy !== 0 ? 'walk' : 'idle',
                ...({ isRolling: false } as any)
              });
            }
          }, 400);
        }
      }

      // Tương tác (F)
      if (key === 'f') {
        handleInteraction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
      updatePlayerVelocity();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) setIsFiring(true);
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) setIsFiring(false);
    };

    window.addEventListener('mousemove', updateMouseCoordinates);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('mousemove', updateMouseCoordinates);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const updatePlayerVelocity = () => {
    const { player, updatePlayer } = useEntityStore.getState();
    if (!player) return;
    let vx = 0;
    let vy = 0;

    if (keysPressed.current['w'] || keysPressed.current['arrowup']) vy -= 1;
    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) vy += 1;
    if (keysPressed.current['a'] || keysPressed.current['arrowleft']) vx -= 1;
    if (keysPressed.current['d'] || keysPressed.current['arrowright']) vx += 1;

    // Chuẩn hoá vector vận tốc khi đi chéo
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    // Nếu đang nhào lộn thì không ghi đè vận tốc do lộn nhào kiểm soát
    const isRolling = player.invincibleUntil && performance.now() < player.invincibleUntil && (player as any).isRolling;
    if (!isRolling) {
      updatePlayer({ vx, vy });
    }
  };

  // --- LOGIC TƯƠNG TÁC (NHẤN PHÍM F) ---
  const handleInteraction = () => {
    const state = useEntityStore.getState();
    const { player, chests, shrines, shopItems, groundWeapons, openChest, purchaseShopItem, useShrine, updatePlayer, removeGroundWeapon } = state;
    if (!player) return;

    // 1. Tương tác Rương
    for (const chest of chests) {
      const dist = Math.sqrt((player.x - chest.x) ** 2 + (player.y - chest.y) ** 2);
      if (dist <= player.radius + chest.radius + 15) {
        if (!chest.opened) {
          openChest(chest.id);

          if (chest.type === 'weapon' && chest.weaponInChest) {
            // Đổi vũ khí đang cầm lấy vũ khí trong rương
            const pWeapons = [...(player.weapons || [])];
            const activeIdx = player.activeWeaponIndex || 0;
            const droppedWeapon = pWeapons[activeIdx];

            pWeapons[activeIdx] = chest.weaponInChest;
            updatePlayer({ weapons: pWeapons });

            // Cập nhật rương chứa vũ khí cũ bị rơi ra
            useEntityStore.setState((s) => ({
              chests: s.chests.map(c => c.id === chest.id ? { ...c, weaponInChest: droppedWeapon } : c)
            }));
          } else {
            // Rương thường -> Rơi ra nhiều vàng và mana
            useGameStore.getState().addGold(15 + Math.floor(Math.random() * 16));
            useGameStore.getState().addScore(200);

            // Hạt lấp lánh tung toé
            const time = performance.now();
            for (let k = 0; k < 12; k++) {
              const angle = Math.random() * Math.PI * 2;
              useEntityStore.getState().addParticle({
                id: `chest_gold_${Date.now()}_${k}`,
                x: chest.x,
                y: chest.y,
                vx: Math.cos(angle) * (1 + Math.random() * 3),
                vy: Math.sin(angle) * (1 + Math.random() * 3),
                radius: 2 + Math.random() * 2,
                color: '#fbbf24',
                alpha: 1.0,
                decay: 0.04,
                createdAt: time,
                lifespan: 400
              });
            }

            // Sinh ngẫu nhiên một vật phẩm (Item)
            const itemTypes = ['golden_apple', 'wind_boots', 'ring_of_power', 'energy_shield'];
            const randomItem = itemTypes[Math.floor(Math.random() * itemTypes.length)] as any;
            
            useEntityStore.getState().addItemPickup({
              id: `item_${Date.now()}`,
              x: chest.x,
              y: chest.y + 20, // Rơi ra phía dưới rương
              radius: 12,
              itemType: randomItem
            });
          }
          return;
        }
      }
    }

    // 1.5. Tương tác Nhặt Vũ Khí Rơi Trên Đất (Ground Weapons)
    for (const gw of groundWeapons) {
      const dist = Math.sqrt((player.x - gw.x) ** 2 + (player.y - gw.y) ** 2);
      if (dist <= player.radius + gw.radius + 15) {
        const pWeapons = [...(player.weapons || [])];
        const activeIdx = player.activeWeaponIndex || 0;

        // Nhặt vũ khí mới, vứt vũ khí cũ ra vị trí đó
        const droppedWeapon = pWeapons[activeIdx];
        pWeapons[activeIdx] = gw.weapon;
        updatePlayer({ weapons: pWeapons });

        removeGroundWeapon(gw.id);
        useEntityStore.getState().addGroundWeapon({
          id: `gw_dropped_${Date.now()}`,
          x: gw.x,
          y: gw.y,
          radius: 15,
          weapon: droppedWeapon
        });
        return;
      }
    }

    // 2. Tương tác Đền Thờ
    for (const shrine of shrines) {
      const dist = Math.sqrt((player.x - shrine.x) ** 2 + (player.y - shrine.y) ** 2);
      if (dist <= player.radius + shrine.radius + 15) {
        if (!shrine.used) {
          if (shrine.type === 'health') {
            // Đền Máu: Hồi 3 máu
            updatePlayer(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 3) }));
          } else if (shrine.type === 'power') {
            // Đền Sức Mạnh: Trừ 2 max HP đổi lại vĩnh viễn +3 ATK cho vũ khí
            if (player.maxHp > 3) {
              const nextMaxHp = player.maxHp - 2;
              const nextHp = Math.min(nextMaxHp, player.hp);
              const boostedWeapons = (player.weapons || []).map(w => ({ ...w, damage: w.damage + 3 }));
              updatePlayer({
                maxHp: nextMaxHp,
                hp: nextHp,
                weapons: boostedWeapons
              });
            }
          }
          useShrine(shrine.id);
          return;
        }
      }
    }

    // 3. Tương tác Cửa Hàng
    for (const item of shopItems) {
      const dist = Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2);
      if (dist <= player.radius + item.radius + 15) {
        if (!item.purchased) {
          const gold = useGameStore.getState().gold;
          if (gold >= item.cost) {
            useGameStore.setState({ gold: gold - item.cost });
            purchaseShopItem(item.id);

            if (item.type === 'hp_potion') {
              updatePlayer(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 4) }));
            } else if (item.type === 'weapon' && item.weaponItem) {
              // Nhận vũ khí mới mua
              const pWeapons = [...(player.weapons || [])];
              const activeIdx = player.activeWeaponIndex || 0;
              pWeapons[activeIdx] = item.weaponItem;
              updatePlayer({ weapons: pWeapons });
            }
          }
          return;
        }
      }
    }
  };

  // --- VÒNG LẶP LIÊN TỤC GỌI BẮN SÚNG TỰ ĐỘNG (AUTO-ATTACK) ---
  useEffect(() => {
    let animId: number;
    const checkContinuousFire = () => {
      const state = useEntityStore.getState();
      const player = state.player;

      if (player && player.hp > 0 && canvasRef.current) {
        // Auto-Aim: Tìm quái vật gần nhất
        let nearestEnemy = null;
        let minDist = Infinity;

        for (const enemy of state.enemies) {
          if (enemy.hp <= 0) continue;
          const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
          if (dist < minDist) {
            minDist = dist;
            nearestEnemy = enemy;
          }
        }

        const activeWeapon = player.weapons?.[player.activeWeaponIndex || 0];
        const attackRange = activeWeapon?.range || 600;

        if (nearestEnemy && minDist <= attackRange) {
          triggerPlayerAttack(nearestEnemy.x, nearestEnemy.y);
        } else {
          // Bỏ yêu cầu isFiring, tự động bắn theo hướng di chuyển hiện tại hoặc hướng chuột
          const rect = canvasRef.current.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          triggerPlayerAttack(player.x + (mousePos.x - centerX), player.y + (mousePos.y - centerY));
        }
      }
      animId = requestAnimationFrame(checkContinuousFire);
    };
    animId = requestAnimationFrame(checkContinuousFire);
    return () => cancelAnimationFrame(animId);
  }, [mousePos, isFiring]); // Phụ thuộc thêm isFiring

  // --- CANVAS DRAWING (HÀM VẼ CHÍNH) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const currentRoom = rooms.find(r => r.id === currentRoomId);

    let lastHoveredId: string | null = null;

    const render = () => {
      const state = useEntityStore.getState();
      const {
        player, enemies, allies, projectiles, particles, damageNumbers,
        chests, shrines, shopItems, goldPickups, healthPickups, itemPickups,
        destructibleBarrels, explosiveBarrels, groundWeapons, spikeTraps, portal, cameraShake, updatePlayer
      } = state;

      // Tính toạ độ camera (theo sát player)
      let cameraX = 0;
      let cameraY = 0;
      if (player && canvas) {
        cameraX = player.x - canvas.width / 2;
        cameraY = player.y - canvas.height / 2;
      }

      ctx.save();
      // Clear toàn bộ màn hình
      ctx.fillStyle = '#020617';
      if (canvas) {
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // --- HIỆU ỨNG RUNG BÀN HÌNH (CAMERA SHAKE) ---
      if (cameraShake > 0) {
        const dx = (Math.random() - 0.5) * cameraShake * 2;
        const dy = (Math.random() - 0.5) * cameraShake * 2;
        ctx.translate(dx, dy);
      }

      // Dịch chuyển hệ trục toạ độ theo Camera
      ctx.translate(-cameraX, -cameraY);

      // --- DETECT HOVER ---
      let foundId: string | null = null;
      if (player) {
        for (const chest of chests) {
          if (!chest.opened && Math.sqrt((player.x - chest.x) ** 2 + (player.y - chest.y) ** 2) <= player.radius + chest.radius + 20) { foundId = `chest_${chest.id}`; break; }
        }
        if (!foundId) {
          for (const shrine of shrines) {
            if (!shrine.used && Math.sqrt((player.x - shrine.x) ** 2 + (player.y - shrine.y) ** 2) <= player.radius + shrine.radius + 20) { foundId = `shrine_${shrine.id}`; break; }
          }
        }
        if (!foundId) {
          for (const item of shopItems) {
            if (!item.purchased && Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2) <= player.radius + item.radius + 20) { foundId = `shop_${item.id}`; break; }
          }
        }
        if (!foundId) {
          for (const gw of groundWeapons) {
            if (Math.sqrt((player.x - gw.x) ** 2 + (player.y - gw.y) ** 2) <= player.radius + gw.radius + 20) { foundId = `gw_${gw.id}`; break; }
          }
        }
      }
      if (foundId !== lastHoveredId) {
        lastHoveredId = foundId;
        setHoveredInteractive(foundId);
      }

      // --- VẼ NỀN GẠCH PHÒNG (FLOOR TILES) ---
      const tileSize = 50;
      for (let x = 0; x < ROOM_WIDTH; x += tileSize) {
        for (let y = 0; y < ROOM_HEIGHT; y += tileSize) {
          // Tạo màu ô gạch ngẫu nhiên nhẹ nhàng làm nổi bật chiều sâu
          const seed = Math.sin(x) * Math.cos(y);
          ctx.fillStyle = seed > 0.3 ? '#0f172a' : seed > -0.3 ? '#1e293b' : '#111827';
          ctx.fillRect(x, y, tileSize, tileSize);

          // Viền mờ gạch
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }

      // --- VẼ BẪY GAI (SPIKE TRAPS) ---
      spikeTraps.forEach(trap => {
        // Nền bẫy hình vuông
        const trapSize = trap.radius * 2;
        const tx = trap.x - trap.radius;
        const ty = trap.y - trap.radius;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(tx, ty, trapSize, trapSize);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, trapSize, trapSize);

        if (trap.active) {
          // Bẫy nhô lên (Vẽ các chóp gai)
          ctx.fillStyle = '#ef4444'; // Đỏ nhạt (máu)
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              ctx.beginPath();
              const sx = tx + 10 + i * 15;
              const sy = ty + 10 + j * 15;
              ctx.moveTo(sx, sy - 5);
              ctx.lineTo(sx - 4, sy + 5);
              ctx.lineTo(sx + 4, sy + 5);
              ctx.fill();
            }
          }
        } else {
          // Bẫy chìm (Vẽ lỗ)
          ctx.fillStyle = '#020617';
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              ctx.beginPath();
              ctx.arc(tx + 10 + i * 15, ty + 10 + j * 15, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      });

      // --- VẼ TƯỜNG PHÒNG (WALLS) ---
      ctx.fillStyle = '#334155'; // Màu xám đá tường viền
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;

      const gateMinX = ROOM_WIDTH / 2 - GATE_WIDTH / 2;
      const gateMinY = ROOM_HEIGHT / 2 - GATE_WIDTH / 2;

      const isLocked = currentRoom?.state === 'combat_lock';

      // 1. Tường phía Bắc (North Wall)
      ctx.fillRect(0, 0, ROOM_WIDTH, WALL_THICKNESS);
      ctx.strokeRect(0, 0, ROOM_WIDTH, WALL_THICKNESS);

      // 2. Tường phía Nam (South Wall)
      ctx.fillRect(0, ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH, WALL_THICKNESS);
      ctx.strokeRect(0, ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH, WALL_THICKNESS);

      // 3. Tường phía Tây (West Wall)
      ctx.fillRect(0, 0, WALL_THICKNESS, ROOM_HEIGHT);
      ctx.strokeRect(0, 0, WALL_THICKNESS, ROOM_HEIGHT);

      // 4. Tường phía Đông (East Wall)
      ctx.fillRect(ROOM_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ROOM_HEIGHT);
      ctx.strokeRect(ROOM_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ROOM_HEIGHT);

      // --- VẼ CỬA PHÒNG (GATES) ---
      const drawGate = (gx: number, gy: number, w: number, h: number, hasGate: boolean, direction: string) => {
        if (!hasGate) {
          // Không có cửa hướng này -> Lấp kín tường xám đậm hơn
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(gx, gy, w, h);
          ctx.strokeStyle = '#0f172a';
          ctx.strokeRect(gx, gy, w, h);
          return;
        }

        if (isLocked) {
          // Phòng bị khóa (Chiến đấu) -> Rào chắn màu đỏ neon giật nấp
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.fillRect(gx, gy, w, h);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.strokeRect(gx, gy, w, h);

          // Vẽ lưới chéo báo hiệu rào
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.lineWidth = 2;
          if (direction === 'north' || direction === 'south') {
            for (let offset = 0; offset < w; offset += 15) {
              ctx.moveTo(gx + offset, gy);
              ctx.lineTo(gx + offset + 10, gy + h);
            }
          } else {
            for (let offset = 0; offset < h; offset += 15) {
              ctx.moveTo(gx, gy + offset);
              ctx.lineTo(gx + w, gy + offset + 10);
            }
          }
          ctx.stroke();
        } else {
          // Cửa mở -> Vẽ hành lang thông sàn
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(gx, gy, w, h);

          // Vẽ vệt sáng dẫn đường màu xanh ngọc nhẹ
          ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
          ctx.fillRect(gx, gy, w, h);
        }
      };

      if (currentRoom) {
        drawGate(gateMinX, 0, GATE_WIDTH, WALL_THICKNESS, currentRoom.gates.north, 'north');
        drawGate(gateMinX, ROOM_HEIGHT - WALL_THICKNESS, GATE_WIDTH, WALL_THICKNESS, currentRoom.gates.south, 'south');
        drawGate(0, gateMinY, WALL_THICKNESS, GATE_WIDTH, currentRoom.gates.west, 'west');
        drawGate(ROOM_WIDTH - WALL_THICKNESS, gateMinY, WALL_THICKNESS, GATE_WIDTH, currentRoom.gates.east, 'east');
      }

      // --- VẼ ĐỀN THỜ (SHRINES) ---
      shrines.forEach(shrine => {
        ctx.beginPath();
        ctx.arc(shrine.x, shrine.y, shrine.radius, 0, Math.PI * 2);
        // Tế đàn chưa dùng phát hào quang nhẹ
        if (!shrine.used) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = shrine.type === 'health' ? '#ef4444' : shrine.type === 'power' ? '#f59e0b' : '#3b82f6';
          ctx.fillStyle = '#475569';
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#1e293b';
        }
        ctx.fill();
        ctx.shadowBlur = 0; // Tắt shadow để ko ảnh hưởng vẽ sau
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Biểu tượng đền thờ vẽ tay
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px Courier New';
        ctx.fillText(shrine.type === 'health' ? '✙' : shrine.type === 'power' ? '⚡' : '⛁', shrine.x, shrine.y);
      });

      // --- VẼ CỬA HÀNG (SHOP ITEMS) ---
      shopItems.forEach(item => {
        if (item.purchased) return;

        // Vẽ bệ đỡ (Pedestal)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Vẽ vật phẩm nổi bên trên bệ
        const bounceOffset = Math.sin(performance.now() / 200) * 4;
        const iy = item.y - 12 + bounceOffset;

        if (item.type === 'hp_potion') {
          // Bình máu đỏ
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(item.x - 6, iy, 12, 14);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(item.x - 3, iy - 3, 6, 3);
        } else if (item.type === 'mp_potion') {
          // Bình năng lượng xanh lam
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(item.x - 6, iy, 12, 14);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(item.x - 3, iy - 3, 6, 3);
        } else if (item.type === 'weapon' && item.weaponItem) {
          // Vũ khí bày bán
          ctx.fillStyle = item.weaponItem.color || '#fff';
          ctx.fillRect(item.x - 8, iy, 16, 6);
        }

        // Vẽ bảng giá phía dưới
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(item.x - 22, item.y + 18, 44, 14);
        ctx.strokeStyle = '#fbbf24';
        ctx.strokeRect(item.x - 22, item.y + 18, 44, 14);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px Courier New';
        ctx.fillText(`${item.cost}G`, item.x, item.y + 25);
      });

      // --- VẼ RƯƠNG KHO BÁU (CHESTS) ---
      chests.forEach(chest => {
        ctx.fillStyle = chest.opened ? '#7c2d12' : '#b45309'; // Đóng nâu tươi, mở nâu sẫm
        ctx.fillRect(chest.x - 18, chest.y - 12, 36, 24);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.strokeRect(chest.x - 18, chest.y - 12, 36, 24);

        if (!chest.opened) {
          // Khóa rương bằng vàng
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(chest.x - 3, chest.y - 2, 6, 6);
        } else {
          // Nắp rương lật lên
          ctx.fillStyle = '#78350f';
          ctx.fillRect(chest.x - 18, chest.y - 20, 36, 8);

          if (chest.type === 'weapon' && chest.weaponInChest) {
            // Vũ khí trồi ra
            ctx.fillStyle = chest.weaponInChest.color || '#fff';
            ctx.fillRect(chest.x - 10, chest.y - 8, 20, 4);
          }
        }
      });

      // --- VẼ THÙNG GỖ / TNT ---
      destructibleBarrels.forEach(b => {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Vân gỗ
        ctx.beginPath();
        ctx.moveTo(b.x - 8, b.y - 10);
        ctx.lineTo(b.x - 8, b.y + 10);
        ctx.moveTo(b.x + 8, b.y - 10);
        ctx.lineTo(b.x + 8, b.y + 10);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      explosiveBarrels.forEach(b => {
        ctx.fillStyle = '#dc2626'; // Đỏ tươi thùng TNT
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Chữ "TNT" màu đen cá tính
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', b.x, b.y);
      });

      // --- VẼ VÀNG & MANA RƠI TRÊN ĐẤT (PICKUPS) ---
      goldPickups.forEach(gold => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(gold.x, gold.y, gold.radius, 0, Math.PI * 2);
        ctx.fill();
        // Hiệu ứng lấp lánh nhẹ
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      healthPickups.forEach(hp => {
        ctx.fillStyle = '#ef4444'; // Đỏ tươi
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, hp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Dấu thập trắng ở giữa quả cầu máu
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hp.x - 4, hp.y);
        ctx.lineTo(hp.x + 4, hp.y);
        ctx.moveTo(hp.x, hp.y - 4);
        ctx.lineTo(hp.x, hp.y + 4);
        ctx.stroke();
      });

      // --- VẼ ITEM BUFF RƠI TỪ RƯƠNG ---
      itemPickups.forEach(item => {
        let color = '#fff';
        let text = '?';
        if (item.itemType === 'golden_apple') { color = '#facc15'; text = 'HP'; }
        else if (item.itemType === 'wind_boots') { color = '#38bdf8'; text = 'SPD'; }
        else if (item.itemType === 'ring_of_power') { color = '#ef4444'; text = 'ATK'; }
        else if (item.itemType === 'energy_shield') { color = '#22d3ee'; text = 'SHD'; }

        // Hiệu ứng nhấp nháy cho vòng sáng
        const pulse = Math.abs(Math.sin(performance.now() / 200)) * 5;
        
        ctx.shadowBlur = 10 + pulse;
        ctx.shadowColor = color;
        
        // Vẽ khung lục giác hoặc tròn
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset shadow

        // Vẽ biểu tượng/text mini
        ctx.fillStyle = color;
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, item.x, item.y + 1);
      });

      // --- VẼ VŨ KHÍ RƠI TRÊN ĐẤT (GROUND WEAPONS) ---
      groundWeapons.forEach(gw => {
        // Ánh sáng aura nhẹ dưới đất
        ctx.shadowBlur = 10;
        ctx.shadowColor = gw.weapon.color || '#fff';
        ctx.fillStyle = gw.weapon.color || '#cbd5e1';

        ctx.save();
        ctx.translate(gw.x, gw.y + Math.sin(performance.now() / 200) * 3); // Trôi nổi nhấp nhô

        if (gw.weapon.type === 'melee') {
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-2, -10, 4, 20); // Kiếm đứng
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-4, 0, 8, 4);
        } else {
          ctx.fillRect(-8, -2, 16, 4); // Súng nằm ngang
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-6, 0, 4, 6);
        }
        ctx.restore();
        ctx.shadowBlur = 0;
      });

      // --- VẼ CỔNG DỊCH CHUYỂN PORTAL CHIẾN THẮNG ---
      if (portal && portal.active) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#d946ef'; // Tím hồng ma thuật

        ctx.fillStyle = '#4a044e';
        ctx.beginPath();
        ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2);
        ctx.fill();

        // Vẽ vòng xoắn ốc chuyển động bên trong
        const rotAngle = (performance.now() / 150) % (Math.PI * 2);
        ctx.translate(portal.x, portal.y);
        ctx.rotate(rotAngle);
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 3;

        ctx.beginPath();
        for (let i = 0; i < 30; i++) {
          const r = (i / 30) * portal.radius;
          const a = (i / 5);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.stroke();
        ctx.restore();
      }

      // --- VẼ KẺ ĐỊCH (ENEMIES & BOSS) ---
      enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const isStunned = enemy.statusEffects.includes('stunned');
        const bounce = (enemy as any).isJumping ? Math.sin(performance.now() / 80) * 15 : 0;

        drawMonster(ctx, enemy, isStunned, bounce);

        // Thanh HP nhỏ trên đầu quái
        if (enemy.hp < enemy.maxHp) {
          const hpW = enemy.radius * 2;
          const hpH = 4;
          const hpx = enemy.x - enemy.radius;
          const hpy = enemy.y - enemy.radius - 10;

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(hpx, hpy, hpW, hpH);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(hpx, hpy, hpW * (enemy.hp / enemy.maxHp), hpH);
        }
      });

      // --- VẼ ĐỒNG MINH (ALLIES) ---
      allies.forEach(ally => {
        const bounce = Math.sin(performance.now() / 150) * 4;
        drawMonster(ctx, ally, false, bounce);
      });

      // --- VẼ PLAYER (NHÂN VẬT CHÍNH - PROCEDURAL CHIBI) ---
      if (player) {
        const isHitFlash = (player as any).hitFlashActive && performance.now() - (player as any).hitFlashStart < 120;
        const isKnightSkill = Boolean(player.classId === 'knight' && player.skillActiveUntil && performance.now() < player.skillActiveUntil);
        const weapons = player.weapons || [];
        const activeIdx = player.activeWeaponIndex || 0;
        const weapon = weapons[activeIdx];

        ctx.save();
        ctx.translate(player.x, player.y);

        if (isKnightSkill) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#fbbf24';
        }

        // Nếu ngắm chuột ở bên trái -> quay trái
        const angle = player.angle || 0;
        let aimFacing = 1;
        if (Math.abs(angle) > Math.PI / 2) aimFacing = -1;
        if (player.animState === 'walk') aimFacing = player.facingDirection || 1; // Ưu tiên hướng di chuyển khi chạy
        if (player.animState === 'attack') aimFacing = Math.abs(angle) > Math.PI / 2 ? -1 : 1; // Khi bắn ép quay theo hướng đạn

        drawPlayerChibi(
          ctx, 
          player, 
          getPlayerColor(player.classId || 'knight'), 
          player.animState || 'idle', 
          aimFacing, 
          performance.now(), 
          player.classId || 'knight',
          weapon,
          isKnightSkill,
          isHitFlash
        );

        ctx.restore();

        // --- VẼ HIỆU ỨNG WHIRLWIND BERSERKER ---
        const isWhirlwind = (player as any).isWhirlwind && player.skillActiveUntil && performance.now() < player.skillActiveUntil;
        if (isWhirlwind) {
          const spinAngle = performance.now() / 50; // Xoay cực nhanh
          ctx.save();
          ctx.translate(player.x, player.y);
          ctx.rotate(spinAngle);
          
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Đỏ trong suốt
          ctx.lineWidth = 15;
          ctx.arc(0, 0, player.radius + 20, 0, Math.PI * 2);
          ctx.stroke();

          // Hai vệt kiếm sắc
          ctx.beginPath();
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 3;
          ctx.arc(0, 0, player.radius + 30, 0, Math.PI);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, player.radius + 15, Math.PI, Math.PI * 2);
          ctx.stroke();
          
          ctx.restore();
        }

        // --- VẼ ĐƯỜNG KIẾM MELEE SWING ARCH (BROADSWORD EFFECT) ---
        const swingActive = (player as any).meleeSwingActive;
        const swingStart = (player as any).meleeSwingStart || 0;
        if (swingActive && performance.now() - swingStart < 200) {
          const pct = (performance.now() - swingStart) / 200;
          const swingAngle = (player as any).meleeSwingAngle || 0;
          const startSweep = swingAngle - Math.PI / 3 + (Math.PI * 2 / 3) * pct;

          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.8 * (1 - pct)})`;
          ctx.lineWidth = 10;
          ctx.arc(player.x, player.y, 80, swingAngle - Math.PI / 3, startSweep);
          ctx.stroke();
          ctx.restore();
        } else if (swingActive && performance.now() - swingStart >= 200) {
          updatePlayer({ ...({ meleeSwingActive: false } as any) });
        }

        // --- VẼ TIA SÉT LAN TRUYỀN CỦA PHÁP SƯ (LIGHTNING CHAIN EFFECT) ---
        const lightningActive = (player as any).lightningChainActive;
        const lightningStart = (player as any).lightningChainStart || 0;
        const nodes: Array<{ x: number, y: number }> = (player as any).lightningChainNodes || [];

        if (lightningActive && performance.now() - lightningStart < 400 && nodes.length > 1) {
          const pct = (performance.now() - lightningStart) / 400;

          ctx.save();
          ctx.strokeStyle = `rgba(103, 232, 249, ${0.9 * (1 - pct)})`;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#67e8f9';

          for (let n = 0; n < nodes.length - 1; n++) {
            const start = nodes[n];
            const end = nodes[n + 1];

            // Vẽ đường sét dích dắc răng cưa
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);

            const segmentCount = 6;
            for (let s = 1; s < segmentCount; s++) {
              const tx = start.x + (end.x - start.x) * (s / segmentCount);
              const ty = start.y + (end.y - start.y) * (s / segmentCount);

              // Lệch ngẫu nhiên tạo đường răng cưa
              const offsetX = (Math.random() - 0.5) * 15;
              const offsetY = (Math.random() - 0.5) * 15;
              ctx.lineTo(tx + offsetX, ty + offsetY);
            }
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          }
          ctx.restore();
        } else if (lightningActive && performance.now() - lightningStart >= 400) {
          updatePlayer({ ...({ lightningChainActive: false } as any) });
        }
      }

      // --- VẼ ĐẠN (PROJECTILES) ---
      projectiles.forEach(proj => {
        if (proj.color === '#8b5cf6') {
          // Vẽ Mũi tên (Dành cho Cung gỗ của Archer)
          const angle = Math.atan2(proj.vy, proj.vx);
          ctx.save();
          ctx.translate(proj.x, proj.y);
          ctx.rotate(angle);

          ctx.fillStyle = '#cbd5e1'; // Thân cung
          ctx.fillRect(-6, -1, 12, 2);

          ctx.fillStyle = '#ef4444'; // Đầu mũi tên
          ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(10, 0); ctx.lineTo(6, 3); ctx.fill();

          ctx.fillStyle = '#fbbf24'; // Đuôi lông chim
          ctx.fillRect(-8, -2, 2, 4);

          ctx.restore();
        } else {
          // Vẽ vệt đuôi đạn (Trail)
          const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
          if (speed > 1) {
            ctx.beginPath();
            ctx.moveTo(proj.x, proj.y);
            ctx.lineTo(proj.x - proj.vx * 3, proj.y - proj.vy * 3); // Đuôi kéo dài gấp 3 lần vận tốc
            ctx.strokeStyle = proj.color;
            ctx.lineWidth = proj.radius * 2;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.4;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }

          ctx.fillStyle = proj.color;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
          ctx.fill();

          // Hào quang đạn phép/boss toả ra
          if (proj.radius >= 6) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius + 3 + Math.sin(performance.now() / 100) * 2, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });

      // --- VẼ HẠT VFX (PARTICLES) ---
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0; // Reset alpha

      // --- VẼ SỐ SÁT THƯƠNG NỔI (DAMAGE NUMBERS) ---
      damageNumbers.forEach(dn => {
        ctx.fillStyle = dn.color;
        ctx.font = dn.isCrit ? 'bold 15px Courier New' : '12px Courier New';
        ctx.textAlign = 'center';
        const displayString = dn.text ? dn.text : (dn.value.toString() + (dn.isCrit ? '!' : ''));
        ctx.fillText(displayString, dn.x, dn.y);
      });

      ctx.restore();
      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [rooms, currentRoomId]);

  const getPlayerColor = (classId: string) => {
    switch (classId) {
      case 'knight': return '#3b82f6'; // Xanh dương kỵ sĩ
      case 'rogue': return '#64748b';  // Xám đá sát thủ
      case 'mage': return '#a855f7';   // Tím pháp sư
      case 'summoner': return '#14b8a6'; // Xanh ngọc (Teal) triệu hồi sư
      case 'paladin': return '#facc15';  // Vàng kim (Gold)
      case 'berserker': return '#9f1239'; // Đỏ thẫm (Crimson)
      case 'ninja': return '#0f172a';    // Tím than / đen
      default: return '#3b82f6';
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="game-canvas-element"
        onMouseMove={(e) => updateMouseCoordinates(e.nativeEvent)}
        onMouseDown={(e) => {
          if (e.button === 0) {
            setIsFiring(true);
            updateMouseCoordinates(e.nativeEvent);
          }
        }}
        onMouseUp={(e) => {
          if (e.button === 0) setIsFiring(false);
        }}
        onMouseLeave={() => setIsFiring(false)}
        onContextMenu={(e) => {
          e.preventDefault();
          triggerPlayerSkill();
        }}
      />

      {/* HIỂN THỊ THÔNG BÁO TƯƠNG TÁC KHI PLAYER ĐỨNG GẦN VẬT THỂ */}
      {hoveredInteractive && (
        <div className="interaction-tooltip">
          <span className="interaction-key">F</span>
          <span className="interaction-text">
            {hoveredInteractive.startsWith('chest') && 'Mở Rương Lấy Đồ'}
            {hoveredInteractive.startsWith('shrine') && 'Kích Hoạt Tế Đàn'}
            {hoveredInteractive.startsWith('shop_hp') && 'Mua Bình Máu (40 Gold)'}
            {hoveredInteractive.startsWith('shop_mp') && 'Mua Bình Mana (20 Gold)'}
            {hoveredInteractive.startsWith('shop_weapon') && 'Mua Vũ Khí Cửa Hàng (70 Gold)'}
            {hoveredInteractive.startsWith('gw_') && 'Nhặt Vũ Khí Mới'}
          </span>
        </div>
      )}
    </>
  );
};
