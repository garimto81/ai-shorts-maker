"""Text processing and subtitle generation module"""

import re
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Any
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import json
import yaml
from dataclasses import dataclass
from ..utils.logger import LoggerMixin
from ..utils.config import Config
from ..utils.validators import Validator


@dataclass
class TextClip:
    """Data class for text clips"""
    text: str
    start_time: float
    duration: float
    position: str = 'bottom'
    font_size: int = 48
    color: str = '#FFFFFF'
    stroke_color: str = '#000000'
    stroke_width: int = 2
    animation: str = 'fade'
    animation_duration: float = 0.5


class TextProcessor(LoggerMixin):
    """Process text and generate subtitles for videos"""
    
    def __init__(self, config: Optional[Config] = None):
        """Initialize text processor"""
        self.config = config or Config()
        self.default_font_family = self.config.get('text.font_family', 'Arial')
        self.default_font_size = self.config.get('text.font_size', 48)
        self.default_color = self.config.get('text.color', '#FFFFFF')
        self.default_stroke_color = self.config.get('text.stroke_color', '#000000')
        self.default_stroke_width = self.config.get('text.stroke_width', 2)
        self.default_position = self.config.get('text.position', 'bottom')
        self.max_chars_per_line = self.config.get('text.max_chars_per_line', 30)
        self.fonts_cache = {}
        
    def parse_script(self, script_path: str) -> List[Dict[str, Any]]:
        """Parse script file (txt, json, yaml)"""
        path = Path(script_path)
        
        if not path.exists():
            raise FileNotFoundError(f"Script file not found: {script_path}")
        
        extension = path.suffix.lower()
        
        if extension == '.txt':
            return self._parse_txt_script(path)
        elif extension == '.json':
            return self._parse_json_script(path)
        elif extension in ['.yaml', '.yml']:
            return self._parse_yaml_script(path)
        else:
            raise ValueError(f"Unsupported script format: {extension}")
    
    def _parse_txt_script(self, path: Path) -> List[Dict[str, Any]]:
        """Parse plain text script"""
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        scripts = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#'):  # Skip comments
                scripts.append({
                    'text': line,
                    'duration': 3.0  # Default duration
                })
        
        return scripts
    
    def _parse_json_script(self, path: Path) -> List[Dict[str, Any]]:
        """Parse JSON script"""
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if isinstance(data, list):
            return data
        elif isinstance(data, dict) and 'scripts' in data:
            return data['scripts']
        else:
            raise ValueError("Invalid JSON script format")
    
    def _parse_yaml_script(self, path: Path) -> List[Dict[str, Any]]:
        """Parse YAML script"""
        with open(path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        if isinstance(data, list):
            return data
        elif isinstance(data, dict) and 'scripts' in data:
            return data['scripts']
        else:
            raise ValueError("Invalid YAML script format")
    
    def create_text_clips(self, scripts: List[Dict[str, Any]], 
                         start_time: float = 0.0) -> List[TextClip]:
        """Create text clips from scripts"""
        clips = []
        current_time = start_time
        
        for script in scripts:
            text = script.get('text', '')
            duration = script.get('duration', 3.0)
            
            # Split long text into multiple lines
            text = self._wrap_text(text)
            
            clip = TextClip(
                text=text,
                start_time=current_time,
                duration=duration,
                position=script.get('position', self.default_position),
                font_size=script.get('font_size', self.default_font_size),
                color=script.get('color', self.default_color),
                stroke_color=script.get('stroke_color', self.default_stroke_color),
                stroke_width=script.get('stroke_width', self.default_stroke_width),
                animation=script.get('animation', 'fade'),
                animation_duration=script.get('animation_duration', 0.5)
            )
            
            clips.append(clip)
            current_time += duration
        
        return clips
    
    def _wrap_text(self, text: str) -> str:
        """Wrap text to fit within max characters per line"""
        words = text.split()
        lines = []
        current_line = []
        current_length = 0
        
        for word in words:
            word_length = len(word)
            
            if current_length + word_length + len(current_line) <= self.max_chars_per_line:
                current_line.append(word)
                current_length += word_length
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
                current_length = word_length
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return '\n'.join(lines)
    
    def render_text_on_image(self, image: np.ndarray, clip: TextClip,
                            progress: float = 1.0) -> np.ndarray:
        """Render text on image with effects"""
        # Convert numpy array to PIL Image
        pil_image = Image.fromarray(image)
        draw = ImageDraw.Draw(pil_image)
        
        # Get font
        font = self._get_font(self.default_font_family, clip.font_size)
        
        # Calculate text position
        text_bbox = draw.textbbox((0, 0), clip.text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        img_width, img_height = pil_image.size
        
        # Calculate position
        if clip.position == 'top':
            y = 100
        elif clip.position == 'center':
            y = (img_height - text_height) // 2
        else:  # bottom
            y = img_height - text_height - 100
        
        x = (img_width - text_width) // 2
        
        # Apply animation alpha
        alpha = self._calculate_animation_alpha(clip, progress)
        
        # Create text image with transparency
        text_img = Image.new('RGBA', pil_image.size, (0, 0, 0, 0))
        text_draw = ImageDraw.Draw(text_img)
        
        # Draw text with stroke
        if clip.stroke_width > 0:
            # Draw stroke
            for adj_x in range(-clip.stroke_width, clip.stroke_width + 1):
                for adj_y in range(-clip.stroke_width, clip.stroke_width + 1):
                    if adj_x != 0 or adj_y != 0:
                        text_draw.text(
                            (x + adj_x, y + adj_y),
                            clip.text,
                            font=font,
                            fill=(*self._hex_to_rgb(clip.stroke_color), int(255 * alpha))
                        )
        
        # Draw main text
        text_draw.text(
            (x, y),
            clip.text,
            font=font,
            fill=(*self._hex_to_rgb(clip.color), int(255 * alpha))
        )
        
        # Composite text onto image
        pil_image = Image.alpha_composite(
            pil_image.convert('RGBA'),
            text_img
        ).convert('RGB')
        
        return np.array(pil_image)
    
    def _calculate_animation_alpha(self, clip: TextClip, progress: float) -> float:
        """Calculate alpha value based on animation"""
        if clip.animation == 'none':
            return 1.0
        
        fade_duration = clip.animation_duration / clip.duration
        
        if clip.animation == 'fade':
            # Fade in and out
            if progress < fade_duration:
                return progress / fade_duration
            elif progress > 1 - fade_duration:
                return (1 - progress) / fade_duration
            else:
                return 1.0
        elif clip.animation == 'slide':
            # Slide in effect (alpha only)
            if progress < fade_duration:
                return progress / fade_duration
            else:
                return 1.0
        elif clip.animation == 'typewriter':
            # Typewriter effect (simplified - just fade)
            return min(1.0, progress * 2)
        
        return 1.0
    
    def _get_font(self, font_family: str, size: int) -> ImageFont.FreeTypeFont:
        """Get or load font"""
        font_key = f"{font_family}_{size}"
        
        if font_key in self.fonts_cache:
            return self.fonts_cache[font_key]
        
        # Try to load font
        font_paths = [
            Path(__file__).parent.parent.parent / "assets" / "fonts" / f"{font_family}.ttf",
            Path(__file__).parent.parent.parent / "assets" / "fonts" / f"{font_family}.otf",
        ]
        
        for font_path in font_paths:
            if font_path.exists():
                font = ImageFont.truetype(str(font_path), size)
                self.fonts_cache[font_key] = font
                return font
        
        # Fallback to default font
        try:
            font = ImageFont.truetype("arial.ttf", size)
        except:
            font = ImageFont.load_default()
        
        self.fonts_cache[font_key] = font
        return font
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def create_subtitle_file(self, clips: List[TextClip], output_path: str,
                            format: str = 'srt'):
        """Create subtitle file (SRT or VTT)"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if format == 'srt':
            self._create_srt_file(clips, output_path)
        elif format == 'vtt':
            self._create_vtt_file(clips, output_path)
        else:
            raise ValueError(f"Unsupported subtitle format: {format}")
        
        self.logger.info(f"Created subtitle file: {output_path}")
    
    def _create_srt_file(self, clips: List[TextClip], output_path: Path):
        """Create SRT subtitle file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            for i, clip in enumerate(clips, 1):
                # Write subtitle number
                f.write(f"{i}\n")
                
                # Write timecode
                start = self._seconds_to_timecode(clip.start_time)
                end = self._seconds_to_timecode(clip.start_time + clip.duration)
                f.write(f"{start} --> {end}\n")
                
                # Write text
                f.write(f"{clip.text}\n\n")
    
    def _create_vtt_file(self, clips: List[TextClip], output_path: Path):
        """Create WebVTT subtitle file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("WEBVTT\n\n")
            
            for clip in clips:
                # Write timecode
                start = self._seconds_to_timecode(clip.start_time, vtt=True)
                end = self._seconds_to_timecode(clip.start_time + clip.duration, vtt=True)
                f.write(f"{start} --> {end}\n")
                
                # Write text
                f.write(f"{clip.text}\n\n")
    
    def _seconds_to_timecode(self, seconds: float, vtt: bool = False) -> str:
        """Convert seconds to timecode format"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = seconds % 60
        
        if vtt:
            return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"
        else:
            # SRT uses comma for milliseconds
            return f"{hours:02d}:{minutes:02d}:{secs:06.3f}".replace('.', ',')