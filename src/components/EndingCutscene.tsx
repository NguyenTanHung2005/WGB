import React, { useEffect, useState } from 'react';
import { useEntityStore } from '../store/entityStore';
import { useGameStore } from '../store/gameStore';

export const EndingCutscene: React.FC = () => {
  const { updatePlayer } = useEntityStore();
  const { setPhase } = useGameStore();
  
  // 0: standing, 1: fallen, 2: blacking_out, 3: opening_eyes, 4: flower_field
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Step 0: Nhân vật thở dốc (đứng yên)
    updatePlayer({ animState: 'idle', vx: 0, vy: 0 });

    const timeouts = [
      setTimeout(() => {
        // Step 1: Nhân vật gục ngã
        updatePlayer({ animState: 'dead' });
        setStep(1);
      }, 1500),
      setTimeout(() => {
        // Step 2: Fade to black
        setStep(2);
      }, 3500),
      setTimeout(() => {
        // Step 3: Hiệu ứng chớp mắt mở ra
        setStep(3);
      }, 6000),
      setTimeout(() => {
        // Step 4: Cảnh đồng hoa hiện lên hoàn toàn
        setStep(4);
      }, 8000)
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [updatePlayer]);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 50, pointerEvents: 'auto', overflow: 'hidden'
    }}>
      {/* Cinematic Letterbox (2 dải viền đen trên dưới) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        backgroundColor: '#000', width: '100%',
        transition: 'all 1s ease-in-out', zIndex: 20,
        height: step >= 3 ? '0%' : '15%'
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#000', width: '100%',
        transition: 'all 1s ease-in-out', zIndex: 20,
        height: step >= 3 ? '0%' : '15%'
      }} />

      {/* Lớp nền đen mờ dần lên (Fade to black) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#000',
        transition: 'opacity 2s ease-in-out',
        opacity: step >= 2 ? 1 : 0,
        pointerEvents: step >= 2 ? 'auto' : 'none'
      }} />

      {/* Hiệu ứng chớp mắt (nhắm hẳn mắt lại) */}
      {step === 2 && (
        <>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            backgroundColor: '#000', width: '100%', height: '50%',
            transition: 'all 1s ease-in', zIndex: 30
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: '#000', width: '100%', height: '50%',
            transition: 'all 1s ease-in', zIndex: 30
          }} />
        </>
      )}

      {/* Cánh đồng hoa */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#000',
        transition: 'opacity 1s ease-in-out', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: step >= 3 ? 1 : 0
      }}>
        <img 
          src="/flower_field.png" 
          alt="Flower Field" 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* Lớp màu để dễ đọc chữ */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)'
        }} />

        {step >= 4 && (
          <div style={{
            position: 'relative', zIndex: 40, display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', animation: 'fadeInUp 1s ease-out'
          }}>
            <h1 style={{
              fontSize: '8rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em',
              textShadow: '0 0 15px rgba(255,255,255,0.8)', margin: '0 0 1rem 0'
            }}>
              VICTORY
            </h1>
            <p style={{
              fontSize: '1.5rem', color: '#e2e8f0', marginBottom: '3rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              Hành trình gian khổ cuối cùng cũng kết thúc...
            </p>
            
            <button
              onClick={() => setPhase('menu')}
              style={{
                padding: '12px 32px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.4)', borderRadius: '12px',
                color: '#fff', fontWeight: 'bold', fontSize: '1.25rem', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 0 20px rgba(255,255,255,0.2)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            >
              Trở về Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

