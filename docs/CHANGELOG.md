# Dungeon Spark - Lịch sử Phát triển (Changelog)

Tài liệu này ghi chép lại các bước triển khai của dự án theo trình tự thời gian.

## Phase 1: Khởi tạo Kiến trúc và Vòng lặp Cơ bản (Core Architecture & Game Loop)
- Thiết lập React + Vite + TypeScript.
- Cấu hình Zustand store theo kiến trúc Headless (tách biệt Logic và UI) với `gameStore.ts`, `entityStore.ts`, `mapStore.ts`.
- Tạo cơ chế vòng lặp 60 FPS (`useGameLoop.ts`) với `requestAnimationFrame` điều phối các hệ thống: `movementSystem`, `collisionSystem`, `combatSystem`, `roomSystem`.
- Tạo `GameCanvas.tsx` render mọi thứ trực tiếp trên HTML Canvas2D.

## Phase 2: Đồ hoạ Procedural & Hệ thống Nhân vật (Graphics & Classes)
- Vẽ nhân vật và vũ khí bằng kỹ thuật Procedural Generation (Vẽ động bằng Code).
- Thêm phong cách nghệ thuật Pixel Chibi.
- Khởi tạo 3 lớp nhân vật: Knight (Cận chiến/Máu trâu), Rogue (Tốc độ/Lộn nhào), Mage (Phép thuật/Đạn nổ diện rộng).
- Bổ sung hiệu ứng Animation: Idle, Walk, Attack, Roll, Dead.
- Tích hợp hiệu ứng hạt (Particles), Text sát thương nảy lên (Damage Numbers), và Màn hình rung lắc (Camera Shake).

## Phase 3: Hệ thống Bản đồ & Tương tác (Dungeon & Interaction)
- Xây dựng bản đồ dạng Lưới (Grid) với thuật toán tạo phòng tự động.
- Các loại phòng: Start, Combat, Chest (Rương), Shop (Cửa hàng), Boss.
- Xây dựng hệ thống cửa (Gates) đóng/mở tự động, rào chắn đỏ khi vào phòng Combat.
- Bổ sung Thùng gỗ có thể phá vỡ và Thùng thuốc nổ gây sát thương diện rộng.
- Thêm chức năng nhặt Vũ khí dưới đất bằng phím `F`. 
- Thêm cơ chế nhận Vàng và Năng Lượng (Mana) tự động khi đi ngang qua.

## Phase 4: Sửa lỗi Hiệu suất & Nâng cấp Giao diện (Performance & UI/UX)
- Khắc phục sự cố nghẽn cổ chai của React (React Re-renders bottleneck) khiến sự kiện phím/chuột bị treo. Chuyển logic lấy trạng thái trò chơi trực tiếp từ `useEntityStore.getState()` trong render loop.
- Quy hoạch lại giao diện HUD trên màn hình Desktop: 
  - Đổi từ một cột màn hình dọc sang bố cục Grid 3 cột (PlayerStats, GameCanvas, PlayerEquip).
  - Sử dụng giao diện Glassmorphism hiện đại, chuyên nghiệp với các vòng hồi chiêu rõ ràng.
- Gắn hệ thống ActionBar để chỉ dẫn các phím tắt (WASD, Chuột trái, Q, E, F, Space).

## Phase 5 (Current): Cân bằng Kẻ thù & Quả Cầu Hồi Máu (Enemy Scaling & Health Pickups)
- Thêm vật phẩm Quả cầu Hồi máu (`HealthPickup`) rớt từ thùng gỗ và quái vật.
- Tự động nhặt máu khi bước qua.
- Điều chỉnh thuật toán sinh quái vật (Enemy Spawning): Giảm số lượng quái để giảm cảm giác ngộp.
- Thêm cơ chế **Room Level (Độ sâu của phòng)** tính bằng khoảng cách lưới (Grid Distance) từ phòng Start. Máu và sát thương của quái vật sẽ tăng dần theo độ sâu này để đảm bảo tính chiến thuật.

## Phase 6 (Current): Cạm bẫy, Chuyển động lướt & Hiệu ứng Đồ họa (Traps, Dash & Animations)
- Thêm Bẫy gai (Spike Traps) trong phòng Combat: Bẫy tự động nhô lên và hạ xuống, gây sát thương và đẩy lùi nếu dẫm phải.
- Cập nhật cơ chế Lộn nhào/Lướt (Dash) bằng phím `Shift`: Tạo gia tốc cực mạnh kèm thời gian bất tử (i-frames) và bóng tàn ảnh (Shadow Trails).
- Bổ sung Hoạt ảnh vũ khí: Thêm vòng cung kiếm chém (Slash Arc) cho vũ khí cận chiến và vệt đuôi đạn (Bullet Trails) cho súng.
- Bổ sung Hoạt ảnh khi chết (Bia mộ - Tombstone).
- Thêm cơ chế `invincibleUntil` (thời gian vô địch/i-frames) dùng chung cho sát thương từ đạn, quái chạm và bẫy.

## Phase 7: Tự động ngắm bắn, Nam châm Hút đồ & Cập nhật Menu (Auto-aim, Magnet & Pause Menu)
- Thay đổi cơ chế tấn công: Xóa bỏ việc phải giữ chuột để bắn. Giờ đây nhân vật sẽ **luôn luôn tự động ngắm và tấn công** quái vật gần nhất trong tầm (Auto-aim & Auto-attack). Nếu không có quái, nhân vật sẽ đánh về hướng chuột.
- Cập nhật vũ khí khởi đầu theo Class: Mage có Trượng phép, Rogue có Dao găm (Dagger), Knight dùng Kiếm to.
- Sửa lỗi nghiêm trọng (Race Condition) khiến map không mở cửa khi tiêu diệt hết quái vật do vòng lặp sinh quái đếm sai wave.
- Thêm cơ chế **Nam châm (Magnet)**: Vàng, Máu, Mana sẽ tự động hút về phía người chơi nếu đứng trong khoảng cách gần (150px).
- Nâng cấp `PauseMenu`: Bổ sung nút Thoát Game (Về Menu chính).
