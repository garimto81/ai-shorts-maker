"""Input validation utilities"""

import os
from pathlib import Path
from typing import List, Tuple, Optional
import re


class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass


class Validator:
    """Validation utilities for input data"""
    
    # Supported formats
    IMAGE_FORMATS = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
    VIDEO_FORMATS = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}
    AUDIO_FORMATS = {'.mp3', '.wav', '.ogg', '.m4a', '.aac'}
    TEXT_FORMATS = {'.txt', '.srt', '.json', '.yaml'}
    
    @staticmethod
    def validate_image_path(path: str) -> Path:
        """Validate image file path"""
        path_obj = Path(path)
        
        if not path_obj.exists():
            raise ValidationError(f"Image file not found: {path}")
        
        if not path_obj.is_file():
            raise ValidationError(f"Path is not a file: {path}")
        
        if path_obj.suffix.lower() not in Validator.IMAGE_FORMATS:
            raise ValidationError(
                f"Unsupported image format: {path_obj.suffix}. "
                f"Supported formats: {', '.join(Validator.IMAGE_FORMATS)}"
            )
        
        return path_obj
    
    @staticmethod
    def validate_audio_path(path: str) -> Path:
        """Validate audio file path"""
        path_obj = Path(path)
        
        if not path_obj.exists():
            raise ValidationError(f"Audio file not found: {path}")
        
        if not path_obj.is_file():
            raise ValidationError(f"Path is not a file: {path}")
        
        if path_obj.suffix.lower() not in Validator.AUDIO_FORMATS:
            raise ValidationError(
                f"Unsupported audio format: {path_obj.suffix}. "
                f"Supported formats: {', '.join(Validator.AUDIO_FORMATS)}"
            )
        
        return path_obj
    
    @staticmethod
    def validate_directory(path: str, create: bool = False) -> Path:
        """Validate directory path"""
        path_obj = Path(path)
        
        if not path_obj.exists():
            if create:
                path_obj.mkdir(parents=True, exist_ok=True)
            else:
                raise ValidationError(f"Directory not found: {path}")
        
        if not path_obj.is_dir():
            raise ValidationError(f"Path is not a directory: {path}")
        
        return path_obj
    
    @staticmethod
    def validate_resolution(width: int, height: int) -> Tuple[int, int]:
        """Validate video resolution"""
        if width <= 0 or height <= 0:
            raise ValidationError("Resolution must be positive integers")
        
        if width > 4096 or height > 4096:
            raise ValidationError("Resolution too high (max: 4096)")
        
        # Check aspect ratio for shorts (9:16)
        aspect_ratio = width / height
        if abs(aspect_ratio - 9/16) > 0.01:
            print(f"Warning: Aspect ratio {aspect_ratio:.2f} is not standard 9:16 for shorts")
        
        return width, height
    
    @staticmethod
    def validate_fps(fps: int) -> int:
        """Validate frames per second"""
        valid_fps = [24, 25, 30, 50, 60]
        
        if fps not in valid_fps:
            raise ValidationError(
                f"Invalid FPS: {fps}. "
                f"Valid values: {', '.join(map(str, valid_fps))}"
            )
        
        return fps
    
    @staticmethod
    def validate_duration(duration: float, min_duration: float = 0.1, max_duration: float = 60.0) -> float:
        """Validate duration in seconds"""
        if duration < min_duration:
            raise ValidationError(f"Duration too short: {duration}s (min: {min_duration}s)")
        
        if duration > max_duration:
            raise ValidationError(f"Duration too long: {duration}s (max: {max_duration}s)")
        
        return duration
    
    @staticmethod
    def validate_text(text: str, max_length: int = 500) -> str:
        """Validate text input"""
        if not text or not text.strip():
            raise ValidationError("Text cannot be empty")
        
        if len(text) > max_length:
            raise ValidationError(f"Text too long: {len(text)} chars (max: {max_length})")
        
        # Clean text
        text = text.strip()
        text = re.sub(r'\s+', ' ', text)  # Remove multiple spaces
        
        return text
    
    @staticmethod
    def validate_color(color: str) -> str:
        """Validate color in hex format"""
        if not re.match(r'^#[0-9A-Fa-f]{6}$', color):
            raise ValidationError(f"Invalid color format: {color}. Use hex format like #FFFFFF")
        
        return color.upper()
    
    @staticmethod
    def validate_file_size(path: str, max_size_mb: float = 100) -> Path:
        """Validate file size"""
        path_obj = Path(path)
        
        if not path_obj.exists():
            raise ValidationError(f"File not found: {path}")
        
        size_mb = path_obj.stat().st_size / (1024 * 1024)
        
        if size_mb > max_size_mb:
            raise ValidationError(f"File too large: {size_mb:.1f}MB (max: {max_size_mb}MB)")
        
        return path_obj
    
    @staticmethod
    def validate_batch_images(paths: List[str]) -> List[Path]:
        """Validate multiple image paths"""
        validated_paths = []
        
        for path in paths:
            try:
                validated_path = Validator.validate_image_path(path)
                validated_paths.append(validated_path)
            except ValidationError as e:
                print(f"Skipping invalid image: {e}")
        
        if not validated_paths:
            raise ValidationError("No valid images found")
        
        return validated_paths