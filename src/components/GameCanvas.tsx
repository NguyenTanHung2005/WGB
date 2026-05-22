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

  ctx.rotate(enemy.angle);

  ctx.fillStyle = isStunned ? '#67e8f9' : (enemy.color || '#ef4444');

  if (enemy.templateId === 'melee_goblin') {
    // Cultist
    ctx.fillRect(-enemy.radius * 0.8, -enemy.radius * 0.8 + bounce, enemy.radius * 1.6, enemy.radius * 1.6);
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-enemy.radius * 0.9, -enemy.radius * 0.9 + bounce, enemy.radius * 1.8, enemy.radius * 0.8);
    ctx.fillStyle = '#fff';
    ctx.fillRect(enemy.radius * 0.2, -enemy.radius * 0.4 + bounce, 3, 3);
    ctx.fillRect(enemy.radius * 0.2, enemy.radius * 0.2 + bounce, 3, 3);
    
    // Dao gỉ
    ctx.fillStyle = '#52525b';
    ctx.save();
    ctx.translate(enemy.radius * 0.8, enemy.radius * 0.6 + bounce);
    ctx.rotate(Math.PI / 4 + Math.sin(performance.now() / 200) * 0.2);
    ctx.fillRect(-2, -15, 4, 20);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-4, -5, 8, 4);
    ctx.restore();

  } else if (enemy.templateId === 'ranged_skeleton' || enemy.templateId === 'melee_skeleton') {
    // Shattered Skeleton
    ctx.fillStyle = isStunned ? '#67e8f9' : '#d4d4d8';
    
    // Xương sọ
    ctx.fillRect(-enemy.radius * 0.6, -enemy.radius * 0.6 + bounce, enemy.radius * 1.2, enemy.radius * 1.2);
    // Hốc mắt rỗng
    ctx.fillStyle = '#000';
    ctx.fillRect(enemy.radius * 0.1, -enemy.radius * 0.4 + bounce, 4, 4);
    ctx.fillRect(enemy.radius * 0.1, enemy.radius * 0.2 + bounce, 4, 4);
    // Đốm sáng
    ctx.fillStyle = enemy.templateId === 'ranged_skeleton' ? '#ef4444' : '#38bdf8';
    ctx.fillRect(enemy.radius * 0.2, -enemy.radius * 0.3 + bounce, 2, 2);
    ctx.fillRect(enemy.radius * 0.2, enemy.radius * 0.3 + bounce, 2, 2);

    if (enemy.templateId === 'melee_skeleton') {
      ctx.fillStyle = '#52525b';
      ctx.save();
      ctx.translate(enemy.radius * 0.7, enemy.radius * 0.5 + bounce);
      ctx.rotate(Math.PI / 4 + Math.sin(performance.now() / 200) * 0.1);
      ctx.fillRect(-2, -20, 4, 30);
      ctx.restore();
    } else {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(enemy.radius, -8 + bounce, 4, 16);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(enemy.radius, -8 + bounce, 1, 16);
    }

  } else if (enemy.templateId === 'suicide_bat') {
    // Floating Tumor
    const sizeOffset = Math.sin(performance.now() / 100) * 4;
    ctx.fillStyle = isStunned ? '#67e8f9' : '#991b1b';
    ctx.fillRect(-enemy.radius - sizeOffset/2, -enemy.radius - sizeOffset/2, enemy.radius * 2 + sizeOffset, enemy.radius * 2 + sizeOffset);
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-enemy.radius * 0.5, -enemy.radius * 0.5, enemy.radius, enemy.radius);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(enemy.radius * 0.3, -enemy.radius * 0.2, 3, 3);

  } else if (enemy.templateId === 'necromancer') {
    // Lich
    const floatY = Math.sin(performance.now() / 300) * 4;
    ctx.fillStyle = isStunned ? '#67e8f9' : '#1e1b4b';
    ctx.fillRect(-enemy.radius, -enemy.radius + floatY, enemy.radius * 2, enemy.radius * 2.5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-enemy.radius * 0.8, -enemy.radius * 0.8 + floatY, enemy.radius * 1.6, enemy.radius * 1.6);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(enemy.radius * 0.2, -enemy.radius * 0.4 + floatY, 4, 4);
    ctx.fillRect(enemy.radius * 0.2, enemy.radius * 0.2 + floatY, 4, 4);

    ctx.fillStyle = '#451a03';
    ctx.save();
    ctx.translate(enemy.radius * 0.5, enemy.radius * 0.8 + floatY);
    ctx.rotate(Math.PI / 4 + Math.sin(performance.now() / 400) * 0.1);
    ctx.fillRect(-2, -30, 4, 40);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(-4, -34, 8, 8);
    ctx.restore();

  } else if (enemy.templateId === 'spirit_wolf') {
    // Khối linh hồn chó sói (Ghoul)
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = enemy.color || '#2dd4bf';
    ctx.fillRect(-enemy.radius, -enemy.radius * 0.6 + bounce, enemy.radius * 2.2, enemy.radius * 1.2);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(enemy.radius * 0.5, -enemy.radius * 0.3 + bounce, 4, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(enemy.radius * 0.6, -enemy.radius * 0.2 + bounce, 2, 2);
    ctx.globalAlpha = 1.0;

  } else if (enemy.templateId === 'fairy') {
    // Tinh linh hắc ám (Wisp/Soul)
    const flap = Math.sin(performance.now() / 30) * 5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = enemy.color || '#fef08a';
    ctx.fillStyle = enemy.color || '#fef08a';
    ctx.fillRect(-enemy.radius, -enemy.radius + bounce, enemy.radius * 2, enemy.radius * 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-enemy.radius * 0.5, -enemy.radius * 0.5 + bounce, enemy.radius, enemy.radius);
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(-enemy.radius * 1.5, -enemy.radius * 0.5 + bounce - flap, enemy.radius, enemy.radius);
    ctx.fillRect(enemy.radius * 0.5, -enemy.radius * 0.5 + bounce - flap, enemy.radius, enemy.radius);
    ctx.shadowBlur = 0;

  } else if (enemy.templateId === 'grand_slime') {
    // Amalgamation
    const isEnraged = enemy.hp < enemy.maxHp * 0.5;
    const stretch = Math.sin(performance.now() / 150) * 4;
    
    ctx.fillStyle = isStunned ? '#67e8f9' : (isEnraged ? '#7f1d1d' : '#4c0519');
    ctx.fillRect(-enemy.radius - stretch, -enemy.radius + stretch + bounce, enemy.radius * 2 + stretch * 2, enemy.radius * 2 - stretch * 2);
    
    // Thêm các mảng thịt lồi lõm
    ctx.fillStyle = isEnraged ? '#991b1b' : '#7f1d1d';
    ctx.fillRect(-enemy.radius * 0.8, -enemy.radius * 1.2 + bounce, enemy.radius * 1.6, enemy.radius * 0.5);
    ctx.fillRect(-enemy.radius * 1.2, -enemy.radius * 0.5 + bounce, enemy.radius * 0.5, enemy.radius * 1.2);

    // Mắt chằng chịt
    const numEyes = isEnraged ? 8 : 4;
    ctx.fillStyle = '#0f172a';
    for(let i=0; i<numEyes; i++) {
      const ex = Math.sin(i * Math.PI/numEyes) * enemy.radius * 0.6;
      const ey = Math.cos(i * Math.PI/numEyes) * enemy.radius * 0.6 + bounce;
      ctx.fillRect(ex, ey, 8, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(ex+2, ey+2, 4, 4);
      ctx.fillStyle = '#0f172a';
    }

    if (isEnraged) {
      ctx.fillStyle = '#000';
      ctx.fillRect(enemy.radius * 0.4, -10 + bounce, 16, 20);
      ctx.fillStyle = '#fff'; // Răng
      ctx.fillRect(enemy.radius * 0.4, -10 + bounce, 4, 4);
      ctx.fillRect(enemy.radius * 0.4, 6 + bounce, 4, 4);
      ctx.fillRect(enemy.radius * 0.8, -10 + bounce, 4, 4);
      ctx.fillRect(enemy.radius * 0.8, 6 + bounce, 4, 4);
    }
  } else {
    // Fallback block
    ctx.fillRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
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

    const currentRoom = rooms.find(r => r.id === currentRoomId);

    let lastHoveredId: string | null = null;

    const render = () => {
      const state = useEntityStore.getState();
      const {
        player, enemies, allies, projectiles, particles, damageNumbers,
        chests, shrines, shopItems, anvils, goldPickups, healthPickups, relicPickups,
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
        const trapSize = trap.radius * 2;
        const tx = trap.x - trap.radius;
        const ty = trap.y - trap.radius;

        ctx.fillStyle = '#1c1917'; // Xám rỉ sét
        ctx.fillRect(tx, ty, trapSize, trapSize);
        ctx.strokeStyle = '#0c0a09';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, trapSize, trapSize);

        if (trap.active) {
          ctx.fillStyle = '#7f1d1d'; // Gai đẫm máu
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              ctx.fillRect(tx + 6 + i * 15, ty + 6 + j * 15, 6, 6);
            }
          }
        } else {
          ctx.fillStyle = '#000';
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              ctx.fillRect(tx + 8 + i * 15, ty + 8 + j * 15, 2, 2);
            }
          }
        }
      });

      // --- VẼ TƯỜNG PHÒNG (WALLS) ---
      ctx.fillStyle = '#1c1917'; // Rỉ sét tối
      ctx.strokeStyle = '#292524'; // Viền đen nhám
      ctx.lineWidth = 4;

      const gateMinX = ROOM_WIDTH / 2 - GATE_WIDTH / 2;
      const gateMinY = ROOM_HEIGHT / 2 - GATE_WIDTH / 2;
      const isLocked = currentRoom?.state === 'combat_lock';

      ctx.fillRect(0, 0, ROOM_WIDTH, WALL_THICKNESS);
      ctx.strokeRect(0, 0, ROOM_WIDTH, WALL_THICKNESS);
      ctx.fillRect(0, ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH, WALL_THICKNESS);
      ctx.strokeRect(0, ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH, WALL_THICKNESS);
      ctx.fillRect(0, 0, WALL_THICKNESS, ROOM_HEIGHT);
      ctx.strokeRect(0, 0, WALL_THICKNESS, ROOM_HEIGHT);
      ctx.fillRect(ROOM_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ROOM_HEIGHT);
      ctx.strokeRect(ROOM_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ROOM_HEIGHT);

      // --- VẼ CỬA PHÒNG (GATES) ---
      const drawGate = (gx: number, gy: number, w: number, h: number, hasGate: boolean, direction: string) => {
        if (!hasGate) {
          ctx.fillStyle = '#0c0a09';
          ctx.fillRect(gx, gy, w, h);
          return;
        }

        if (isLocked) {
          // Khóa bằng lưới máu đỏ tươi
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(gx, gy, w, h);
          ctx.fillStyle = '#000';
          if (direction === 'north' || direction === 'south') {
            for (let offset = 5; offset < w; offset += 15) {
              ctx.fillRect(gx + offset, gy, 4, h);
            }
          } else {
            for (let offset = 5; offset < h; offset += 15) {
              ctx.fillRect(gx, gy + offset, w, 4);
            }
          }
        } else {
          // Hành lang tối tăm
          ctx.fillStyle = '#000';
          ctx.fillRect(gx, gy, w, h);
        }
      };

      if (currentRoom) {
        drawGate(gateMinX, 0, GATE_WIDTH, WALL_THICKNESS, currentRoom.gates.north, 'north');
        drawGate(gateMinX, ROOM_HEIGHT - WALL_THICKNESS, GATE_WIDTH, WALL_THICKNESS, currentRoom.gates.south, 'south');
        drawGate(0, gateMinY, WALL_THICKNESS, GATE_WIDTH, currentRoom.gates.west, 'west');
        drawGate(ROOM_WIDTH - WALL_THICKNESS, gateMinY, WALL_THICKNESS, GATE_WIDTH, currentRoom.gates.east, 'east');
      }

      // --- VẼ BÀN THỜ HUYẾT NGẢI (CURSED ALTA / SHRINES) ---
      shrines.forEach(shrine => {
        const sr = shrine.radius;
        // Chân đế
        ctx.fillStyle = shrine.used ? '#1c1917' : '#450a0a';
        ctx.fillRect(shrine.x - sr, shrine.y - sr + 10, sr * 2, sr * 2 - 10);
        // Hộp sọ / Chậu máu
        ctx.fillStyle = shrine.used ? '#000' : (shrine.type === 'health' ? '#dc2626' : shrine.type === 'power' ? '#ea580c' : '#2563eb');
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
        ctx.fillText(shrine.type === 'health' ? 'H' : shrine.type === 'power' ? 'P' : 'D', shrine.x, shrine.y + sr * 0.8);
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
        ctx.fillStyle = anvil.used ? '#0c0a09' : '#292524';
        ctx.fillRect(anvil.x - 20, anvil.y - 10, 40, 20); // Base
        ctx.fillStyle = anvil.used ? '#000' : '#44403c';
        ctx.fillRect(anvil.x - 25, anvil.y - 18, 50, 8); // Đỉnh đe
        
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
        ctx.fillStyle = chest.opened ? '#450a0a' : '#991b1b'; // Màu máu khô / Máu tươi
        ctx.fillRect(chest.x - 18 - pulse, chest.y - 12 - pulse, 36 + pulse*2, 24 + pulse*2);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(chest.x - 14, chest.y - 8, 28, 16); // Lõi sẫm bên trong

        if (!chest.opened) {
          // Vân thịt đỏ dọc ngang
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(chest.x - 10 - pulse, chest.y - 12 - pulse, 4, 24 + pulse*2);
          ctx.fillRect(chest.x + 6 + pulse, chest.y - 12 - pulse, 4, 24 + pulse*2);
        } else {
          // Khi vỡ
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(chest.x - 20, chest.y + 10, 40, 4); // Nhầy nhụa dưới đất
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

      // --- VẼ RELIC RƠI TỪ RƯƠNG ---
      relicPickups.forEach(item => {
        let color = '#f472b6'; // Hồng mặc định

        // Hiệu ứng nhấp nháy cho vòng sáng
        const pulse = Math.abs(Math.sin(performance.now() / 200)) * 5;
        
        ctx.shadowBlur = 10 + pulse;
        ctx.shadowColor = color;
        
        // Vẽ khung tròn chứa relic
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset shadow

        // Vẽ biểu tượng mini
        ctx.fillStyle = color;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('R', item.x, item.y + 1); // R cho Relic
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
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        // Xoay hạt văng để tạo sự hỗn loạn
        ctx.rotate(p.x + p.y); 
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
      });
      ctx.globalAlpha = 1.0; // Reset alpha

      // --- VẼ SỐ SÁT THƯƠNG NỔI (DAMAGE NUMBERS) ---
      damageNumbers.forEach(dn => {
        ctx.fillStyle = dn.color;
        // Font kinh dị/máy đánh chữ
        ctx.font = dn.isCrit ? 'bold 18px "Courier New", monospace' : 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        
        // Rung lắc nếu là chí mạng
        const jitterX = dn.isCrit ? (Math.random() - 0.5) * 4 : 0;
        const jitterY = dn.isCrit ? (Math.random() - 0.5) * 4 : 0;
        
        // Tạo viền đen nhám
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        
        const displayString = dn.text ? dn.text : (dn.value.toString() + (dn.isCrit ? '!!!' : ''));
        ctx.strokeText(displayString, dn.x + jitterX, dn.y + jitterY);
        ctx.fillText(displayString, dn.x + jitterX, dn.y + jitterY);
      });

      ctx.restore();

      // --- VẼ LỚP PHỦ ATMOSPHERE (VIGNETTE & NOISE/GRAIN) ---
      if (canvas) {
        // 1. Vẽ Vignette (Viền đen ám)
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, canvas.height * 0.2,
          canvas.width / 2, canvas.height / 2, canvas.height * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(5, 5, 5, 0.85)'); // Cực kỳ tối ở viền

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Vẽ Film Grain / Dots ngẫu nhiên (Giả lập đồ hoạ nhiễu hạt)
        ctx.fillStyle = 'rgba(69, 10, 10, 0.15)'; // Nhiễu ám đỏ (máu)
        for (let i = 0; i < 40; i++) {
          const rx = Math.random() * canvas.width;
          const ry = Math.random() * canvas.height;
          const size = Math.random() * 3 + 1;
          ctx.fillRect(rx, ry, size, size);
        }
        
        ctx.fillStyle = 'rgba(28, 25, 23, 0.15)'; // Nhiễu xám tro
        for (let i = 0; i < 60; i++) {
          const rx = Math.random() * canvas.width;
          const ry = Math.random() * canvas.height;
          const size = Math.random() * 2 + 1;
          ctx.fillRect(rx, ry, size, size);
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
