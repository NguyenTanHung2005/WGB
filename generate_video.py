import cv2
import numpy as np
import os

def create_video(image_path, output_path, duration=5, fps=30):
    print(f"Start rendering video from {image_path}...")
    
    if not os.path.exists(image_path):
        print(f"Error: File not found {image_path}")
        return

    # Load image
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not read file {image_path}")
        return

    orig_height, orig_width, _ = img.shape
    
    # Kích thước đầu ra cố định
    out_width = 1280
    out_height = 720
    
    # FourCC codec để xuất file MP4
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (out_width, out_height))
    
    total_frames = duration * fps
    
    for i in range(total_frames):
        # Scale cho Ken Burns effect (Zoom In từ từ)
        # Bắt đầu từ scale 1.0, kết thúc ở 1.15
        scale = 1.0 + (0.15 * (i / float(total_frames)))
        
        # Tính toán kích thước crop mới
        crop_w = int(orig_width / scale)
        crop_h = int(orig_height / scale)
        
        # Pan nhẹ sang phải và xuống dưới (Center của crop box thay đổi)
        # Điểm bắt đầu (center of image)
        start_cx = orig_width // 2
        start_cy = orig_height // 2
        
        # Điểm kết thúc (lệch sang phải và xuống)
        end_cx = orig_width // 2 + int(orig_width * 0.05)
        end_cy = orig_height // 2 + int(orig_height * 0.05)
        
        # Nội suy vị trí hiện tại
        cx = int(start_cx + (end_cx - start_cx) * (i / float(total_frames)))
        cy = int(start_cy + (end_cy - start_cy) * (i / float(total_frames)))
        
        # Tính toán box crop
        x1 = max(0, cx - crop_w // 2)
        y1 = max(0, cy - crop_h // 2)
        x2 = min(orig_width, x1 + crop_w)
        y2 = min(orig_height, y1 + crop_h)
        
        # Crop frame
        frame = img[y1:y2, x1:x2]
        
        # Resize frame về chuẩn 1280x720
        frame = cv2.resize(frame, (out_width, out_height))
        
        # Làm hiệu ứng Vignette (tối viền)
        # Tạo mask
        kernel_x = cv2.getGaussianKernel(out_width, out_width/2)
        kernel_y = cv2.getGaussianKernel(out_height, out_height/2)
        kernel = kernel_y * kernel_x.T
        mask = 255 * kernel / np.linalg.norm(kernel)
        
        # Trộn mask vào frame (mô phỏng vignette)
        mask = cv2.resize(mask, (out_width, out_height))
        
        # Để tránh quá tối, điều chỉnh mức độ mask
        alpha = 0.5
        for c in range(3):
            frame[:, :, c] = frame[:, :, c] * (1 - alpha) + frame[:, :, c] * mask * alpha
            
        out.write(frame)
        
        if i % 30 == 0:
            print(f"Rendered {i}/{total_frames} frames for {output_path}...")
            
    out.release()
    print(f"Finished rendering: {output_path}")

if __name__ == "__main__":
    create_video("public/intro_bg.png", "public/intro_cutscene.mp4", duration=8, fps=30)
    create_video("public/boss_bg.png", "public/boss_cutscene.mp4", duration=8, fps=30)
    print("ALL DONE!")
