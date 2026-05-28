import React, { useEffect, useRef, useState } from 'react';
import { useEntityStore } from '../store/entityStore';
import { useMapStore, ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS, GATE_WIDTH } from '../store/mapStore';
import { useGameStore } from '../store/gameStore';
import { triggerPlayerAttack, triggerPlayerSkill, triggerPlayerUltimate } from '../systems/combatSystem';
import { useGameLoop } from '../gameLoop/useGameLoop';
import { drawPlayerChibi } from '../graphics/drawPlayer';
import { drawEnemy } from '../graphics/drawEnemy';
import { getStoneFloorTexture, getWallTexture } from '../graphics/textureGen';
import type { Entity } from '../types/interfaces';

let footstepParticles: Array<{x: number, y: number, life: number, maxLife: number, size: number, vx: number, vy: number}> = [];

const drawMonster = (ctx: CanvasRenderingContext2D, enemy: Entity, isStunned: boolean, bounce: number) => {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  
  if (enemy.isElite) {
    ctx.save();
    const pulse = Math.abs(Math.sin(performance.now() / 200));
    let auraColor = 'rgba(255, 215, 0, '; // Vàng
    if (enemy.element === 'fire') auraColor = 'rgba(239, 68, 68, ';
    else if (enemy.element === 'ice') auraColor = 'rgba(56, 189, 248, ';
    else if (enemy.element === 'poison') auraColor = 'rgba(168, 85, 247, ';
    
    ctx.beginPath();
    ctx.rect(-enemy.radius - 10 - pulse * 10, -enemy.radius - 10 - pulse * 10, (enemy.radius + 10 + pulse * 10) * 2, (enemy.radius + 10 + pulse * 10) * 2);
    ctx.fillStyle = auraColor + (0.3 - pulse * 0.1) + ')';
    ctx.fill();
    ctx.strokeStyle = auraColor + '0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }

  // Delegate việc vẽ Quái vật & Boss sang file riêng
  drawEnemy(ctx, enemy, bounce, isStunned);

  // --- VẼ HIỆU ỨNG TRẠNG THÁI (STATUS FX) ---
  const time = performance.now();
  if (enemy.statusEffects.includes('burning')) {
    ctx.fillStyle = '#f97316'; // Lửa cam
    for (let i = 0; i < 5; i++) {
      const fx = (Math.random() - 0.5) * enemy.radius * 2;
      const fy = -enemy.radius * Math.random() * 2 + bounce;
      const size = 2 + Math.random() * 3;
      ctx.globalAlpha = 0.6 + Math.sin(time / 100 + i) * 0.4;
      ctx.beginPath(); ctx.arc(fx, fy, size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  if (enemy.statusEffects.includes('frozen')) {
    // Khối băng bọc quanh người
    ctx.fillStyle = 'rgba(125, 211, 252, 0.5)'; // Xanh nhạt trong suốt
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -enemy.radius * 1.5 + bounce);
    ctx.lineTo(enemy.radius * 1.2, bounce);
    ctx.lineTo(0, enemy.radius * 1.2 + bounce);
    ctx.lineTo(-enemy.radius * 1.2, bounce);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (enemy.statusEffects.includes('poisoned')) {
    ctx.fillStyle = '#a3e635'; // Bong bóng độc xanh lá mạ
    for (let i = 0; i < 3; i++) {
      const px = (Math.sin(time / 200 + i * 2) * enemy.radius);
      const py = -enemy.radius - (time / 20 + i * 50) % 20 + bounce;
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  if (enemy.statusEffects.includes('stunned')) {
    // Sao vàng quay trên đầu
    ctx.fillStyle = '#fef08a';
    ctx.shadowBlur = 5; ctx.shadowColor = '#fbbf24';
    for (let i = 0; i < 3; i++) {
      const angle = time / 300 + (i * Math.PI * 2) / 3;
      const sx = Math.cos(angle) * enemy.radius;
      const sy = -enemy.radius * 1.5 + Math.sin(angle) * 5 + bounce;
      ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
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

      // Kích hoạt Chiêu Cuối (R)
      if (key === 'r') {
        triggerPlayerUltimate();
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
    const { player, chests, shrines, shopItems, anvils, groundWeapons, openChest, purchaseShopItem, useAnvil, useShrine, updatePlayer, removeGroundWeapon } = state;
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

            // Sinh ngẫu nhiên một vật phẩm (Relic)
            const relicKeys = ['vampire_tooth', 'hermes_boots', 'berserker_ring'];
            const randomRelic = relicKeys[Math.floor(Math.random() * relicKeys.length)];
            
            useEntityStore.getState().addRelicPickup({
              id: `relic_${Date.now()}`,
              x: chest.x,
              y: chest.y + 20, // Rơi ra phía dưới rương
              radius: 12,
              relicId: randomRelic
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
          } else if (shrine.type === 'sacrifice') {
            // Blood Altar: Trừ 30% HP tối đa, tặng Cursed Blood Ring
            const hpCost = Math.max(1, Math.floor(player.maxHp * 0.3));
            if (player.hp > hpCost) {
              updatePlayer({ hp: player.hp - hpCost });
              
              useEntityStore.getState().addRelicPickup({
                id: `relic_sac_${Date.now()}`,
                x: shrine.x,
                y: shrine.y + 30,
                radius: 12,
                relicId: 'cursed_blood_ring'
              });

              // Bắn hiệu ứng máu nổ tung
              const time = performance.now();
              for (let k = 0; k < 20; k++) {
                const angle = Math.random() * Math.PI * 2;
                useEntityStore.getState().addParticle({
                  id: `blood_sac_${Date.now()}_${k}`,
                  x: shrine.x,
                  y: shrine.y,
                  vx: Math.cos(angle) * (2 + Math.random() * 4),
                  vy: Math.sin(angle) * (2 + Math.random() * 4),
                  radius: 3 + Math.random() * 3,
                  color: '#991b1b',
                  alpha: 1.0,
                  decay: 0.03,
                  createdAt: time,
                  lifespan: 600
                });
              }
            } else {
              // Cạn kiệt máu, không thể hiến tế
              return;
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

    // 4. Tương tác Lò Rèn (Anvil)
    for (const anvil of anvils) {
      const dist = Math.sqrt((player.x - anvil.x) ** 2 + (player.y - anvil.y) ** 2);
      if (dist <= player.radius + anvil.radius + 15) {
        if (!anvil.used) {
          const gold = useGameStore.getState().gold;
          if (gold >= anvil.cost) {
            useGameStore.setState({ gold: gold - anvil.cost });
            useAnvil(anvil.id);
            
            // Cường hoá vũ khí đang cầm
            const pWeapons = [...(player.weapons || [])];
            const activeIdx = player.activeWeaponIndex || 0;
            const activeWeapon = pWeapons[activeIdx];
            
            if (activeWeapon) {
              const currentLvl = activeWeapon.upgradeLevel || 0;
              const nextLvl = currentLvl + 1;
              const newName = activeWeapon.name.includes('+') ? activeWeapon.name.replace(/\+\d+/, `+${nextLvl}`) : `${activeWeapon.name} +1`;
              
              pWeapons[activeIdx] = {
                ...activeWeapon,
                damage: Math.floor(activeWeapon.damage * 1.25), // Tăng 25% sát thương
                upgradeLevel: nextLvl,
                name: newName
              };
              updatePlayer({ weapons: pWeapons });
              
              // Hạt lửa đập búa (Particle sparks)
              const time = performance.now();
              for (let k = 0; k < 15; k++) {
                const angle = Math.random() * Math.PI * 2;
                useEntityStore.getState().addParticle({
                  id: `anvil_spark_${Date.now()}_${k}`,
                  x: anvil.x,
                  y: anvil.y - 10,
                  vx: Math.cos(angle) * (2 + Math.random() * 4),
                  vy: Math.sin(angle) * (2 + Math.random() * 4) - 2, // Hơi nảy lên
                  radius: 2 + Math.random() * 3,
                  color: '#f97316', // Lửa cam đỏ
                  alpha: 1.0,
                  decay: 0.04,
                  createdAt: time,
                  lifespan: 500
                });
              }
              
              // Nổi text báo hiệu
              useEntityStore.getState().addDamageNumber({
                id: `upgrade_text_${Date.now()}`,
                x: player.x,
                y: player.y - 30,
                value: 0,
                text: 'UPGRADED!',
                color: '#f59e0b',
                isCrit: true,
                createdAt: time,
                lifespan: 1000
              });
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

    let lastHoveredId: string | null = null;

    const render = () => {
      const { 
        player, enemies, allies, projectiles, particles, damageNumbers,
        chests, shrines, shopItems, anvils, goldPickups, expPickups, healthPickups, relicPickups,
        groundWeapons, destructibleBarrels, explosiveBarrels, portal, spikeTraps, cameraShake, cameraShakeDx, cameraShakeDy, updatePlayer,
        activeBossInstance
      } = useEntityStore.getState();

      // Tính toạ độ camera (theo sát player)
      let cameraX = 0;
      let cameraY = 0;
      if (player && canvas) {
        cameraX = player.x - canvas.width / 2;
        cameraY = player.y - canvas.height / 2;
      }

      ctx.save();
      // Clear toàn bộ màn hình
      ctx.fillStyle = '#0a0a0a'; // Nền đen thẳm (Pitch Black)
      if (canvas) {
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Vẽ thêm grid hoặc chấm đỏ để giả làm vệt máu / đá thô
        ctx.fillStyle = '#1c1917';
        for(let i=0; i<canvas.width; i+=40) {
          for(let j=0; j<canvas.height; j+=40) {
            ctx.fillRect(i, j, 2, 2);
          }
        }
      }

      // --- HIỆU ỨNG RUNG BÀN HÌNH (CAMERA SHAKE) ---
      if (cameraShake > 0) {
        // Rung theo hướng (Directional Shake) + một chút ngẫu nhiên
        const randX = (Math.random() - 0.5) * cameraShake;
        const randY = (Math.random() - 0.5) * cameraShake;
        const dx = (cameraShakeDx || 0) * cameraShake * 1.5 + randX;
        const dy = (cameraShakeDy || 0) * cameraShake * 1.5 + randY;
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

      const currentRoom = useMapStore.getState().rooms.find(r => r.id === currentRoomId);
      
      const biome = currentRoom?.biome || 'dungeon';
      const floorPat = ctx.createPattern(getStoneFloorTexture(biome), 'repeat');
      if (floorPat) {
        ctx.fillStyle = floorPat;
        ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
      } else {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
      }

      // --- VẼ VẾT MÁU (BLOOD DECALS) ---
      if (currentRoom?.bloodDecals) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        currentRoom.bloodDecals.forEach(decal => {
          // Frustum Culling cho Blood Decal
          if (decal.x < cameraX - 200 || decal.x > cameraX + screenW + 200 ||
              decal.y < cameraY - 200 || decal.y > cameraY + screenH + 200) {
            return;
          }
          
          ctx.globalAlpha = decal.alpha;
          if (decal.type === 'puddle') {
            // Vũng máu lớn (nhiều khối tròn nối nhau)
            ctx.fillStyle = '#450a0a'; // Máu đọng sẫm đen
            ctx.beginPath();
            
            // Dùng tọa độ làm seed giả ngẫu nhiên
            const seed1 = Math.abs(Math.sin(decal.x * 0.123 + decal.y)) * 5;
            const seed2 = Math.abs(Math.cos(decal.x * 0.321 - decal.y)) * 5;
            
            ctx.ellipse(decal.x, decal.y, decal.radius, decal.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.ellipse(decal.x - seed1, decal.y + seed2, decal.radius * 0.8, decal.radius * 0.5, 0.5, 0, Math.PI * 2);
            ctx.ellipse(decal.x + seed2, decal.y - seed1, decal.radius * 0.7, decal.radius * 0.4, -0.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#7f1d1d'; // Máu tươi hơn ở lõi
            ctx.beginPath();
            ctx.ellipse(decal.x + 2, decal.y + 1, decal.radius * 0.6, decal.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Splatter (hạt vụn rải rác)
            ctx.fillStyle = '#991b1b';
            const seed = Math.abs(Math.sin(decal.x * decal.y));
            ctx.beginPath();
            ctx.arc(decal.x, decal.y, decal.radius, 0, Math.PI * 2);
            ctx.arc(decal.x + seed*5, decal.y - seed*4, decal.radius*0.5, 0, Math.PI * 2);
            ctx.arc(decal.x - seed*3, decal.y + seed*6, decal.radius*0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.globalAlpha = 1.0;
      }

      // --- SƯƠNG MÙ DƯỚI ĐÁY NGỤC (VOLUMETRIC FOG) ---
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const timeSec = performance.now() / 1000;
      // Vẽ khoảng 15 cuộn sương mù trôi lờ lững quanh camera
      for (let i = 0; i < 15; i++) {
        // Sinh tọa độ ngẫu nhiên nhưng lặp lại theo chu kỳ để sương dịch chuyển liên tục
        const fogX = ((cameraX + i * 150 + timeSec * (10 + i % 5)) % (ROOM_WIDTH + 400)) - 200;
        const fogY = ((cameraY + i * 100 + Math.sin(timeSec * 0.5 + i) * 50) % (ROOM_HEIGHT + 400)) - 200;
        
        const fogGrad = ctx.createRadialGradient(fogX, fogY, 0, fogX, fogY, 200);
        fogGrad.addColorStop(0, `rgba(40, 45, 55, ${0.15 + (Math.sin(timeSec + i) * 0.05)})`); // Xám xanh mờ
        fogGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = fogGrad;
        ctx.beginPath();
        // Cuộn sương hình bầu dục kéo ngang
        ctx.ellipse(fogX, fogY, 250, 120, Math.sin(i), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      spikeTraps.forEach(trap => {
        const trapSize = trap.radius * 2;
        const tx = trap.x - trap.radius;
        const ty = trap.y - trap.radius;

        if (trap.variant === 'lava') {
          // Lava Geyser
          const grad = ctx.createRadialGradient(trap.x, trap.y, 0, trap.x, trap.y, trap.radius);
          grad.addColorStop(0, trap.active ? '#fef08a' : '#7f1d1d');
          grad.addColorStop(0.5, trap.active ? '#ea580c' : '#450a0a');
          grad.addColorStop(1, '#1c1917');
          ctx.fillStyle = grad;
          
          if (trap.active) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ea580c';
          }
          ctx.beginPath();
          ctx.arc(trap.x, trap.y, trap.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          if (trap.active) {
            ctx.fillStyle = '#f97316';
            ctx.beginPath(); ctx.arc(trap.x, trap.y, trap.radius * 0.5 + Math.sin(performance.now()/100)*2, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath(); ctx.arc(trap.x, trap.y, trap.radius * 0.2 + Math.sin(performance.now()/50)*2, 0, Math.PI*2); ctx.fill();
          }
        } else if (trap.variant === 'poison') {
          // Poison Vent
          const grad = ctx.createRadialGradient(trap.x, trap.y, 0, trap.x, trap.y, trap.radius);
          grad.addColorStop(0, trap.active ? '#4ade80' : '#064e3b');
          grad.addColorStop(1, '#022c22');
          ctx.fillStyle = grad;
          
          if (trap.active) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#22c55e';
          }
          
          ctx.fillRect(tx + 5, ty + 5, trapSize - 10, trapSize - 10);
          ctx.strokeStyle = '#022c22';
          ctx.lineWidth = 2;
          ctx.strokeRect(tx + 5, ty + 5, trapSize - 10, trapSize - 10);
          ctx.shadowBlur = 0;
          
          if (trap.active) {
            ctx.fillStyle = `rgba(34, 197, 94, ${0.4 + Math.sin(performance.now()/150)*0.2})`;
            ctx.beginPath(); ctx.arc(trap.x, trap.y, trap.radius, 0, Math.PI*2); ctx.fill();
            for (let i = 0; i < 4; i++) {
              ctx.fillStyle = '#4ade80';
              ctx.beginPath(); ctx.arc(trap.x + (Math.random()-0.5)*trapSize*0.8, trap.y + (Math.random()-0.5)*trapSize*0.8, 2+Math.random()*4, 0, Math.PI*2); ctx.fill();
            }
          }
        } else {
          // Normal Spike
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(tx, ty, trapSize, trapSize);
          ctx.strokeStyle = '#0c0a09';
          ctx.lineWidth = 2;
          ctx.strokeRect(tx, ty, trapSize, trapSize);

          if (trap.active) {
            ctx.fillStyle = '#b91c1c'; // Blood red tips
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#991b1b';
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.moveTo(tx + 6 + i * 15, ty + 12 + j * 15);
                ctx.lineTo(tx + 12 + i * 15, ty + 12 + j * 15);
                ctx.lineTo(tx + 9 + i * 15, ty + 4 + j * 15);
                ctx.fill();
              }
            }
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = '#000';
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.arc(tx + 9 + i * 15, ty + 9 + j * 15, 2, 0, Math.PI*2);
                ctx.fill();
              }
            }
          }
        }
      });

      // --- VẼ TƯỜNG PHÒNG (WALLS) ---
      const wallPat = ctx.createPattern(getWallTexture(biome), 'repeat');
      if (wallPat) {
        ctx.fillStyle = wallPat;
      } else {
        ctx.fillStyle = '#1c1917';
      }
      ctx.strokeStyle = '#000000'; // Viền đen nhám
      ctx.lineWidth = 4;

      const gateMinX = ROOM_WIDTH / 2 - GATE_WIDTH / 2;
      const gateMinY = ROOM_HEIGHT / 2 - GATE_WIDTH / 2;
      const isLocked = currentRoom?.state === 'combat_lock';

      // Nền bóng râm cho tường (Shadow)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, 10, ROOM_WIDTH, WALL_THICKNESS + 10);
      ctx.fillRect(10, ROOM_HEIGHT - WALL_THICKNESS - 10, ROOM_WIDTH, WALL_THICKNESS + 10);
      ctx.fillRect(10, 10, WALL_THICKNESS + 10, ROOM_HEIGHT);
      ctx.fillRect(ROOM_WIDTH - WALL_THICKNESS - 10, 10, WALL_THICKNESS + 10, ROOM_HEIGHT);

      // --- VẼ TƯỜNG (3D effect) ---
      const depth = 20; // Độ sâu 3D của tường
      
      // Mặt bên (Side faces) - Tối hơn
      ctx.fillStyle = '#0a0a0a'; 
      // Tường trên (mặt trước)
      ctx.fillRect(0, WALL_THICKNESS, ROOM_WIDTH, depth);
      // Tường trái (mặt phải)
      ctx.fillRect(WALL_THICKNESS, 0, depth, ROOM_HEIGHT);
      // Tường phải (mặt trái)
      ctx.fillRect(ROOM_WIDTH - WALL_THICKNESS - depth, 0, depth, ROOM_HEIGHT);
      // Tường dưới (mặt sau - thường bị che bởi top face, nhưng vẽ cho chắc)
      ctx.fillRect(0, ROOM_HEIGHT - WALL_THICKNESS - depth, ROOM_WIDTH, depth);

      // Mặt trên cùng (Top faces) - Sáng hơn, có texture
      if (wallPat) {
        ctx.fillStyle = wallPat;
      } else {
        ctx.fillStyle = '#1c1917';
      }
      // Top wall
      ctx.fillRect(0, 0, ROOM_WIDTH, WALL_THICKNESS);
      ctx.strokeRect(0, 0, ROOM_WIDTH, WALL_THICKNESS);
      // Bottom wall
      ctx.fillRect(0, ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH, WALL_THICKNESS);
      ctx.strokeRect(0, ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH, WALL_THICKNESS);
      // Left wall
      ctx.fillRect(0, 0, WALL_THICKNESS, ROOM_HEIGHT);
      ctx.strokeRect(0, 0, WALL_THICKNESS, ROOM_HEIGHT);
      // Right wall
      ctx.fillRect(ROOM_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ROOM_HEIGHT);
      ctx.strokeRect(ROOM_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ROOM_HEIGHT);

      // --- VẼ CỬA PHÒNG (GATES) ---
      const drawGate = (gx: number, gy: number, w: number, h: number, hasGate: boolean, direction: string) => {
        if (!hasGate) return; // Không có cửa thì giữ nguyên tường

        // Nền của cửa (cắt tường bằng màu nền mờ)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(gx, gy, w, h);

        if (isLocked) {
          // Forcefield cổng kim loại / Gai xương chéo
          const t = performance.now() / 200;
          
          // Khung cửa
          ctx.fillStyle = '#292524'; 
          ctx.fillRect(gx, gy, w, h);
          ctx.strokeStyle = '#1c1917';
          ctx.lineWidth = 4;
          ctx.strokeRect(gx, gy, w, h);
          
          // Các thanh kim loại chạy chéo hoặc thẳng
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#000';
          ctx.beginPath();
          if (direction === 'north' || direction === 'south') {
            for (let offset = 15; offset < w; offset += 30) {
              ctx.moveTo(gx + offset, gy);
              ctx.lineTo(gx + offset, gy + h);
            }
          } else {
            for (let offset = 15; offset < h; offset += 30) {
              ctx.moveTo(gx, gy + offset);
              ctx.lineTo(gx + w, gy + offset);
            }
          }
          ctx.stroke();

          // Forcefield Glow Đỏ chớp tắt
          ctx.fillStyle = `rgba(220, 38, 38, ${0.4 + Math.sin(t)*0.2})`;
          ctx.fillRect(gx, gy, w, h);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(gx + 2, gy + 2, w - 4, h - 4);

        } else {
          // Hành lang mở ra - Vẽ thảm đỏ dẫn đường và viền cửa rõ ràng
          ctx.fillStyle = '#1c1917'; // Khung cửa bằng đá
          ctx.fillRect(gx, gy, w, h);
          
          // Vẽ thảm đỏ ở giữa cửa
          ctx.fillStyle = '#7f1d1d'; // Đỏ thẫm
          if (direction === 'north' || direction === 'south') {
            ctx.fillRect(gx + w/4, gy, w/2, h);
          } else {
            ctx.fillRect(gx, gy + h/4, w, h/2);
          }

          // Hiệu ứng ánh sáng mời gọi
          const grad = ctx.createLinearGradient(
            direction === 'west' ? gx + w : gx,
            direction === 'north' ? gy + h : gy,
            direction === 'east' ? gx : direction === 'west' ? gx + w : gx,
            direction === 'south' ? gy : direction === 'north' ? gy + h : gy
          );
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.8)');
          ctx.fillStyle = grad;
          ctx.fillRect(gx, gy, w, h);

          // Hai ngọn đuốc nhỏ hai bên cửa
          const drawTorch = (tx: number, ty: number) => {
            ctx.fillStyle = '#f59e0b'; // Lửa cam
            ctx.beginPath(); ctx.arc(tx, ty, 4, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 10; ctx.shadowColor = '#f59e0b';
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(tx, ty, 2, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
          };
          
          if (direction === 'north' || direction === 'south') {
            drawTorch(gx + 5, direction === 'north' ? gy + h - 5 : gy + 5);
            drawTorch(gx + w - 5, direction === 'north' ? gy + h - 5 : gy + 5);
          } else {
            drawTorch(direction === 'west' ? gx + w - 5 : gx + 5, gy + 5);
            drawTorch(direction === 'west' ? gx + w - 5 : gx + 5, gy + h - 5);
          }
        }
      };

      if (currentRoom) {
        drawGate(gateMinX, 0, GATE_WIDTH, WALL_THICKNESS, currentRoom.gates.north, 'north');
        drawGate(gateMinX, ROOM_HEIGHT - WALL_THICKNESS, GATE_WIDTH, WALL_THICKNESS, currentRoom.gates.south, 'south');
        drawGate(0, gateMinY, WALL_THICKNESS, GATE_WIDTH, currentRoom.gates.west, 'west');
        drawGate(ROOM_WIDTH - WALL_THICKNESS, gateMinY, WALL_THICKNESS, GATE_WIDTH, currentRoom.gates.east, 'east');
      }

      // --- DYNAMIC SHADOW PASS (ĐỔ BÓNG ĐỘNG) ---
      // Ánh sáng phát ra từ Player, đổ bóng cho Quái vật, Bàn thờ, Rương
      if (player) {
        ctx.save();
        
        const drawShadow = (objX: number, objY: number, radius: number) => {
          // Dynamic Point Light Shadow with gradient fade
          const dx = objX - player.x;
          const dy = objY - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 10) return; // Quá gần không đổ bóng
          
          const angle = Math.atan2(dy, dx);
          const shadowLength = 30 + (dist * 0.15); // Bóng dài ra khi ở xa
          const shadowAlpha = Math.max(0.08, 0.45 - (dist / 1500));
          
          // Gradient mờ dần từ gốc ra đuôi bóng
          const endX = objX + Math.cos(angle) * shadowLength;
          const endY = objY + Math.sin(angle) * shadowLength;
          const shadowGrad = ctx.createLinearGradient(objX, objY, endX, endY);
          shadowGrad.addColorStop(0, `rgba(0,0,0,${shadowAlpha})`);
          shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.fillStyle = shadowGrad;
          ctx.beginPath();
          // Hình thang đổ dài ra phía sau
          const p1x = objX + Math.cos(angle - Math.PI/2) * radius * 0.8;
          const p1y = objY + Math.sin(angle - Math.PI/2) * radius * 0.8;
          const p2x = objX + Math.cos(angle + Math.PI/2) * radius * 0.8;
          const p2y = objY + Math.sin(angle + Math.PI/2) * radius * 0.8;
          const spreadFactor = 1.4;
          
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineTo(endX + Math.cos(angle + Math.PI/2) * radius * 0.3 * spreadFactor, endY + Math.sin(angle + Math.PI/2) * radius * 0.3 * spreadFactor);
          ctx.lineTo(endX + Math.cos(angle - Math.PI/2) * radius * 0.3 * spreadFactor, endY + Math.sin(angle - Math.PI/2) * radius * 0.3 * spreadFactor);
          ctx.closePath();
          ctx.fill();
        };

        enemies.forEach(e => { if (e.hp > 0) drawShadow(e.x, e.y, e.radius); });
        shrines.forEach(s => drawShadow(s.x, s.y, s.radius));
        chests.forEach(c => drawShadow(c.x, c.y, c.radius));
        currentRoom?.pillars?.forEach(p => drawShadow(p.x, p.y, p.radius));
        anvils.forEach(a => drawShadow(a.x, a.y, 20));
        goldPickups.forEach(g => drawShadow(g.x, g.y, g.radius));
        expPickups.forEach(e => drawShadow(e.x, e.y, e.radius));
        healthPickups.forEach(h => drawShadow(h.x, h.y, h.radius));
        shopItems.forEach(s => { if (!s.purchased) drawShadow(s.x, s.y, s.radius); });
        groundWeapons.forEach(gw => drawShadow(gw.x, gw.y, gw.radius));
        destructibleBarrels.forEach(b => drawShadow(b.x, b.y, b.radius));
        explosiveBarrels.forEach(b => drawShadow(b.x, b.y, b.radius));
        ctx.restore();
      }

      // --- VẼ BÀN THỜ HUYẾT NGẢI (CURSED ALTA / SHRINES) ---
      shrines.forEach(shrine => {
        const sr = shrine.radius;
        // Chân đế
        ctx.fillStyle = shrine.used ? '#1c1917' : '#450a0a';
        ctx.fillRect(shrine.x - sr, shrine.y - sr + 10, sr * 2, sr * 2 - 10);
        // Hộp sọ / Chậu máu
        ctx.fillStyle = shrine.used ? '#000' : (shrine.type === 'health' ? '#dc2626' : shrine.type === 'power' ? '#ea580c' : shrine.type === 'sacrifice' ? '#7f1d1d' : '#2563eb');
        ctx.fillRect(shrine.x - sr * 0.5, shrine.y - sr, sr, sr);
        // Mắt rỗng hộp sọ
        if (!shrine.used) {
          ctx.fillStyle = '#000';
          ctx.fillRect(shrine.x - sr * 0.3, shrine.y - sr * 0.6, 4, 4);
          ctx.fillRect(shrine.x + sr * 0.1, shrine.y - sr * 0.6, 4, 4);
        }

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px Courier New';
        const shrineLetter = shrine.type === 'health' ? 'H' : shrine.type === 'power' ? 'P' : shrine.type === 'sacrifice' ? 'S' : 'D';
        ctx.fillText(shrineLetter, shrine.x, shrine.y + sr * 0.8);
      });

      // --- VẼ CỬA HÀNG (SHOP ITEMS) ---
      shopItems.forEach(item => {
        if (item.purchased) return;

        // Vẽ bệ đỡ (Pedestal) vuông
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(item.x - item.radius, item.y - item.radius, item.radius*2, item.radius*2);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(item.x - item.radius, item.y - item.radius, item.radius*2, item.radius*2);

        // Vẽ vật phẩm nổi bên trên bệ
        const bounceOffset = Math.sin(performance.now() / 200) * 4;
        const iy = item.y - 12 + bounceOffset;

        if (item.type === 'hp_potion') {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(item.x - 6, iy, 12, 14);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(item.x - 3, iy - 3, 6, 3);
        } else if (item.type === 'mp_potion') {
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(item.x - 6, iy, 12, 14);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(item.x - 3, iy - 3, 6, 3);
        } else if (item.type === 'weapon' && item.weaponItem) {
          ctx.fillStyle = item.weaponItem.color || '#fff';
          ctx.fillRect(item.x - 8, iy, 16, 6);
        }

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(item.x - 22, item.y + 18, 44, 14);
        ctx.strokeStyle = '#fbbf24';
        ctx.strokeRect(item.x - 22, item.y + 18, 44, 14);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px Courier New';
        ctx.fillText(`${item.cost}G`, item.x, item.y + 25);
      });

      // --- VẼ LÒ RÈN RỈ SÉT (ANVILS) ---
      anvils.forEach(anvil => {
        if (!anvil.used) {
          // Metallic gradient base
          const anvilGrad = ctx.createLinearGradient(anvil.x - 20, anvil.y, anvil.x + 20, anvil.y);
          anvilGrad.addColorStop(0, '#1c1917');
          anvilGrad.addColorStop(0.4, '#44403c');
          anvilGrad.addColorStop(0.6, '#57534e'); // Specular
          anvilGrad.addColorStop(1, '#1c1917');
          ctx.fillStyle = anvilGrad;
        } else {
          ctx.fillStyle = '#0c0a09';
        }
        ctx.fillRect(anvil.x - 20, anvil.y - 10, 40, 20);
        
        // Đỉnh đe (gradient)
        if (!anvil.used) {
          const topGrad = ctx.createLinearGradient(anvil.x - 25, anvil.y - 18, anvil.x + 25, anvil.y - 10);
          topGrad.addColorStop(0, '#27272a');
          topGrad.addColorStop(0.5, '#52525b');
          topGrad.addColorStop(1, '#27272a');
          ctx.fillStyle = topGrad;
          
          // Tia lửa nhỏ trên đe
          const sparkTime = performance.now();
          if (Math.sin(sparkTime / 300) > 0.7) {
            ctx.fillStyle = '#f97316';
            ctx.shadowBlur = 6; ctx.shadowColor = '#f97316';
            ctx.beginPath(); ctx.arc(anvil.x + (Math.sin(sparkTime) * 10), anvil.y - 20, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else {
          ctx.fillStyle = '#000';
        }
        ctx.fillRect(anvil.x - 25, anvil.y - 18, 50, 8);
        
        if (!anvil.used) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(anvil.x - 22, anvil.y + 15, 44, 14);
          ctx.strokeStyle = '#7f1d1d';
          ctx.strokeRect(anvil.x - 22, anvil.y + 15, 44, 14);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 9px Courier New';
          ctx.fillText(`${anvil.cost}G`, anvil.x, anvil.y + 22);
        }
      });

      // --- VẼ KÉN NHỤC THỂ (CHESTS) ---
      chests.forEach(chest => {
        const pulse = chest.opened ? 0 : Math.sin(performance.now() / 150) * 2;
        
        if (!chest.opened) {
          // Gradient flesh thịt
          const chestGrad = ctx.createRadialGradient(chest.x, chest.y, 2, chest.x, chest.y, 22 + pulse);
          chestGrad.addColorStop(0, '#dc2626');
          chestGrad.addColorStop(0.6, '#991b1b');
          chestGrad.addColorStop(1, '#450a0a');
          ctx.fillStyle = chestGrad;
        } else {
          ctx.fillStyle = '#450a0a';
        }
        ctx.fillRect(chest.x - 18 - pulse, chest.y - 12 - pulse, 36 + pulse*2, 24 + pulse*2);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(chest.x - 14, chest.y - 8, 28, 16);

        if (!chest.opened) {
          // Animated veins (mạch máu co giãn)
          const veinPulse = Math.sin(performance.now() / 200) * 1.5;
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2 + veinPulse * 0.5;
          ctx.beginPath(); ctx.moveTo(chest.x - 10 - pulse, chest.y - 12 - pulse); ctx.lineTo(chest.x - 8 - pulse, chest.y + 12 + pulse); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(chest.x + 6 + pulse, chest.y - 12 - pulse); ctx.lineTo(chest.x + 8 + pulse, chest.y + 12 + pulse); ctx.stroke();
          // Cross veins
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(chest.x - 12, chest.y - 2); ctx.lineTo(chest.x + 12, chest.y + 2); ctx.stroke();
          
          // Pulsing core glow
          ctx.fillStyle = `rgba(220, 38, 38, ${0.3 + Math.sin(performance.now() / 100) * 0.2})`;
          ctx.beginPath(); ctx.arc(chest.x, chest.y, 8 + veinPulse, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(chest.x - 20, chest.y + 10, 40, 4);
        }
      });

      // --- VẼ ĐỐNG XÁC CHẾT (BARRELS / TNT) ---
      destructibleBarrels.forEach(b => {
        // Đống xương vụn (Bone Pile)
        ctx.fillStyle = '#d4d4d8';
        ctx.fillRect(b.x - b.radius, b.y - b.radius, b.radius*2, b.radius*2);
        ctx.fillStyle = '#71717a';
        ctx.fillRect(b.x - b.radius*0.8, b.y - b.radius*0.5, b.radius*1.6, b.radius);
        ctx.fillStyle = '#000';
        ctx.fillRect(b.x - 4, b.y - 4, 3, 3); // Hốc mắt
        ctx.fillRect(b.x + 2, b.y - 4, 3, 3);
      });

      explosiveBarrels.forEach(b => {
        // Xác trương phình (Bloated Corpse)
        const swell = Math.sin(performance.now() / 200) * 2;
        ctx.fillStyle = '#4c1d95'; // Màu tím đen độc tố
        ctx.fillRect(b.x - b.radius - swell, b.y - b.radius - swell, b.radius*2 + swell*2, b.radius*2 + swell*2);
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', b.x, b.y);
      });

      // --- VẼ VÀNG & MANA RƠI TRÊN ĐẤT (PICKUPS) ---
      goldPickups.forEach(gold => {
        const renderY = gold.y + (gold.z || 0);
        const sparkle = Math.sin(performance.now() / 100 + gold.x) * 0.3;
        
        // Gradient vàng kim
        const goldGrad = ctx.createRadialGradient(gold.x - 1, renderY - 1, 0, gold.x, renderY, gold.radius + 1);
        goldGrad.addColorStop(0, '#fef08a');
        goldGrad.addColorStop(0.6, '#fbbf24');
        goldGrad.addColorStop(1, '#92400e');
        ctx.fillStyle = goldGrad;
        ctx.beginPath();
        ctx.arc(gold.x, renderY, gold.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Sparkle highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + sparkle})`;
        ctx.beginPath();
        ctx.arc(gold.x - 1, renderY - 1, gold.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      expPickups.forEach(exp => {
        const renderY = exp.y + (exp.z || 0);
        const glow = Math.sin(performance.now() / 150) * 3;
        
        // Hào quang phát sáng
        const expGlow = ctx.createRadialGradient(exp.x, renderY, 0, exp.x, renderY, exp.radius * 2);
        expGlow.addColorStop(0, 'rgba(45, 212, 191, 0.3)');
        expGlow.addColorStop(1, 'rgba(45, 212, 191, 0)');
        ctx.fillStyle = expGlow;
        ctx.beginPath();
        ctx.arc(exp.x, renderY, exp.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2dd4bf';
        ctx.shadowColor = '#2dd4bf';
        ctx.shadowBlur = 12 + glow;
        
        ctx.beginPath();
        ctx.moveTo(exp.x, renderY - exp.radius);
        ctx.lineTo(exp.x + exp.radius, renderY);
        ctx.lineTo(exp.x, renderY + exp.radius);
        ctx.lineTo(exp.x - exp.radius, renderY);
        ctx.closePath();
        ctx.fill();
        
        // Lõi sáng trắng
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(exp.x, renderY, exp.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
      });

      healthPickups.forEach(hp => {
        const renderY = hp.y + (hp.z || 0);
        const pulse = Math.sin(performance.now() / 200) * 2;
        
        // Hào quang đỏ pulse
        const hpGlow = ctx.createRadialGradient(hp.x, renderY, 0, hp.x, renderY, hp.radius * 2 + pulse);
        hpGlow.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
        hpGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = hpGlow;
        ctx.beginPath();
        ctx.arc(hp.x, renderY, hp.radius * 2 + pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Quả cầu máu gradient
        const hpGrad = ctx.createRadialGradient(hp.x - 1, renderY - 1, 0, hp.x, renderY, hp.radius + 1);
        hpGrad.addColorStop(0, '#fca5a5');
        hpGrad.addColorStop(0.5, '#ef4444');
        hpGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = hpGrad;
        ctx.beginPath();
        ctx.arc(hp.x, renderY, hp.radius + pulse * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Dấu thập trắng phát sáng
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 3; ctx.shadowColor = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hp.x - 4, renderY);
        ctx.lineTo(hp.x + 4, renderY);
        ctx.moveTo(hp.x, renderY - 4);
        ctx.lineTo(hp.x, renderY + 4);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // --- VẼ RELIC RƠI TỪ RƯƠNG ---
      relicPickups.forEach(item => {
        const renderY = item.y + (item.z || 0);
        const color = '#f472b6';
        const pulse = Math.abs(Math.sin(performance.now() / 200)) * 5;
        const spin = performance.now() / 600;
        
        ctx.shadowBlur = 12 + pulse;
        ctx.shadowColor = color;
        
        // Khung tròn gradient
        const relicGrad = ctx.createRadialGradient(item.x, renderY, 0, item.x, renderY, item.radius + 3);
        relicGrad.addColorStop(0, '#1e1b4b');
        relicGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = relicGrad;
        ctx.beginPath();
        ctx.arc(item.x, renderY, item.radius + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Ký hiệu rune xoay
        ctx.save();
        ctx.translate(item.x, renderY);
        ctx.rotate(spin);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // --- VẼ VŨ KHÍ RƠI TRÊN ĐẤT (GROUND WEAPONS) ---
      groundWeapons.forEach(gw => {
        const renderY = gw.y + (gw.z || 0);
        // Ánh sáng aura nhẹ dưới đất
        ctx.shadowBlur = 10;
        ctx.shadowColor = gw.weapon.color || '#fff';
        ctx.fillStyle = gw.weapon.color || '#cbd5e1';

        ctx.save();
        ctx.translate(gw.x, renderY + Math.sin(performance.now() / 200) * 3); // Trôi nổi nhấp nhô

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
        // Vẽ cảnh báo dịch chuyển (Telegraph)
        if (enemy.dashState === 'warning' && enemy.dashTargetX !== undefined && enemy.dashTargetY !== undefined && enemy.hp > 0) {
          let endX = enemy.dashTargetX;
          let endY = enemy.dashTargetY;
          
          if (enemy.aiPattern === 'dash_attack') {
            // Đối với dash attack, dashTargetX/Y là vector hướng (dx, dy)
            const dashDistance = 400; // Độ dài đường cảnh báo
            endX = enemy.x + enemy.dashTargetX * dashDistance;
            endY = enemy.y + enemy.dashTargetY * dashDistance;
          }

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(enemy.x, enemy.y);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)'; // Đỏ cảnh báo
          ctx.lineWidth = enemy.aiPattern === 'dash_attack' ? 24 : 2; // Dash thì vẽ đường bự
          
          if (enemy.aiPattern === 'teleport_attack') {
            ctx.lineWidth = 2;
            ctx.lineDashOffset = -performance.now() / 20;
          } else {
            // Hiệu ứng vạch trượt báo hiệu lướt tới
            const gradient = ctx.createLinearGradient(enemy.x, enemy.y, endX, endY);
            gradient.addColorStop(0, 'rgba(220, 38, 38, 0)');
            gradient.addColorStop(1, 'rgba(220, 38, 38, 0.4)');
            ctx.strokeStyle = gradient;
          }
          ctx.stroke();

          // Vẽ điểm đến
          if (enemy.aiPattern === 'teleport_attack') {
            ctx.beginPath();
            ctx.arc(endX, endY, enemy.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(159, 18, 57, 0.2)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(159, 18, 57, 0.6)';
            ctx.setLineDash([]);
            ctx.stroke();
          }
          ctx.restore();
        }

        if (enemy.hp <= 0) {
          // --- VẼ XÁC CHẾT TÀN KHỐC (GORE DEATH) ---
          ctx.save();
          ctx.translate(enemy.x, enemy.y);
          
          // Bóng máu (Blood pool under corpse)
          ctx.fillStyle = 'rgba(69, 10, 10, 0.8)';
          ctx.beginPath(); ctx.ellipse(0, 0, enemy.radius * 1.5, enemy.radius * 0.8, 0, 0, Math.PI * 2); ctx.fill();
          
          // Các mảng xác thịt rời rạc vương vãi
          ctx.fillStyle = '#7f1d1d'; // Đỏ thịt
          ctx.beginPath(); ctx.arc(-5, -5, enemy.radius * 0.4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(6, 4, enemy.radius * 0.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-2, 6, enemy.radius * 0.3, 0, Math.PI * 2); ctx.fill();
          
          // Xương xẩu lòi ra
          ctx.fillStyle = '#e4e4e7';
          ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-12, -10); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(4, 2); ctx.lineTo(10, 6); ctx.stroke();
          
          ctx.restore();
          return;
        }

        const isStunned = enemy.statusEffects.includes('stunned');
        const bounce = (enemy as any).isJumping ? Math.sin(performance.now() / 80) * 15 : 0;

        // --- BÓNG ĐỔ ĐỘNG (DYNAMIC SHADOWS) CỦA KẺ ĐỊCH ---
        if (player) {
          const angleToLight = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          const distToLight = Math.hypot(enemy.x - player.x, enemy.y - player.y);
          
          ctx.save();
          // Chân quái vật luôn ở enemy.y + enemy.radius
          ctx.translate(enemy.x, enemy.y + enemy.radius); 
          ctx.rotate(angleToLight);
          
          const shadowStretch = Math.min(3.5, 1 + distToLight / 250);
          const shadowAlpha = Math.max(0.1, 0.6 - (distToLight / 1200));
          
          const shadowGrad = ctx.createLinearGradient(0, 0, enemy.radius * 2 * shadowStretch, 0);
          shadowGrad.addColorStop(0, `rgba(0,0,0,${shadowAlpha})`);
          shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.fillStyle = shadowGrad;
          ctx.beginPath();
          // Thu nhỏ chiều rộng bóng đổ (width = 8) do thiết kế quái đã thon gọn hơn
          ctx.ellipse(8 * shadowStretch, 0, 8 * shadowStretch, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        drawMonster(ctx, enemy, isStunned, bounce);

        // Thanh HP nhỏ trên đầu quái
        if (enemy.hp < enemy.maxHp && enemy.hp > 0) {
          const hpW = enemy.radius * 2;
          const hpH = 4;
          const hpx = enemy.x - enemy.radius;
          const hpy = enemy.y - enemy.radius - 12;

          ctx.save();
          // Khung viền thanh máu
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(hpx - 1, hpy - 1, hpW + 2, hpH + 2);
          
          // Lõi máu
          const pct = Math.max(0, enemy.hp / enemy.maxHp);
          const grad = ctx.createLinearGradient(hpx, 0, hpx + hpW, 0);
          grad.addColorStop(0, '#7f1d1d');
          grad.addColorStop(1, '#ef4444');
          
          ctx.fillStyle = grad;
          ctx.fillRect(hpx, hpy, hpW * pct, hpH);
          
          // Ánh sáng nổi (Highlights)
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(hpx, hpy, hpW * pct, hpH/2);
          
          ctx.restore();
        }
      });

      // --- VẼ SIÊU BOSS (NẾU CÓ) ---
      if (activeBossInstance && activeBossInstance.state !== 'death') {
        activeBossInstance.render(ctx, false);
      }

      // --- VẼ ĐỒNG MINH (ALLIES) ---
      allies.forEach(ally => {
        const bounce = Math.sin(performance.now() / 150) * 4;
        drawMonster(ctx, ally, false, bounce);
      });

      // --- DUST PARTICLES QUANH CHÂN PLAYER ---
      if (player && (Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1)) {
        if (Math.random() > 0.7) {
          footstepParticles.push({
            x: player.x + (Math.random() - 0.5) * 10,
            y: player.y + player.radius + (Math.random() - 0.5) * 5,
            life: 30, maxLife: 30,
            size: 2 + Math.random() * 4,
            vx: -player.vx * 0.2 + (Math.random() - 0.5) * 0.5,
            vy: -player.vy * 0.2 + (Math.random() - 0.5) * 0.5 - 0.2
          });
        }
      }

      for (let i = footstepParticles.length - 1; i >= 0; i--) {
        const p = footstepParticles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.life <= 0) {
          footstepParticles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(100, 90, 80, ${p.life / p.maxLife * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
      }

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
          // Đạn ma thuật / Đạn quái vật dạng khối vuông gai góc
          const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
          ctx.fillStyle = proj.color;
          
          if (speed > 1) {
            // Đuôi đạn (Trail) dạng đứt đoạn vuông
            ctx.globalAlpha = 0.4;
            ctx.fillRect(proj.x - proj.vx, proj.y - proj.vy, proj.radius*2, proj.radius*2);
            ctx.globalAlpha = 0.2;
            ctx.fillRect(proj.x - proj.vx*2, proj.y - proj.vy*2, proj.radius*2, proj.radius*2);
            ctx.globalAlpha = 1.0;
          }

          // Thân đạn chính (Vuông)
          ctx.fillRect(proj.x - proj.radius, proj.y - proj.radius, proj.radius*2, proj.radius*2);
          
          // Thêm gai vuông nhỏ chỉa ra
          ctx.fillRect(proj.x - proj.radius/2, proj.y - proj.radius - 2, proj.radius, 2);
          ctx.fillRect(proj.x - proj.radius/2, proj.y + proj.radius, proj.radius, 2);
          ctx.fillRect(proj.x - proj.radius - 2, proj.y - proj.radius/2, 2, proj.radius);
          ctx.fillRect(proj.x + proj.radius, proj.y - proj.radius/2, 2, proj.radius);
        }
      });

      // --- VẼ HẠT VFX (PARTICLES) ---
      particles.forEach(p => {
        // Frustum Culling cho Hạt VFX
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        if (p.x < cameraX - 100 || p.x > cameraX + screenW + 100 ||
            p.y < cameraY - 100 || p.y > cameraY + screenH + 100) {
          return;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        
        if (p.type === 'slash_trail') {
          // Vẽ vệt chém (Weapon Trail) hình bán nguyệt mượt mà
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle || 0);
          
          ctx.shadowBlur = 15;
          ctx.shadowColor = p.color;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 4 * p.alpha; // Mỏng dần khi mờ
          ctx.lineCap = 'round';
          
          ctx.beginPath();
          // Arc vung từ -60 độ đến +60 độ (như lúc đánh)
          ctx.arc(0, 0, p.radius, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
          
          ctx.restore();
        } else if (p.type === 'limb_piece') {
          // Khúc tay/chân bị đứt rời
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle || 0);
          
          // Bóng máu phía dưới
          ctx.fillStyle = 'rgba(69, 10, 10, 0.4)';
          ctx.beginPath(); ctx.ellipse(0, 0, p.radius*1.5, p.radius, 0, 0, Math.PI*2); ctx.fill();

          // Xương lòi ra
          ctx.strokeStyle = '#e4e4e7'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-p.radius, 0); ctx.lineTo(-p.radius - 3, -2); ctx.stroke();
          
          // Khúc thịt
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.roundRect(-p.radius, -p.radius/2, p.radius*2, p.radius, 2); ctx.fill();
          
          // Đầu cắt rỉ máu
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath(); ctx.arc(-p.radius, 0, p.radius/1.5, 0, Math.PI*2); ctx.fill();

          ctx.restore();
        } else {
          // Hạt bay bình thường
          ctx.save();
          ctx.translate(p.x, p.y);
          // Xoay hạt văng để tạo sự hỗn loạn
          ctx.rotate(p.x + p.y); 
          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
          ctx.restore();
        }
      });
      ctx.globalAlpha = 1.0; // Reset alpha

      // --- VẼ CỘT ĐÁ (PILLARS 3D) & BÓNG ĐỔ (DYNAMIC SHADOWS) ---
      if (currentRoom?.pillars && player) {
        currentRoom.pillars.forEach(pillar => {
          // 1. Tính toán Bóng Đổ (Shadow) — gradient fade
          const angleToPillar = Math.atan2(pillar.y - player.y, pillar.x - player.x);
          
          const shadowAngle1 = angleToPillar - Math.PI / 2;
          const shadowAngle2 = angleToPillar + Math.PI / 2;
          
          const p1x = pillar.x + Math.cos(shadowAngle1) * pillar.radius;
          const p1y = pillar.y + Math.sin(shadowAngle1) * pillar.radius;
          const p2x = pillar.x + Math.cos(shadowAngle2) * pillar.radius;
          const p2y = pillar.y + Math.sin(shadowAngle2) * pillar.radius;
          
          const SHADOW_LENGTH = 2000;
          const p3x = p2x + Math.cos(angleToPillar) * SHADOW_LENGTH;
          const p3y = p2y + Math.sin(angleToPillar) * SHADOW_LENGTH;
          const p4x = p1x + Math.cos(angleToPillar) * SHADOW_LENGTH;
          const p4y = p1y + Math.sin(angleToPillar) * SHADOW_LENGTH;

          ctx.fillStyle = '#050505';
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineTo(p3x, p3y);
          ctx.lineTo(p4x, p4y);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1.0;

          // 2. Vẽ Cột Đá 3D (Cylindrical Pillar)
          const pr = pillar.radius;
          
          // Bóng nền cột
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.beginPath();
          ctx.ellipse(pillar.x + 8, pillar.y + 8, pr, pr, 0, 0, Math.PI * 2);
          ctx.fill();

          // Mặt bên cột (Gradient trụ 3D)
          const pillarGrad = ctx.createLinearGradient(pillar.x - pr, pillar.y, pillar.x + pr, pillar.y);
          pillarGrad.addColorStop(0, '#0a0a0a');
          pillarGrad.addColorStop(0.3, '#3f3f46');
          pillarGrad.addColorStop(0.5, '#52525b'); // Specular highlight
          pillarGrad.addColorStop(0.7, '#3f3f46');
          pillarGrad.addColorStop(1, '#0a0a0a');
          
          ctx.fillStyle = pillarGrad;
          ctx.beginPath();
          ctx.ellipse(pillar.x, pillar.y, pr, pr, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Viền cột
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Vòng đai trang trí trên cột
          ctx.strokeStyle = '#27272a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(pillar.x, pillar.y - pr * 0.5, pr * 0.9, pr * 0.15, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(pillar.x, pillar.y + pr * 0.5, pr * 0.9, pr * 0.15, 0, 0, Math.PI * 2);
          ctx.stroke();
          
          // Đỉnh cột sáng hơn (specular)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.beginPath();
          ctx.ellipse(pillar.x - pr * 0.2, pillar.y - pr * 0.2, pr * 0.5, pr * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // --- ĐUỐC TREO TƯỜNG (WALL TORCHES) ---
      if (currentRoom) {
        const torchPositions = [
          { x: WALL_THICKNESS + 30, y: ROOM_HEIGHT * 0.25 },
          { x: WALL_THICKNESS + 30, y: ROOM_HEIGHT * 0.75 },
          { x: ROOM_WIDTH - WALL_THICKNESS - 30, y: ROOM_HEIGHT * 0.25 },
          { x: ROOM_WIDTH - WALL_THICKNESS - 30, y: ROOM_HEIGHT * 0.75 },
        ];
        const tNow = performance.now();
        torchPositions.forEach(tp => {
          const flicker = Math.sin(tNow / 80 + tp.x) * 3 + Math.cos(tNow / 50 + tp.y) * 2;
          
          // Hào quang lửa
          const torchGlow = ctx.createRadialGradient(tp.x, tp.y - 10, 0, tp.x, tp.y - 10, 60 + flicker);
          torchGlow.addColorStop(0, 'rgba(251, 191, 36, 0.15)');
          torchGlow.addColorStop(0.5, 'rgba(234, 88, 12, 0.06)');
          torchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = torchGlow;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y - 10, 60 + flicker, 0, Math.PI * 2);
          ctx.fill();
          
          // Giá đuốc
          ctx.fillStyle = '#44403c';
          ctx.fillRect(tp.x - 2, tp.y - 5, 4, 15);
          
          // Ngọn lửa
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(tp.x - 4, tp.y - 5);
          ctx.quadraticCurveTo(tp.x, tp.y - 18 - flicker, tp.x + 4, tp.y - 5);
          ctx.fill();
          
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(tp.x - 2, tp.y - 5);
          ctx.quadraticCurveTo(tp.x, tp.y - 12 - flicker * 0.5, tp.x + 2, tp.y - 5);
          ctx.fill();
        });
      }

      // --- AMBIENT BIOME PARTICLES ---
      if (currentRoom) {
        const tNow = performance.now();
        if (biome === 'blood') {
          // Máu nhỏ giọt từ trần
          for (let i = 0; i < 8; i++) {
            const seed = Math.sin(i * 1234.567 + tNow * 0.001) * 0.5 + 0.5;
            const dx = seed * ROOM_WIDTH;
            const dy = (tNow * 0.03 + i * 200) % ROOM_HEIGHT;
            ctx.fillStyle = `rgba(127, 29, 29, ${0.4 + seed * 0.3})`;
            ctx.beginPath();
            ctx.ellipse(dx, dy, 1.5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (biome === 'volcano') {
          // Tàn lửa bay
          for (let i = 0; i < 12; i++) {
            const seed = Math.sin(i * 567.89);
            const ex = (seed * 0.5 + 0.5) * ROOM_WIDTH;
            const ey = ROOM_HEIGHT - ((tNow * 0.05 + i * 150) % ROOM_HEIGHT);
            const size = 1.5 + Math.abs(seed) * 2;
            ctx.fillStyle = `rgba(249, 115, 22, ${0.5 + Math.sin(tNow / 100 + i) * 0.3})`;
            ctx.beginPath();
            ctx.arc(ex + Math.sin(tNow / 200 + i) * 10, ey, size, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (biome === 'ice') {
          // Tuyết rơi
          for (let i = 0; i < 15; i++) {
            const seed = Math.sin(i * 345.678);
            const sx = ((seed * 0.5 + 0.5) * ROOM_WIDTH + tNow * 0.01 * (i % 3 + 1)) % ROOM_WIDTH;
            const sy = (tNow * 0.02 + i * 120) % ROOM_HEIGHT;
            ctx.fillStyle = `rgba(186, 230, 253, ${0.3 + Math.abs(seed) * 0.4})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 1 + Math.abs(seed) * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (biome === 'moss') {
          // Bào tử bay
          for (let i = 0; i < 10; i++) {
            const seed = Math.sin(i * 789.01);
            const mx = ((seed * 0.5 + 0.5) * ROOM_WIDTH + Math.sin(tNow / 500 + i) * 30) % ROOM_WIDTH;
            const my = ((Math.abs(Math.cos(i * 234.5)) * ROOM_HEIGHT + tNow * 0.01) % ROOM_HEIGHT);
            ctx.fillStyle = `rgba(74, 222, 128, ${0.2 + Math.abs(seed) * 0.3})`;
            ctx.beginPath();
            ctx.arc(mx, my, 1.5 + Math.abs(seed), 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Dungeon — hạt bụi lơ lửng
          for (let i = 0; i < 8; i++) {
            const seed = Math.sin(i * 456.78);
            const dx = ((seed * 0.5 + 0.5) * ROOM_WIDTH + Math.sin(tNow / 800 + i) * 20);
            const dy = ((Math.abs(Math.cos(i * 123.4)) * ROOM_HEIGHT + tNow * 0.008) % ROOM_HEIGHT);
            ctx.fillStyle = `rgba(120, 113, 108, ${0.15 + Math.abs(seed) * 0.15})`;
            ctx.beginPath();
            ctx.arc(dx, dy, 1 + Math.abs(seed), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // === VẼ CHỮ SÁT THƯƠNG (Damage Numbers) ===
      damageNumbers.forEach(dn => {
        const age = performance.now() - dn.createdAt;
        const lifeRatio = Math.max(0, Math.min(1, age / dn.lifespan));
        
        // Hiệu ứng Pop & Fade
        let scale = 1.0;
        if (lifeRatio < 0.1) {
          scale = 0.5 + (lifeRatio / 0.1) * 1.0; // Phình to lên 1.5
        } else if (lifeRatio < 0.2) {
          scale = 1.5 - ((lifeRatio - 0.1) / 0.1) * 0.5; // Thu nhỏ lại 1.0
        }
        
        let alpha = 1.0;
        if (lifeRatio > 0.7) {
          alpha = 1.0 - ((lifeRatio - 0.7) / 0.3); // Mờ dần về 0
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(dn.x, dn.y);
        ctx.scale(scale, scale);

        ctx.fillStyle = dn.color;
        // Đổi font sát thương sang Oswald cho nổi bật
        ctx.font = dn.isCrit ? 'bold 24px "Oswald", sans-serif' : 'bold 16px "Oswald", sans-serif';
        ctx.textAlign = 'center';
        
        // Rung lắc nếu là chí mạng
        const jitterX = dn.isCrit ? (Math.random() - 0.5) * 4 : 0;
        const jitterY = dn.isCrit ? (Math.random() - 0.5) * 4 : 0;
        
        // Tạo viền đen nhám
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        
        const displayString = dn.text ? dn.text : (dn.value.toString() + (dn.isCrit ? '!' : ''));
        ctx.strokeText(displayString, jitterX, jitterY);
        ctx.fillText(displayString, jitterX, jitterY);
        
        ctx.restore();
      });

      ctx.restore();

      // --- VẼ LỚP PHỦ ATMOSPHERE (VIGNETTE & NOISE/GRAIN) ---
      if (canvas) {
        const { player, projectiles } = useEntityStore.getState();
        const sanity = player?.sanity ?? 100;
        const isPanic = sanity < 30;

        // 1. Vẽ Vignette (Viền đen ám) - Bóng tối bao trùm
        // Nếu hoảng loạn, bóng tối khép chặt hơn, nhịp đập nhanh hơn
        const heartbeat = isPanic ? Math.sin(performance.now() / 150) * 0.05 : Math.sin(performance.now() / 500) * 0.02;
        const innerRadius = canvas.height * (isPanic ? 0.1 : 0.2) * (1 + heartbeat);
        const outerRadius = canvas.height * (isPanic ? 0.5 : 0.8) * (1 + heartbeat);

        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, innerRadius,
          canvas.width / 2, canvas.height / 2, outerRadius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.5, isPanic ? 'rgba(30, 0, 0, 0.7)' : 'rgba(10, 5, 5, 0.4)');
        gradient.addColorStop(1, isPanic ? 'rgba(30, 0, 0, 0.98)' : 'rgba(5, 5, 5, 0.9)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. DYNAMIC POINT LIGHTS (Sử dụng 'lighter' blend mode)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Ánh sáng lờ mờ toả ra từ người chơi
        const playerLightGrad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, 100
        );
        playerLightGrad.addColorStop(0, player?.weapons?.[player?.activeWeaponIndex || 0]?.type === 'magic' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(250, 204, 21, 0.1)');
        playerLightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = playerLightGrad;
        ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 - 100, 200, 200);

        // Ánh sáng từ Projectiles
        projectiles.forEach(p => {
          if (p.owner === 'player') {
            const screenX = p.x - cameraX;
            const screenY = p.y - cameraY;
            // Chỉ render nếu nằm trong màn hình
            if (screenX > -50 && screenX < canvas.width + 50 && screenY > -50 && screenY < canvas.height + 50) {
              const pLightGrad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 60);
              pLightGrad.addColorStop(0, 'rgba(250, 204, 21, 0.6)'); // Core vàng chói
              pLightGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)'); // Lan toả đỏ
              pLightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = pLightGrad;
              ctx.fillRect(screenX - 60, screenY - 60, 120, 120);
            }
          }
        });
        ctx.restore();

        // 3. Vẽ Film Grain / Dots ngẫu nhiên (Giả lập đồ hoạ nhiễu hạt)
        const redDots = isPanic ? 150 : 40;
        ctx.fillStyle = isPanic ? 'rgba(153, 27, 27, 0.25)' : 'rgba(69, 10, 10, 0.15)'; // Nhiễu ám đỏ (máu)
        for (let i = 0; i < redDots; i++) {
          const rx = Math.random() * canvas.width;
          const ry = Math.random() * canvas.height;
          const size = Math.random() * (isPanic ? 5 : 3) + 1;
          ctx.fillRect(rx, ry, size, size);
        }
        
        const grayDots = isPanic ? 200 : 80;
        ctx.fillStyle = 'rgba(28, 25, 23, 0.2)'; // Nhiễu xám tro
        for (let i = 0; i < grayDots; i++) {
          const rx = Math.random() * canvas.width;
          const ry = Math.random() * canvas.height;
          const size = Math.random() * 2 + 1;
          ctx.fillRect(rx, ry, size, size);
        }

        // --- HỆ THỐNG THỜI TIẾT (MƯA MÁU) ---
        ctx.save();
        ctx.globalAlpha = isPanic ? 0.8 : 0.2;
        ctx.strokeStyle = 'rgba(153, 27, 27, 0.5)'; // Đỏ sẫm
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 60; i++) {
          const rainX = (Math.random() * canvas.width * 1.5) - (performance.now() / 10) % canvas.width;
          const rainY = (Math.random() * canvas.height * 1.5) + (performance.now() / 2) % canvas.height;
          // Vẽ tia mưa xéo 
          ctx.moveTo(rainX % canvas.width, rainY % canvas.height);
          ctx.lineTo((rainX % canvas.width) - 15, (rainY % canvas.height) + 30);
        }
        ctx.stroke();
        
        // Mưa xa (nhỏ hơn, mờ hơn, rơi chậm hơn)
        ctx.globalAlpha = isPanic ? 0.5 : 0.1;
        ctx.strokeStyle = 'rgba(120, 20, 20, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 100; i++) {
          const rainX = (Math.random() * canvas.width * 1.5) - (performance.now() / 15) % canvas.width;
          const rainY = (Math.random() * canvas.height * 1.5) + (performance.now() / 4) % canvas.height;
          ctx.moveTo(rainX % canvas.width, rainY % canvas.height);
          ctx.lineTo((rainX % canvas.width) - 10, (rainY % canvas.height) + 20);
        }
        ctx.stroke();
        ctx.restore();

        // 4. Hiệu ứng xước viền (Dirt Lens / Scratches)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
          const startX = Math.random() * canvas.width;
          const startY = Math.random() > 0.5 ? Math.random() * 50 : canvas.height - Math.random() * 50;
          const len = Math.random() * 100 + 20;
          const ang = Math.random() * Math.PI;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + Math.cos(ang) * len, startY + Math.sin(ang) * len);
          ctx.stroke();
        }
      }

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
