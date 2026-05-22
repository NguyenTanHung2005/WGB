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

## Phase 8: Làm mới Lớp Nhân Vật & Hệ thống Tài Nguyên (Class Rework & No Mana)
- Loại bỏ hoàn toàn Hệ thống Mana: Kỹ năng và vũ khí không còn tiêu tốn Mana. Giao diện cũng loại bỏ thanh Mana.
- Rework lại lớp Pháp Sư (Mage) và các kỹ năng của các nhân vật khác. Kỹ năng nay chỉ phụ thuộc vào thời gian hồi chiêu (Cooldown).
- Bổ sung `templateId` cho hệ thống Quái Vật, giúp phân biệt rõ hình ảnh các loại quái (Slime, Skeleton, Goblin). Cập nhật ngoại hình và animation riêng cho quái.

## Phase 9: Sửa Lỗi Nghiêm Trọng (Bug Fixes)
- Khắc phục lỗi "Bị kẹt cứng khi qua cửa phòng": Sửa logic sinh quái vật và vị trí spawn nhân vật khi đi qua cổng.
- Khắc phục lỗi "Nhân vật bị kẹt khi tấn công": Sửa lỗi strokeStyle trong GameCanvas khiến game bị treo (Freeze) khi Mage đánh trúng mục tiêu.

## Phase 10: Đại tu Giao Diện Tối Giản & Trải nghiệm (UI Revamp & UX)
- Phóng to Kích thước Bản đồ (Căn phòng hiện tại là 2000x1500) và mở rộng cổng (Gate 200px) giúp màn hình luôn phủ kín gạch nền, mang lại trải nghiệm Dungeon rộng lớn hơn.
- Giao diện (HUD) được quy hoạch gọn gàng: Toàn bộ Thanh Máu, Giáp, Kỹ năng chuyển lên Góc Trái - Trên. Minimap được thu nhỏ và đưa xuống Góc Phải - Dưới.
- Auto-Attack toàn diện: Không cần bấm chuột trái. Nhân vật tự động vung vũ khí liên tục.

## Phase 11: Ngoại Hình Độc Quyền & Giao Diện Kỹ Năng (Character Graphics & Skill UI)
- Tái cấu trúc (Refactor) hệ thống vẽ Pixel Chibi: Chuyển toàn bộ logic vẽ nhân vật từ `GameCanvas.tsx` sang hệ thống mới tại `src/graphics/drawPlayer.ts`.
- Hoàn thiện hình dáng Độc quyền cho từng Class: 
  - Kỵ sĩ (Knight): Giáp sắt khối, mũ bảo hiểm che mặt.
  - Sát thủ (Rogue): Đồ da trùm đầu, có bóng mờ (shadow trail) khi di chuyển.
  - Pháp sư (Mage): Thân tam giác, đầu tròn, nón phù thuỷ chóp nhọn vành rộng theo đúng bản phác thảo.
- Tùy chỉnh Giao diện Kỹ năng (Skill UI): HUD cập nhật icon kỹ năng (Khiên, Gió, Sấm Sét) và màu sắc vòng Cooldown tương ứng với từng Class.
- Hoàn thiện Visual cho Skill: Tia sét dích dắc cho Mage, quầng sáng khiên cho Knight.

## Phase 12: Hệ thống Relic & Tương Tác Nổi (Relic System & Microinteractions)
- Bổ sung hệ thống **Relic (Thánh tích)** với 3 bảo vật: Vampire Tooth (Hút máu), Hermes Boots (Tăng tốc), Berserker Ring (Tăng sát thương khi ít máu).
- Quái vật bị tiêu diệt và Rương mở ra có tỉ lệ rơi Relic để gia tăng sức mạnh vĩnh viễn trong run.
- Thêm hiệu ứng nổi chữ (Floating Text) lên màn hình khi nhặt được Relic (VD: `+ HERMES BOOTS`).
- Tích hợp thêm icon Relic nhỏ trên HUDOverlay dưới thanh chỉ số máu để dễ dàng theo dõi build hiện tại.

## Phase 13: Hệ thống Quái Vật Tinh Anh (Elite) & Nguyên Tố (Vòng lặp tự động #2)
- Có 15% tỉ lệ sinh ra **Quái Vật Elite** khi vào phòng mới.
- Quái Elite có 2.5x Máu, 1.5x Sát thương và 1.3x Kích thước. Dưới chân chúng sẽ phát sáng Aura chớp tắt.
- Mỗi quái Elite sẽ mang một **Hệ Nguyên tố** ngẫu nhiên: Lửa (Cam), Băng (Xanh), Độc (Tím).
- Khi Quái Elite đánh trúng hoặc đạn của chúng trúng người chơi, người chơi sẽ dính hiệu ứng trạng thái tương ứng.
- Bổ sung hiệu ứng hạt Particle: Khói lửa khi cháy, Độc màu tím bốc hơi, Tuyết bay khi bị đóng băng.
- Thêm cơ chế Sát thương DoT (Damage Over Time) cho hệ Độc và Lửa. Hệ Băng làm giảm 50% tốc độ di chuyển.

