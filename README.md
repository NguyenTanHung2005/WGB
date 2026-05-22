# Dungeon Spark ⚔️✨

Một tựa game hành động roguelite nhịp độ nhanh được xây dựng hoàn toàn bằng React, TypeScript và HTML5 Canvas (không sử dụng engine game nào). Trải nghiệm những pha combat rực lửa, vượt qua các hầm ngục tăm tối và trở thành anh hùng huyền thoại!

## Tính Năng Nổi Bật (Features)
- **Hệ Thống Lớp Nhân Vật Đa Dạng**: Chơi với vai trò Kỵ Sĩ (Knight), Sát Thủ (Rogue) hoặc Pháp Sư (Mage) - mỗi lớp đều có ngoại hình, vũ khí và Kỹ năng đặc biệt (Dual Wield, Dodge Roll, Lightning Chain).
- **Auto-Attack Combat**: Hệ thống tự động ngắm bắn thông minh giúp bạn tập trung 100% vào kỹ năng di chuyển (WASD) và né tránh.
- **Hầm Ngục Tạo Ngẫu Nhiên (Procedural Generation)**: Mỗi lần chơi là một trải nghiệm mới với hệ thống map grid và sinh quái tự động tăng độ khó theo chiều sâu.
- **Render Siêu Mượt bằng Canvas 2D**: Đồ hoạ Procedural Pixel Chibi kết hợp Particle Systems cho hiệu ứng cháy nổ rực rỡ ở 60 FPS.
- **Giao Diện HUD Hiện Đại**: Bố cục tối giản với Mini-map và hệ thống icon Kỹ năng riêng biệt theo phong cách Glassmorphism.

## Cài đặt (Installation)
Yêu cầu Node.js cài sẵn trên máy tính.

1. Tải source code hoặc Clone repo.
2. Cài đặt các gói phụ thuộc (Dependencies):
```bash
npm install
```
3. Khởi động Dev Server:
```bash
npm run dev
```
4. Truy cập vào đường link `http://localhost:5173/` để chơi.

## Cách Chơi (Controls)
- **[W] [A] [S] [D]**: Di chuyển nhân vật.
- **[Chuột]**: Hệ thống sẽ tự động tấn công (Auto-Attack) quái vật gần nhất. Nếu không có mục tiêu, nhân vật sẽ tấn công về phía con trỏ chuột.
- **[E] / [Chuột Phải]**: Kích hoạt Kỹ năng Đặc biệt (Phụ thuộc vào Lớp Nhân vật đang chọn).
- **[Q] / [Space]**: Chuyển đổi Vũ khí.
- **[F]**: Tương tác (Nhặt vũ khí dưới đất).
- **[Shift]**: Lướt/Nhào lộn nhanh (Dành riêng cho Sát thủ).
- **[Esc]**: Tạm dừng (Pause Menu).

## Stack Công Nghệ (Tech Stack)
- **Frontend**: React 18, Vite.
- **Ngôn ngữ**: TypeScript.
- **Render**: Custom HTML5 Canvas 2D Rendering Engine (Procedural Graphics).
- **State Management**: Zustand (Kiến trúc Headless tách biệt Game Logic và View).
- **Styling**: Tailwind CSS & Vanilla CSS (Cho Overlays).

> Dự án được xây dựng theo kiến trúc Data-Driven, tận dụng sức mạnh của React Lifecycle kết hợp với vòng lặp `requestAnimationFrame` siêu nhanh.
