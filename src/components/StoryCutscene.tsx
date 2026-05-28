import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useEntityStore } from '../store/entityStore';

interface StoryCutsceneProps {
  type: 'intro' | 'boss';
}

interface Dialogue {
  speaker: string;
  text: string;
}

const CLASS_INTRO_DATA: Record<string, { image: string, dialogues: Dialogue[] }> = {
  'knight': {
    image: '/images/cutscenes/knight_intro.png',
    dialogues: [
      { speaker: 'Lính Đánh Thuê', text: "Lại một chiến trường mục nát khác... Mùi máu tanh vẫn vậy." },
      { speaker: 'Giọng Nói Bí Ẩn', text: "Thanh gươm của ngươi đã hoen rỉ, nhưng sát ý thì vẫn còn nguyên..." },
      { speaker: 'Lính Đánh Thuê', text: "Đủ để dọn dẹp đống rác rưởi dưới Hầm ngục này." }
    ]
  },
  'rogue': {
    image: '/images/cutscenes/rogue_intro.png',
    dialogues: [
      { speaker: 'Giọng Nói Bí Ẩn', text: "Một con chuột nhắt lẻn vào cõi chết..." },
      { speaker: 'Kẻ Ngoại Đạo', text: "Ta không đến đây để chết. Có một thứ ta cần phải đoạt lại." },
      { speaker: 'Giọng Nói Bí Ẩn', text: "Tham vọng sẽ lôi ngươi xuống tận cùng của sự mục nát." }
    ]
  },
  'mage': {
    image: '/images/cutscenes/mage_intro.png',
    dialogues: [
      { speaker: 'Tu Sĩ Bóng Tối', text: "Bóng tối ở đây... thật thuần khiết." },
      { speaker: 'Giọng Nói Bí Ẩn', text: "Ngươi định dùng thứ tà thuật rẻ tiền đó để sinh tồn sao?" },
      { speaker: 'Tu Sĩ Bóng Tối', text: "Hãy để ma thuật huyết ngải trả lời câu hỏi đó." }
    ]
  },
  'archer': {
    image: '/images/cutscenes/archer_intro.png',
    dialogues: [
      { speaker: 'Kẻ Săn Đêm', text: "Bóng tối là đồng minh của ta. Mũi tên này không bao giờ trượt." },
      { speaker: 'Giọng Nói Bí Ẩn', text: "Nhưng ở đây, bóng tối là kẻ thù có hàng vạn đôi mắt..." },
      { speaker: 'Kẻ Săn Đêm', text: "Vậy ta sẽ chọc mù từng con mắt một." }
    ]
  },
  'summoner': {
    image: '/images/cutscenes/summoner_intro.png',
    dialogues: [
      { speaker: 'Phù Thủy Huyết Ngải', text: "Nỗi đau... ta cần nhiều nỗi đau hơn nữa để nuôi dưỡng các con cưng của mình." },
      { speaker: 'Hệ Thống', text: "Ấn chú đẫm máu trên trán kẻ cuồng tín rực sáng." },
      { speaker: 'Phù Thủy Huyết Ngải', text: "Lên nào các con, xé xác lũ ác quỷ và ăn lấy linh hồn của chúng!" }
    ]
  },
  'paladin': {
    image: '/images/cutscenes/paladin_intro.png',
    dialogues: [
      { speaker: 'Kẻ Tử Đạo', text: "Nhân danh Ánh sáng, ta sẽ thanh tẩy nơi ô uế này!" },
      { speaker: 'Giọng Nói Bí Ẩn', text: "Kẻ mù lòa vì đức tin... Ngươi sẽ chỉ tìm thấy cái chết thảm khốc." },
      { speaker: 'Kẻ Tử Đạo', text: "Sự hy sinh của ta sẽ thắp sáng màn đêm vĩnh hằng!" }
    ]
  },
  'berserker': {
    image: '/images/cutscenes/berserker_intro.png',
    dialogues: [
      { speaker: 'Linh Hồn Bị Nguyền', text: "MÁU! TA CẦN MÁU... MỌI THỨ PHẢI CHẾT!" },
      { speaker: 'Giọng Nói Bí Ẩn', text: "Cơn điên loạn đã ăn mòn lý trí của ngươi rồi sao?" },
      { speaker: 'Linh Hồn Bị Nguyền', text: "CHẾTTTTTT!!!!" }
    ]
  },
  'ninja': {
    image: '/images/cutscenes/ninja_intro.png',
    dialogues: [
      { speaker: 'Hệ Thống', text: "*Một cơn gió lạnh lướt qua, không một tiếng động.*" },
      { speaker: 'Sát Thủ Bóng Đêm', text: "Nhiệm vụ lần này... là dọn sạch cõi âm." },
      { speaker: 'Giọng Nói Bí Ẩn', text: "Ngươi nghĩ mình có thể lẩn trốn khỏi Thần Chết sao?" }
    ]
  },
  'bomb_devil': {
    image: '/images/cutscenes/bomb_devil_intro.png',
    dialogues: [
      { speaker: 'Hệ Thống', text: "*Cô gái trong bộ đồng phục mỉm cười giật chốt trên cổ.*" },
      { speaker: 'Reze (Quỷ Boom)', text: "Bùm! Các cậu ở dưới này có vẻ buồn chán nhỉ?" },
      { speaker: 'Giọng Nói Bí Ẩn', text: "Một ác quỷ... lại chui xuống Hầm ngục tăm tối này?" },
      { speaker: 'Reze (Quỷ Boom)', text: "Chuẩn bị màn pháo hoa rực rỡ nhất đi!" }
    ]
  },
  'default': {
    image: '/images/cutscenes/default_intro.png',
    dialogues: [
      { speaker: 'Người Dẫn Truyện', text: "Vương quốc Elida từ lâu đã chìm trong biển máu..." },
      { speaker: 'Người Dẫn Truyện', text: "Bên dưới đống tàn tích, Hầm ngục thối rữa không ngừng nuốt chửng những linh hồn xấu số." },
      { speaker: 'Giọng Nói Bí Ẩn', text: "Ngươi... một kẻ bị nguyền rủa... lại tự mình dấn thân vào cõi chết này." },
      { speaker: 'Người Dẫn Truyện', text: "Không có hy vọng ở nơi đây, chỉ có sự điên loạn và cái chết chờ đợi." }
    ]
  }
};