## Phase 14: Lò Rèn Nâng Cấp Vũ Khí (Vòng lặp tự động #3)
- Thêm **Lò Rèn (Anvil)** vào chính giữa mỗi Cửa Hàng (Shop room).
- Cho phép người chơi tiêu tốn **50 Gold** để rèn và cường hoá vũ khí đang cầm trên tay.
- Sát thương của vũ khí sẽ tăng thêm 25% sau mỗi lần rèn.
- Tên vũ khí được thêm tiền tố cấp độ (VD: `Sword +1`, `Assault Rifle +2`) và hiển thị trực tiếp trên HUD UI.
- Thêm hiệu ứng hạt tia lửa đập búa (sparks) và Text nổi `UPGRADED!` màu cam lấp lánh khi rèn thành công.

## Phase 15: AI Gọi Hồn (Necromancer) (Vòng lặp tự động #4)
- Bổ sung Quái vật **Tử Linh Sư (Necromancer)** vào danh sách ngẫu nhiên của các phòng.
- Áp dụng AI Pattern mới (`summon`): Necromancer sẽ tự động lùi xa (giữ khoảng cách) khi người chơi đến quá gần (dưới 250px) để bảo toàn mạng sống.
- Cứ mỗi 4 giây, Necromancer sẽ triệu hồi 2 con **Skeleton Minion** nhỏ để tấn công người chơi.
- Skeleton Minion di chuyển cực nhanh nhưng cực yếu (1 HP), chủ yếu để làm rối loạn đội hình và đỡ đạn thay cho Necromancer.
- Giao diện riêng biệt cho Necromancer: Đội mũ trùm đầu màu tối, mắt tím sáng, cầm trượng phép phát sáng vung vẩy khi niệm chú gọi đệ.

## Phase 16: Pet Đồng Hành (Fairy) (Vòng lặp tự động #5 - Final)
- Thêm **Pet Đồng Hành (Fairy Companion)** tự động bay lượn (Orbiting) xung quanh người chơi ngay từ đầu game.
- Áp dụng AI Pattern mới (`follow`) dành riêng cho đồng minh (allies).
- Fairy sẽ tự động dò tìm kẻ địch gần nhất trong bán kính 350px.
- Cứ mỗi 1.5 giây, Fairy sẽ tự động bắn ra một đạn ma thuật (Projectile) màu vàng chanh gây sát thương để hỗ trợ người chơi.
- Đồ hoạ tinh linh toả sáng rực rỡ với hai cánh mỏng vỗ liên tục nhờ Canvas `shadowBlur` và hàm toán học `Math.sin`.

## Phase 17: Kỷ Nguyên Bóng Tối (Dark Fantasy - Vòng lặp Cycle 2 #1)
- **Đại tu Cốt Truyện & Giao Diện**: Màn hình chính mang tông màu rỉ sét, đỏ máu và cốt truyện của một hầm ngục bị nguyền rủa (Fear & Hunger vibe).
- **Làm lại Cơ Chế Nhân Vật (Classes)**: Đổi toàn bộ các Class hiện tại thành các hình mẫu u tối (Mercenary, Outlander, Dark Priest...) với lượng Máu và Giáp bị giảm mạnh để tăng độ khắc nghiệt (Hardcore).
- **Khí quyển Kinh Dị (Atmosphere)**: Áp dụng Lớp phủ Viền đen sẫm (Vignette) bo hẹp tầm nhìn và hiệu ứng Nhiễu hạt nhiễu sóng (Film Grain / Dots) ngẫu nhiên trên toàn màn hình. Màu sàn nhà chuyển từ Xanh sang Đen thẳm với các chấm rỉ sét.
- **Phong Cách Pixel/Dots**: Làm lại toàn bộ hệ thống vẽ nhân vật (Player rendering). Loại bỏ hoàn toàn các đường cong tròn trịa (arc/ellipse), thay bằng các khối vuông góc cạnh (fillRect) để mô phỏng hình ảnh 8-bit/16-bit retro cổ điển, nhuốm màu tối tăm, rách rưới và vô hồn.

