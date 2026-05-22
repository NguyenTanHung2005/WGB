import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useEntityStore } from '../store/entityStore';
import { useMapStore } from '../store/mapStore';
import { CHARACTER_CLASSES } from '../data/classes';
import { WEAPONS } from '../data/weapons';
import { Shield, Heart, Flame, ArrowRight } from 'lucide-react';

export const MenuScreen: React.FC = () => {
  const { setPhase, setSelectedClassId } = useGameStore();
  const { setPlayer, clearRoomEntities, spawnRoomElements, addAlly } = useEntityStore();
  const { generateDungeon } = useMapStore();

  const handleSelectClass = (classId: string) => {
    const chosenClass = CHARACTER_CLASSES.find(c => c.id === classId);
    if (!chosenClass) return;

    setSelectedClassId(classId);
    generateDungeon();

    let defaultWeapons = [];
    const pistol = WEAPONS.find(w => w.id === 'rusty_pistol')!;
    if (classId === 'mage') {
      defaultWeapons = [WEAPONS.find(w => w.id === 'magic_staff')!, pistol];
    } else if (classId === 'rogue') {
      defaultWeapons = [WEAPONS.find(w => w.id === 'dagger')!, pistol];
    } else if (classId === 'archer') {
      defaultWeapons = [WEAPONS.find(w => w.id === 'wooden_bow')!, pistol];
    } else {
      defaultWeapons = [WEAPONS.find(w => w.id === 'broadsword')!, pistol];
    }

    setPlayer({
      id: chosenClass.id,
      type: 'player',
      x: 450,
      y: 350,
      radius: 18,
      vx: 0,
      vy: 0,
      hp: chosenClass.maxHp,
      maxHp: chosenClass.maxHp,
      shield: chosenClass.maxShield,
      maxShield: chosenClass.maxShield,
      speed: chosenClass.speed,
      angle: 0,
      activeWeaponIndex: 0,
      weapons: defaultWeapons,
      classId: chosenClass.id,
      statusEffects: [],
      lastAttackTime: 0,
      lastSkillUsedTime: 0
    });

    clearRoomEntities();
    spawnRoomElements('start');
    
    // Spawn Fairy Companion
    addAlly({
      id: 'fairy_companion',
      type: 'ally',
      x: 450 - 30,
      y: 350 - 30,
      radius: 6,
      vx: 0,
      vy: 0,
      hp: 9999,
      maxHp: 9999,
      speed: 4,
      angle: 0,
      aiPattern: 'follow',
      templateId: 'fairy',
      statusEffects: [],
      damage: 2,
      color: '#fef08a'
    });
    
    setPhase('playing');
  };

  return (
    <div className="menu-screen bg-[#050505] text-[#d1d5db]">
      <div className="menu-title font-serif text-[#991b1b] drop-shadow-[0_0_15px_rgba(153,27,27,0.8)]">Dungeon of Decay</div>
      <div className="menu-subtitle italic text-[#78716c] mb-6">Bạn là một linh hồn bị nguyền rủa, bị ném vào hầm ngục thối rữa này.<br/>Không có ánh sáng, chỉ có máu, bóng tối và sự mục nát vô tận...</div>

      <div className="class-grid">
        {CHARACTER_CLASSES.map(cls => (
          <div 
            key={cls.id}
            onClick={() => handleSelectClass(cls.id)}
            className="class-card"
          >
            <div>
              <div className="class-card-header">
                <span className={`class-badge badge-${cls.id}`}>
                  {cls.id}
                </span>
                <span className="class-select-indicator">
                  Chọn <ArrowRight style={{ width: '13px', height: '13px' }} />
                </span>
              </div>
              
              <h2 className="class-name">{cls.name}</h2>
              
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">
                    <Heart style={{ width: '13px', height: '13px', color: '#ef4444' }} /> Sinh lực (HP)
                  </span>
                  <span className="stat-val">{cls.maxHp}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">
                    <Shield style={{ width: '13px', height: '13px', color: '#22d3ee' }} /> Giáp thủ
                  </span>
                  <span className="stat-val">{cls.maxShield}</span>
                </div>
              </div>
            </div>

            <div className="skill-box">
              <div className="skill-header">
                <Flame style={{ width: '13px', height: '13px', color: '#fbbf24' }} /> Kỹ năng: {cls.skillName}
              </div>
              <p className="skill-desc">
                {cls.skillDescription}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <button 
          className="px-6 py-2 bg-[#7f1d1d]/80 hover:bg-[#991b1b]/90 text-[#fca5a5] rounded-none border border-[#b91c1c] font-serif uppercase tracking-widest transition-transform hover:scale-105 shadow-[0_0_10px_rgba(185,28,28,0.5)]"
          onClick={() => setPhase('cutscene_ending')}
        >
          👁️ Chấp nhận cái chết (Xem Cutscene)
        </button>
      </div>

      <div className="keybinds-footer">
        <div><span className="key-cap">WASD</span> Di chuyển</div>
        <div><span className="key-cap">Click chuột trái</span> Bắn liên thanh</div>
        <div><span className="key-cap">Q / Space</span> Đổi vũ khí</div>
        <div><span className="key-cap">E / Chuột phải</span> Kỹ năng đặc biệt</div>
        <div><span className="key-cap">F</span> Tương tác rương/shop</div>
      </div>
    </div>
  );
};