const BOSS_DIALOGUES: Dialogue[] = [
  { speaker: 'Hệ Thống', text: "Mùi máu tươi xộc vào mũi..." },
  { speaker: 'Amalgamation', text: "*Tiếng gầm gừ nhầy nhụa phát ra từ vô số cái miệng...*" },
  { speaker: 'Amalgamation', text: "Thịt... Tươi..." },
  { speaker: 'Hệ Thống', text: "Không có đường lùi nữa." }
];

export const StoryCutscene: React.FC<StoryCutsceneProps> = ({ type }) => {
  const { setPhase, setTransitioning } = useGameStore();
  const { updatePlayer } = useEntityStore();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const playerClassId = useEntityStore.getState().player?.classId || 'default';
  const introData = CLASS_INTRO_DATA[playerClassId] || CLASS_INTRO_DATA['default'];
  
  const dialogues = type === 'intro' ? introData.dialogues : BOSS_DIALOGUES;
  const initialMedia = type === 'intro' ? introData.image : '/images/cutscenes/boss_cutscene.png';
  const [currentMediaSrc, setCurrentMediaSrc] = useState(initialMedia);
  const [prevSlide, setPrevSlide] = useState(currentSlide);
  
  if (prevSlide !== currentSlide) {
    setPrevSlide(currentSlide);
    setDisplayedText('');
    setIsTyping(true);
  }

  // Typewriter effect
  useEffect(() => {
    if (currentSlide >= dialogues.length) return;

    let charIndex = 0;
    
    // Nếu là intro, dừng player lại
    if (type === 'intro') {
      updatePlayer({ animState: 'idle', vx: 0, vy: 0 });
    }

    const currentLine = dialogues[currentSlide];
    const text = currentLine.text;
    const typingInterval = setInterval(() => {
      charIndex++;
      if (charIndex <= text.length) {
        setDisplayedText(text.slice(0, charIndex));
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 40); // Tốc độ gõ chữ

    return () => clearInterval(typingInterval);
  }, [currentSlide, dialogues, type, updatePlayer]);

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(dialogues[currentSlide].text);
      setIsTyping(false);
      return;
    }

    if (currentSlide < dialogues.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      finishCutscene();
    }
  };

  const finishCutscene = () => {
    setTransitioning(true);
    setTimeout(() => {
      setPhase('playing');
      setTimeout(() => setTransitioning(false), 500);
    }, 1000);
  };

  const getSpeakerColor = (speaker: string) => {
    if (speaker === 'Người Dẫn Truyện' || speaker === 'Hệ Thống') return 'text-[#9ca3af]';
    if (speaker === 'Amalgamation') return 'text-[#ef4444] drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]';
    return 'text-[#fbbf24]'; // Default cho nhân vật khác
  };

  return (
    <div 
      className="absolute inset-0 z-50 flex flex-col bg-black overflow-hidden cursor-pointer selection:bg-transparent"
      onClick={handleNext}
    >
      {/* Background Media */}
      <div className="absolute inset-0 z-0 bg-black">
        <img 
          src={currentMediaSrc}
          alt="Cinematic Background"
          className="w-full h-full object-cover opacity-60 animate-ken-burns"
          onError={() => {
            console.error(`Lỗi: Không load được ảnh ${currentMediaSrc}! Đang chuyển sang ảnh mặc định...`);
            if (currentMediaSrc !== '/images/cutscenes/default_intro.png') {
              setCurrentMediaSrc('/images/cutscenes/default_intro.png');
            }
          }}
        />
        
        {/* Lớp hạt tàn tro bay (Particles) */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div 
            key={i} 
            className="absolute bg-[#fbbf24] rounded-full pointer-events-none"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              bottom: `-10px`,
              opacity: 0,
              boxShadow: '0 0 4px #fbbf24',
              animation: `float-particles ${Math.random() * 5 + 5}s linear ${Math.random() * 5}s infinite`
            }}
          />
        ))}
      </div>

      {/* Cinematic Letterbox (Black Bars) */}
      <div className="absolute top-0 left-0 w-full h-[10%] bg-black z-20 shadow-[0_10px_20px_rgba(0,0,0,0.8)]" />

      {/* Film Grain & Scratches */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM1NTUiIG9wYWNpdHk9IjAuNSI+PC9yZWN0Pgo8L3N2Zz4=')]" />
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.9)_90%)]" />

      {/* Dialogue UI (Deep Dark Fantasy Style) */}
      <div className="absolute bottom-0 left-0 w-full z-30 flex flex-col items-center pb-12 px-4 md:px-12">
        <div className="w-full max-w-5xl relative">
          
          {/* Hộp tên nhân vật (Gothic Style) */}
          <div className="absolute -top-8 left-8 z-40 flex items-center">
             <div className="h-10 w-4 bg-[#7f1d1d] border-l-2 border-t-2 border-[#b91c1c] shadow-[0_0_10px_rgba(185,28,28,0.8)]" />
             <div className="bg-gradient-to-r from-[#1c1917] to-[#0c0a09] border-y-2 border-r-2 border-[#292524] h-10 flex items-center px-6 shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
               <span className={`font-bold font-serif text-lg tracking-[0.1em] ${getSpeakerColor(dialogues[currentSlide].speaker)}`}>
                 {dialogues[currentSlide].speaker}
               </span>
             </div>
          </div>

          {/* Hộp thoại chính (Parchment / Metal blend) */}
          <div className="relative bg-[#0c0a09]/95 border border-[#3f3f46] p-8 md:p-10 min-h-[160px] shadow-[0_20px_50px_rgba(0,0,0,1)]">
            {/* Viền trang trí 4 góc */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#52525b]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#52525b]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#52525b]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#52525b]" />

            {/* Background texture chìm */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMWMxOTE3Ij48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNSI+PC9yZWN0Pgo8L3N2Zz4=')]" />
            
            {/* Ánh sáng máu hắt từ dưới lên */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-gradient-to-t from-[#450a0a]/40 to-transparent blur-xl pointer-events-none" />

            <p className="relative z-10 text-xl md:text-2xl font-serif text-[#e4e4e7] leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {displayedText}
            </p>
            
            {!isTyping && (
              <div className="absolute bottom-4 right-8 flex items-center gap-2 text-[#fbbf24] animate-pulse">
                <span className="text-xs font-serif tracking-widest opacity-70">CLICK TO CONTINUE</span>
                <span className="text-xl">►</span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