## Phase 18: Quái Vật Cõi Âm (Dark Fantasy - Vòng lặp Cycle 2 #2)
- **Thiết Kế Lại Quái Vật**: Áp dụng phong cách Pixel/Dots (Blocky) cho toàn bộ hệ sinh thái quái vật, biến chúng thành những sinh vật dị dạng:
  - `Goblin` -> **Tà Giáo Đồ (Cultist)**: Hình nhân đội mũ trùm cầm dao mổ gỉ sét.
  - `Skeleton` -> **Khung Xương Nát (Shattered Skeleton)**: Xương vụn ráp lại, hốc mắt tối đen rỗng tuếch.
  - `Bat` -> **Khối U Lơ Lửng (Floating Tumor)**: Vệt máu đỏ tươi biết bay, lao vào tự sát.
  - `Necromancer` -> **Lich (Tử Ma)**: Tà linh trùm chăn lơ lửng, cầm lưỡi hái/trượng bóng tối.
  - Boss `Grand Slime` -> **Quái Thai Khổng Lồ (Flesh Amalgamation)**: Một đống thịt băm khổng lồ chằng chịt hàng chục con mắt rỉ máu, há to mồm với hàm răng sắc nhọn khi nổi điên.
- Cập nhật Tinh linh đồng hành (Fairy) thành một dạng "Linh hồn lạc lối" (Wisp/Soul) phát sáng nhờ màu vàng chanh, nhạt nhoà trong đêm tối.

## Phase 19: Hầm Ngục Mục Nát (Dark Fantasy - Vòng lặp Cycle 2 #3)
- **Đại tu Môi trường (Environment)**: Đổi màu sàn gạch và tường sang xám đen, đỏ rỉ sét. Tường được vẽ bằng khối vuông thô kệch thay vì đường viền trơn tuột.
- **Biến đổi Rương (Chest) thành Kén Nhục Thể (Flesh Cocoon)**: Một khối máu thịt đập thình thịch, toé máu nhầy nhụa xuống sàn khi bị phá vỡ.
- **Biến đổi Bàn thờ (Shrine) thành Bàn Thờ Huyết Ngải (Cursed Altar)**: Chậu máu với hộp sọ tăm tối thay vì tế đàn ánh sáng.
- **Biến đổi Thùng Gỗ / Thuốc Nổ thành Xác Chết**: Thùng Gỗ nay là **Đống Xác Chết (Bone Pile)** chứa đầy xương xẩu, Thùng Thuốc Nổ nay là **Xác Chết Trương Phình (Bloated Corpse)** màu tím bầm rỉ độc.
- Cập nhật các Cửa Hàng, Lò Rèn, Cửa (Gate) và Bẫy Gai (Spike) sang trạng thái rỉ sét, nhuốm máu, mang đến sự u ám cùng cực cho hầm ngục.

## Phase 20: Chiến đấu Đẫm máu (Dark Fantasy - Vòng lặp Cycle 2 #4)
- **Đại tu Hiệu ứng Đạn bay (Projectiles)**: Tia đạn không còn là vòng tròn phát sáng, mà biến thành những khối vuông gai góc kéo theo vệt đứt đoạn (Trail) phía sau, tạo cảm giác rách rưới. Đạn cung thủ là những mũi tên nhọn thực sự.
- **Đại tu Hiệu ứng Văng Máu (Pixel Splatter)**: Các mảnh vụn (Particles) khi kẻ địch mất máu hay khi đập rương đều biến thành các khối lập phương (Pixel) văng tung toé và xoay tròn hỗn loạn.
- **Số Sát Thương Rùng Rợn**: Thay đổi font chữ số sát thương sang dạng máy đánh chữ cổ (`Courier New`), có viền đen dày, và đặc biệt là giật lắc (jitter) liên tục khi xuất hiện Đòn Chí Mạng (Critical).

## Phase 21: Giao Diện Chết Chóc (Dark Fantasy - Vòng lặp Cycle 2 #5)
- **Đại tu CSS Giao Diện (Blocky UI)**: Xoá bỏ mọi hiệu ứng Glassmorphism (Kính mờ) và bo góc (border-radius) mềm mại của HUD, Menu, Minimap và Shop. Thay vào đó là các khung viền khối vuông cứng cáp, nét viền đen dày và hiệu ứng đổ bóng đặc (Hard-edge shadow).
- **Phối màu Tăm Tối**: Màu sắc của Thanh Máu, Mana, Bảng Điểm được làm tối đi để tạo cảm giác rỉ sét và mục nát.
- **Giảm Hồi Phục (Survival Hardcore)**: Tăng thời gian giãn cách hồi Giáp (Shield) từ 1 giây lên 3 giây sau 6 giây không chịu sát thương, khiến việc bảo toàn mạng sống trong Hầm ngục Mục nát trở nên vô cùng khắc nghiệt.
