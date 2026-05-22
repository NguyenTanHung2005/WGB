# Dungeon Spark ⚔️✨

Một tựa game hành động roguelite nhịp độ nhanh được xây dựng hoàn toàn bằng React, TypeScript và HTML5 Canvas (không sử dụng engine game nào). Trải nghiệm những pha combat rực lửa, vượt qua các hầm ngục tăm tối và trở thành anh hùng huyền thoại!

## Tính Năng Nổi Bật (Features)
- **Hệ Thống Lớp Nhân Vật Đa Dạng**: Chơi với vai trò Kỵ Sĩ (Knight), Sát Thủ (Rogue) hoặc Pháp Sư (Mage) - mỗi lớp đều có ngoại hình, vũ khí và Kỹ năng đặc biệt (Dual Wield, Dodge Roll, Lightning Chain).
- **Auto-Attack Combat**: Hệ thống tự động ngắm bắn thông minh giúp bạn tập trung 100% vào kỹ năng di chuyển (WASD) và né tránh.
- **Hầm Ngục Tạo Ngẫu Nhiên (Procedural Generation)**: Mỗi lần chơi là một trải nghiệm mới với hệ thống map grid và sinh quái tự động tăng độ khó theo chiều sâu.
- **Render Siêu Mượt bằng Canvas 2D**: Đồ hoạ Procedural Pixel Chibi kết hợp Particle Systems cho hiệu ứng cháy nổ rực rỡ ở 60 FPS.
- **Hệ Thống Relic (Thánh Tích)**: Thu thập các bảo vật vĩnh viễn (Hermes Boots, Vampire Tooth, Berserker Ring) để liên tục cường hóa sức mạnh trong suốt lượt chơi.
- **Pet Đồng Hành (Fairy Companion)**: Tiểu tinh linh ánh sáng bay lượn quanh người chơi và tự động nhắm bắn hỗ trợ hoả lực.
- **Hệ Thống Lò Rèn (Anvil)**: Cường hoá vũ khí của bạn bằng Vàng tại các Cửa hàng để gia tăng sát thương (VD: Sword +1).
- **Hệ Sinh Thái Quái Vật Đa Dạng**: Từ Skeleton cầm gươm/cung, Goblin, Dơi tự sát cho đến **Tử Linh Sư (Necromancer)** liên tục gọi đệ bảo vệ.
- **Quái Vật Tinh Anh (Elite Enemies)**: Đối đầu với những phiên bản quái vật mang thuộc tính Nguyên tố (Lửa, Độc, Băng) có sức mạnh vượt trội và hiệu ứng trạng thái riêng biệt.
- **Phong Cách Dark Fantasy & Đồ hoạ Retro Pixel/Dots**: Tông màu tối tăm u ám (Vignette), nhiễu hạt (Film Grain) và tạo hình nhân vật dạng khối vuông Pixel lấy cảm hứng từ thể loại kinh dị sinh tồn.

## Tiến độ Dự Án
- ✅ Chuyển đổi đồ hoạ sang Dark Fantasy Pixel-Art (Dots/Blocky).
- ✅ Chuyển đổi cốt truyện, class nhân vật và quái vật sang thể loại tăm tối (Fear & Hunger / Dark Souls).
- ✅ Loại bỏ Glassmorphism, thay thế bằng Giao diện Vuông vức nguyên thủy đẫm máu.
- ✅ Cân bằng Sinh tồn Hardcore (Giảm tỷ lệ hồi phục và Tăng độ khó).
- ⬜ Hệ thống Boss Mechanics chi tiết và các Cutscene.

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
