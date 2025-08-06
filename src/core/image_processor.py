"""Image processing module for Auto Shorts Generator"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from pathlib import Path
from typing import Tuple, Optional, List, Union
from ..utils.logger import LoggerMixin
from ..utils.config import Config
from ..utils.validators import Validator


class ImageProcessor(LoggerMixin):
    """Process and prepare images for video generation"""
    
    def __init__(self, config: Optional[Config] = None):
        """Initialize image processor"""
        self.config = config or Config()
        self.target_width = self.config.get('video.width', 1080)
        self.target_height = self.config.get('video.height', 1920)
        self.resize_method = self.config.get('image.resize_method', 'smart')
        
    def load_image(self, image_path: Union[str, Path]) -> np.ndarray:
        """Load image from file"""
        path = Validator.validate_image_path(str(image_path))
        self.logger.info(f"Loading image: {path}")
        
        # Load with OpenCV
        image = cv2.imread(str(path))
        if image is None:
            raise ValueError(f"Failed to load image: {path}")
        
        # Convert BGR to RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        return image
    
    def resize_for_shorts(self, image: np.ndarray, method: Optional[str] = None) -> np.ndarray:
        """Resize image to shorts format (9:16 ratio)"""
        method = method or self.resize_method
        h, w = image.shape[:2]
        target_ratio = self.target_width / self.target_height
        current_ratio = w / h
        
        self.logger.debug(f"Resizing image from {w}x{h} to {self.target_width}x{self.target_height}")
        
        if method == 'smart':
            return self._smart_resize(image, w, h, current_ratio, target_ratio)
        elif method == 'center':
            return self._center_crop_resize(image, w, h)
        elif method == 'stretch':
            return cv2.resize(image, (self.target_width, self.target_height))
        elif method == 'blur_background':
            return self._blur_background_resize(image, w, h, current_ratio, target_ratio)
        else:
            raise ValueError(f"Unknown resize method: {method}")
    
    def _smart_resize(self, image: np.ndarray, w: int, h: int, 
                     current_ratio: float, target_ratio: float) -> np.ndarray:
        """Smart resize with face/object detection"""
        # Try to detect faces
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) > 0:
            # Crop around faces
            x_min = min([x for x, y, w, h in faces])
            y_min = min([y for x, y, w, h in faces])
            x_max = max([x + w for x, y, w, h in faces])
            y_max = max([y + h for x, y, w, h in faces])
            
            # Add padding
            padding = 100
            x_min = max(0, x_min - padding)
            y_min = max(0, y_min - padding)
            x_max = min(w, x_max + padding)
            y_max = min(h, y_max + padding)
            
            # Adjust to target ratio
            crop_w = x_max - x_min
            crop_h = y_max - y_min
            
            if crop_w / crop_h > target_ratio:
                # Too wide, increase height
                new_h = int(crop_w / target_ratio)
                y_center = (y_min + y_max) // 2
                y_min = max(0, y_center - new_h // 2)
                y_max = min(h, y_center + new_h // 2)
            else:
                # Too tall, increase width
                new_w = int(crop_h * target_ratio)
                x_center = (x_min + x_max) // 2
                x_min = max(0, x_center - new_w // 2)
                x_max = min(w, x_center + new_w // 2)
            
            cropped = image[y_min:y_max, x_min:x_max]
            return cv2.resize(cropped, (self.target_width, self.target_height))
        else:
            # No faces detected, use center crop
            return self._center_crop_resize(image, w, h)
    
    def _center_crop_resize(self, image: np.ndarray, w: int, h: int) -> np.ndarray:
        """Center crop and resize"""
        target_ratio = self.target_width / self.target_height
        current_ratio = w / h
        
        if current_ratio > target_ratio:
            # Image is wider, crop width
            new_w = int(h * target_ratio)
            x_start = (w - new_w) // 2
            cropped = image[:, x_start:x_start + new_w]
        else:
            # Image is taller, crop height
            new_h = int(w / target_ratio)
            y_start = (h - new_h) // 2
            cropped = image[y_start:y_start + new_h, :]
        
        return cv2.resize(cropped, (self.target_width, self.target_height))
    
    def _blur_background_resize(self, image: np.ndarray, w: int, h: int,
                                current_ratio: float, target_ratio: float) -> np.ndarray:
        """Resize with blurred background for padding"""
        # Create blurred background
        background = cv2.GaussianBlur(image, (51, 51), 0)
        background = cv2.resize(background, (self.target_width, self.target_height))
        
        # Resize original image to fit
        if current_ratio > target_ratio:
            # Fit by width
            new_w = self.target_width
            new_h = int(new_w / current_ratio)
        else:
            # Fit by height
            new_h = self.target_height
            new_w = int(new_h * current_ratio)
        
        resized = cv2.resize(image, (new_w, new_h))
        
        # Center on background
        y_offset = (self.target_height - new_h) // 2
        x_offset = (self.target_width - new_w) // 2
        
        background[y_offset:y_offset + new_h, x_offset:x_offset + new_w] = resized
        
        return background
    
    def apply_enhancement(self, image: np.ndarray, 
                         brightness: float = 1.0,
                         contrast: float = 1.0,
                         saturation: float = 1.0) -> np.ndarray:
        """Apply image enhancements"""
        # Convert to PIL for enhancement
        pil_image = Image.fromarray(image)
        
        # Apply brightness
        if brightness != 1.0:
            enhancer = ImageEnhance.Brightness(pil_image)
            pil_image = enhancer.enhance(brightness)
        
        # Apply contrast
        if contrast != 1.0:
            enhancer = ImageEnhance.Contrast(pil_image)
            pil_image = enhancer.enhance(contrast)
        
        # Apply saturation
        if saturation != 1.0:
            enhancer = ImageEnhance.Color(pil_image)
            pil_image = enhancer.enhance(saturation)
        
        # Convert back to numpy
        return np.array(pil_image)
    
    def apply_filter(self, image: np.ndarray, filter_type: str) -> np.ndarray:
        """Apply artistic filters"""
        pil_image = Image.fromarray(image)
        
        if filter_type == 'blur':
            pil_image = pil_image.filter(ImageFilter.GaussianBlur(radius=2))
        elif filter_type == 'sharpen':
            pil_image = pil_image.filter(ImageFilter.SHARPEN)
        elif filter_type == 'edge_enhance':
            pil_image = pil_image.filter(ImageFilter.EDGE_ENHANCE)
        elif filter_type == 'smooth':
            pil_image = pil_image.filter(ImageFilter.SMOOTH)
        elif filter_type == 'vintage':
            # Apply vintage effect
            pil_image = self._apply_vintage_filter(pil_image)
        elif filter_type == 'grayscale':
            pil_image = pil_image.convert('L').convert('RGB')
        
        return np.array(pil_image)
    
    def _apply_vintage_filter(self, image: Image.Image) -> Image.Image:
        """Apply vintage filter effect"""
        # Reduce saturation
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(0.7)
        
        # Add slight yellow tint
        image = Image.blend(image, Image.new('RGB', image.size, (255, 240, 200)), 0.1)
        
        # Reduce contrast slightly
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(0.9)
        
        return image
    
    def create_gradient_overlay(self, image: np.ndarray, 
                               position: str = 'bottom',
                               opacity: float = 0.5) -> np.ndarray:
        """Add gradient overlay for text readability"""
        h, w = image.shape[:2]
        gradient = np.zeros((h, w, 4), dtype=np.uint8)
        
        if position == 'bottom':
            for i in range(h // 3, h):
                alpha = int(255 * opacity * (i - h // 3) / (2 * h / 3))
                gradient[i, :] = [0, 0, 0, alpha]
        elif position == 'top':
            for i in range(h // 3):
                alpha = int(255 * opacity * (1 - i / (h / 3)))
                gradient[i, :] = [0, 0, 0, alpha]
        
        # Blend gradient with image
        overlay = Image.fromarray(gradient, mode='RGBA')
        img_pil = Image.fromarray(image)
        img_pil.paste(overlay, (0, 0), overlay)
        
        return np.array(img_pil)
    
    def batch_process(self, image_paths: List[str], 
                     resize_method: Optional[str] = None,
                     enhancement_config: Optional[dict] = None) -> List[np.ndarray]:
        """Process multiple images"""
        processed_images = []
        
        for path in image_paths:
            try:
                # Load image
                image = self.load_image(path)
                
                # Resize
                image = self.resize_for_shorts(image, resize_method)
                
                # Apply enhancements
                if enhancement_config:
                    image = self.apply_enhancement(
                        image,
                        brightness=enhancement_config.get('brightness', 1.0),
                        contrast=enhancement_config.get('contrast', 1.0),
                        saturation=enhancement_config.get('saturation', 1.0)
                    )
                
                processed_images.append(image)
                self.logger.info(f"Processed image: {path}")
                
            except Exception as e:
                self.logger.error(f"Failed to process image {path}: {e}")
        
        return processed_images
    
    def save_image(self, image: np.ndarray, output_path: Union[str, Path]):
        """Save processed image"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert RGB to BGR for OpenCV
        image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        cv2.imwrite(str(output_path), image_bgr)
        
        self.logger.info(f"Saved image: {output_path}")