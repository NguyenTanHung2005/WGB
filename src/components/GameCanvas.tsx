import React, { useEffect, useRef, useState } from 'react';
import { useEntityStore } from '../store/entityStore';
import { useMapStore, ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS, GATE_WIDTH } from '../store/mapStore';
import { useGameStore } from '../store/gameStore';
import { triggerPlayerAttack, triggerPlayerSkill } from '../systems/combatSystem';
import { useGameLoop } from '../gameLoop/useGameLoop';
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

  } else if (enemy.templateId === 'grand_slime') {
    // Boss Slime: To lớn, nén dẹt khi di chuyển
    const stretchX = 1.0 + Math.sin(performance.now() / 150) * 0.15;
    const stretchY = 1.0 - Math.sin(performance.now() / 150) * 0.15;

    // Thân Slime nhầy nhụa
    ctx.beginPath();
    ctx.ellipse(0, bounce, enemy.radius * stretchX, enemy.radius * stretchY, 0, 0, Math.PI * 2);
    ctx.fillStyle = isStunned ? '#67e8f9' : 'rgba(6, 182, 212, 0.8)'; // Xuyên thấu nhẹ
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0891b2';
    ctx.stroke();

    // Hạt nhân bên trong (Lõi Slime)
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(0, bounce, enemy.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Mắt to ngốc nghếch
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

    // Vương miện Vua
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 0.2, bounce - enemy.radius * 0.8);
    ctx.lineTo(-enemy.radius * 0.4, bounce - enemy.radius * 1.2);
    ctx.lineTo(0, bounce - enemy.radius * 1.0);
    ctx.lineTo(enemy.radius * 0.4, bounce - enemy.radius * 1.2);
    ctx.lineTo(enemy.radius * 0.2, bounce - enemy.radius * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

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
            updatePlayer({ hp: Math.min(player.maxHp, player.hp + 3) });
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
              updatePlayer({ hp: Math.min(player.maxHp, player.hp + 4) });
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

        // Nếu có quái trong tầm đánh -> bắn/chém về phía quái tự động
        if (nearestEnemy && minDist <= attackRange) {
          triggerPlayerAttack(nearestEnemy.x, nearestEnemy.y);
        } else if (isFiring) {
          // Nếu KHÔNG CÓ QUÁI, người chơi PHẢI bấm giữ chuột trái (isFiring) thì mới bắn về hướng chuột
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
        player, enemies, projectiles, particles, damageNumbers,
        chests, shrines, shopItems, goldPickups, healthPickups,
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
        ctx.fillStyle = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#f87171';
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

      // --- VẼ PLAYER (NHÂN VẬT CHÍNH - PROCEDURAL CHIBI) ---
      if (player) {
        const isHitFlash = (player as any).hitFlashActive && performance.now() - (player as any).hitFlashStart < 120;
        const isKnightSkill = player.classId === 'knight' && player.skillActiveUntil && performance.now() < player.skillActiveUntil;
        const weapons = player.weapons || [];
        const activeIdx = player.activeWeaponIndex || 0;
        const weapon = weapons[activeIdx];

        ctx.save();
        ctx.translate(player.x, player.y);

        if (isKnightSkill) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#fbbf24';
        }

        // HÀM VẼ CHIBI
        const drawPixelChibi = (color: string, state: string, facing: number, phase: number, classId: string) => {
          ctx.save();
          ctx.scale(facing, 1);

          let headY = -8;
          let bodyY = 0;
          let armRot = 0;
          let legLRot = 0;
          let legRRot = 0;

          if (classId === 'mage') {
            // Bay lơ lửng
            headY += Math.sin(phase * 0.003) * 2;
            bodyY += Math.sin(phase * 0.003) * 2;
            if (state === 'walk') {
              armRot = Math.sin(phase * 0.01) * 0.2;
            }
          } else if (classId === 'rogue' && state === 'walk') {
            // Ninja run
            headY += Math.sin(phase * 0.03) * 1.5;
            legLRot = Math.sin(phase * 0.03) * 0.8;
            legRRot = -Math.sin(phase * 0.03) * 0.8;
            armRot = Math.PI / 4; // Tay quạt ra sau
          } else if (state === 'idle') {
            headY += Math.sin(phase * 0.005) * 1.5;
            bodyY += Math.sin(phase * 0.005) * 0.5;
          } else if (state === 'walk') {
            // Normal / Knight / Archer walk
            const speedMult = classId === 'knight' ? 0.015 : 0.02;
            const bounce = classId === 'knight' ? 2.5 : 2;
            headY += Math.sin(phase * speedMult) * bounce;
            legLRot = Math.sin(phase * speedMult) * 0.6;
            legRRot = -Math.sin(phase * speedMult) * 0.6;
            armRot = Math.sin(phase * speedMult) * 0.4;
          } else if (state === 'roll') {
            ctx.rotate(phase * 0.04 * facing);
            headY = 0;
            legLRot = 0.5; legRRot = -0.5;
          }

          if (state === 'attack') {
            const atkProgress = Math.min(1.0, (performance.now() - (player.lastAttackTime || 0)) / 200);
            if (classId === 'mage') {
              armRot = -Math.PI / 2 + Math.sin(atkProgress * Math.PI) * 0.5; // Giơ trượng lên cao
            } else if (classId === 'archer') {
              armRot = -Math.PI / 4; // Cầm cung giương ra trước
            } else if (weapon && weapon.type === 'melee') {
              armRot = -Math.PI / 2 + atkProgress * Math.PI; // Chém từ trên xuống
            } else {
              armRot = -0.2 + (atkProgress < 0.5 ? -0.3 : 0); // Giật lùi nòng súng
            }
          }

          if (state === 'dead') {
            // Bia mộ
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(-12, -15, 24, 30, 8) : ctx.fillRect(-12, -15, 24, 30);
            ctx.fill();
            ctx.fillStyle = '#1e293b'; ctx.fillRect(-16, 12, 32, 6);
            ctx.fillStyle = '#94a3b8'; ctx.fillRect(-2, -5, 4, 12); ctx.fillRect(-6, -1, 12, 4);
            ctx.fillStyle = '#334155'; ctx.font = 'bold 8px Courier New'; ctx.textAlign = 'center'; ctx.fillText('RIP', 0, 10);
            ctx.restore();
            return;
          }

          if (isHitFlash) color = '#ffffff';

          // Chân
          if (classId !== 'mage') { // Pháp sư không có chân (bay)
            ctx.save(); ctx.translate(-4, bodyY + 6); ctx.rotate(legLRot);
            ctx.fillStyle = classId === 'knight' ? '#64748b' : '#1e293b'; ctx.fillRect(-2, 0, 4, 8); ctx.restore();
            ctx.save(); ctx.translate(4, bodyY + 6); ctx.rotate(legRRot);
            ctx.fillStyle = classId === 'knight' ? '#64748b' : '#1e293b'; ctx.fillRect(-2, 0, 4, 8); ctx.restore();
          } else {
            // Hiệu ứng tà áo pháp sư
            ctx.fillStyle = '#7c3aed';
            ctx.beginPath();
            ctx.moveTo(-6, bodyY + 6);
            ctx.lineTo(6, bodyY + 6);
            ctx.lineTo(8, bodyY + 12);
            ctx.lineTo(-8, bodyY + 12);
            ctx.fill();
          }

          // Thân
          ctx.fillStyle = classId === 'knight' ? '#94a3b8' : classId === 'rogue' ? '#334155' : classId === 'mage' ? '#7c3aed' : '#4ade80';
          if (isHitFlash) ctx.fillStyle = '#ffffff';
          ctx.fillRect(-6, bodyY - 4, 12, 12);

          // Thắt lưng / Chi tiết áo
          if (classId === 'knight') {
            ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-4, bodyY, 8, 4); // Cầu vai ngực
            ctx.fillStyle = '#334155'; ctx.fillRect(-6, bodyY + 6, 12, 2);
          } else if (classId === 'rogue') {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(-6, bodyY + 2, 12, 2); // Thắt lưng chéo
          } else if (classId === 'archer') {
            ctx.fillStyle = '#78350f'; ctx.fillRect(-6, bodyY + 4, 12, 3); // Thắt lưng da
            ctx.fillStyle = '#fbbf24'; ctx.fillRect(-2, bodyY + 3, 4, 4);
          } else if (classId === 'mage') {
            ctx.fillStyle = '#fbbf24'; ctx.fillRect(-2, bodyY + 2, 4, 4); // Ngọc trước ngực
          }

          // Đầu
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(-8, headY - 10, 16, 14, 3) : ctx.fillRect(-8, headY - 10, 16, 14);
          ctx.fill();

          // Mắt
          ctx.fillStyle = '#111827'; ctx.fillRect(-4, headY - 6, 10, 4);
          ctx.fillStyle = classId === 'knight' ? '#fbbf24' : '#38bdf8'; ctx.fillRect(-2, headY - 5, 4, 2);

          // Phụ kiện Đầu / Mặt
          if (classId === 'knight') {
            // Mũ bảo hiểm sắt
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-9, headY - 12, 18, 6); // Đỉnh mũ
            ctx.fillRect(-9, headY - 6, 4, 10); // Che má trái
            ctx.fillRect(5, headY - 6, 4, 10); // Che má phải
            ctx.fillRect(-5, headY - 1, 10, 5); // Che cằm
            ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-2, headY - 14, 4, 4); // Chóp nón
          } else if (classId === 'rogue') {
            // Khăn trùm đỏ che cằm
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-8, headY - 1, 16, 6);
            ctx.fillRect(-9, headY + 2, 6, 8); // Đuôi khăn rủ xuống
          } else if (classId === 'mage') {
            // Mũ phù thuỷ
            ctx.fillStyle = '#4c1d95';
            ctx.beginPath(); ctx.moveTo(-12, headY - 8); ctx.lineTo(12, headY - 8); ctx.lineTo(0, headY - 24); ctx.fill();
            ctx.fillStyle = '#fbbf24'; ctx.fillRect(-4, headY - 10, 8, 2); // Vành mũ
          } else if (classId === 'archer') {
            // Nón Robin Hood
            ctx.fillStyle = '#166534';
            ctx.beginPath(); ctx.moveTo(-10, headY - 8); ctx.lineTo(10, headY - 8); ctx.lineTo(0, headY - 16); ctx.fill();
            ctx.fillStyle = '#ef4444'; ctx.fillRect(-2, headY - 20, 2, 6); // Lông chim
          }

          // Tay phải & Vũ khí
          if (state !== 'dead') {
            ctx.save();
            ctx.translate(2, bodyY - 1);
            ctx.rotate(armRot);

            ctx.fillStyle = classId === 'knight' ? '#64748b' : color;
            ctx.fillRect(-1, -1, 8, 4); // Cánh tay
            ctx.translate(8, 0);
            ctx.fillStyle = classId === 'knight' ? '#475569' : '#fca5a5'; // Bàn tay / Bao tay thép
            ctx.fillRect(-2, -2, 4, 4);

            if (weapon && state !== 'roll') {
              ctx.fillStyle = weapon.color || '#cbd5e1';
              ctx.rotate(Math.PI / 8);

              if (weapon.id === 'wooden_bow') {
                // Vẽ cung
                ctx.beginPath();
                ctx.arc(0, 0, 14, -Math.PI / 2, Math.PI / 2);
                ctx.strokeStyle = weapon.color || '#cbd5e1'; ctx.lineWidth = 3; ctx.stroke();
                // Dây cung
                ctx.beginPath(); ctx.moveTo(0, -14);
                if (state === 'attack') { ctx.lineTo(-8, 0); } else { ctx.lineTo(0, 0); }
                ctx.lineTo(0, 14);
                ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.stroke();
                // Mũi tên đang nạp
                if (state === 'attack') {
                  ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-8, -1, 18, 2);
                  ctx.fillStyle = '#ef4444'; ctx.fillRect(10, -2, 4, 4); // Đầu mũi tên
                }
              } else if (weapon.id === 'magic_staff') {
                // Trượng phép
                ctx.fillStyle = '#78350f'; ctx.fillRect(-2, -12, 4, 28);
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath(); ctx.arc(0, -14, state === 'attack' ? 6 : 4, 0, Math.PI * 2); ctx.fill();
                if (state === 'attack') {
                  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, -14, 3, 0, Math.PI * 2); ctx.fill();
                }
              } else if (weapon.type === 'melee') {
                ctx.fillRect(0, -12, 4, 24); // Kiếm
                ctx.fillStyle = '#1e293b'; ctx.fillRect(-2, -2, 8, 4);
              } else {
                ctx.fillRect(0, -2, 14, 4); // Súng
                ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 4, 6);
              }

              if (isKnightSkill) {
                ctx.translate(0, 12);
                ctx.fillStyle = weapon.color || '#cbd5e1';
                if (weapon.type === 'melee') ctx.fillRect(0, -12, 4, 24);
                else ctx.fillRect(0, -2, 14, 4);
              }
            }
            ctx.restore();

            // Tay trái cầm khiên (Knight)
            if (classId === 'knight' && state !== 'roll') {
              ctx.save();
              ctx.translate(-6, bodyY);
              ctx.fillStyle = '#64748b'; ctx.fillRect(-1, -6, 4, 12); // Khiên sườn
              ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-2, -2, 6, 4); // Thập tự trên khiên
              ctx.restore();
            }

            // Vết chém (Melee)
            if (state === 'attack' && weapon && weapon.type === 'melee' && weapon.id !== 'magic_staff') {
              const atkProgress = Math.min(1.0, (performance.now() - (player.lastAttackTime || 0)) / 200);
              if (atkProgress < 0.8) {
                ctx.save(); ctx.beginPath();
                ctx.arc(0, 0, 30, -Math.PI / 2 - 0.5, -Math.PI / 2 + atkProgress * Math.PI + 0.5);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 4 * (1 - atkProgress); ctx.stroke();
                if (isKnightSkill) {
                  ctx.beginPath(); ctx.arc(0, 15, 30, -Math.PI / 2 - 0.5, -Math.PI / 2 + atkProgress * Math.PI + 0.5);
                  ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)'; ctx.lineWidth = 4 * (1 - atkProgress); ctx.stroke();
                }
                ctx.restore();
              }
            }
          }

          if (state === 'roll') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.beginPath(); ctx.arc(-10 * facing, 5, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; ctx.beginPath(); ctx.arc(-20 * facing, 5, 6, 0, Math.PI * 2); ctx.fill();
          }

          ctx.restore();
        };

        // Nếu ngắm chuột ở bên trái -> quay trái
        const angle = player.angle || 0;
        let aimFacing = 1;
        if (Math.abs(angle) > Math.PI / 2) aimFacing = -1;
        if (player.animState === 'walk') aimFacing = player.facingDirection || 1; // Ưu tiên hướng di chuyển khi chạy
        if (player.animState === 'attack') aimFacing = Math.abs(angle) > Math.PI / 2 ? -1 : 1; // Khi bắn ép quay theo hướng đạn

        drawPixelChibi(getPlayerColor(player.classId || 'knight'), player.animState || 'idle', aimFacing, performance.now(), player.classId || 'knight');

        ctx.restore();

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
        ctx.fillText(dn.value.toString() + (dn.isCrit ? '!' : ''), dn.x, dn.y);
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
