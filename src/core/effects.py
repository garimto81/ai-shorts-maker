"""Effects and transitions manager for Auto Shorts Generator"""

import numpy as np
from typing import Optional, Tuple, Callable
from moviepy.editor import VideoClip, ImageClip
import moviepy.video.fx.all as vfx
from ..utils.logger import LoggerMixin
from ..utils.config import Config


class EffectsManager(LoggerMixin):
    """Manage video effects and transitions"""
    
    def __init__(self, config: Optional[Config] = None):
        """Initialize effects manager"""
        self.config = config or Config()
        self.transition_duration = self.config.get('image.transition_duration', 0.5)
        
    def apply_ken_burns(self, image_clip: ImageClip,
                       zoom_ratio: float = 1.2,
                       direction: str = 'in') -> VideoClip:
        """Apply Ken Burns effect (slow zoom)"""
        duration = image_clip.duration
        
        if direction == 'in':
            # Zoom in
            zoom_func = lambda t: 1 + (zoom_ratio - 1) * (t / duration)
        else:
            # Zoom out
            zoom_func = lambda t: zoom_ratio - (zoom_ratio - 1) * (t / duration)
        
        return image_clip.resize(zoom_func)
    
    def apply_pan(self, image_clip: ImageClip,
                 start_pos: Tuple[str, str] = ('left', 'center'),
                 end_pos: Tuple[str, str] = ('right', 'center')) -> VideoClip:
        """Apply panning effect"""
        duration = image_clip.duration
        w, h = image_clip.size
        
        # Convert positions to coordinates
        start_x, start_y = self._position_to_coords(start_pos, w, h)
        end_x, end_y = self._position_to_coords(end_pos, w, h)
        
        def position_func(t):
            progress = t / duration
            x = start_x + (end_x - start_x) * progress
            y = start_y + (end_y - start_y) * progress
            return (x, y)
        
        return image_clip.set_position(position_func)
    
    def _position_to_coords(self, position: Tuple[str, str],
                           width: int, height: int) -> Tuple[int, int]:
        """Convert position strings to coordinates"""
        x_pos, y_pos = position
        
        # X coordinate
        if x_pos == 'left':
            x = 0
        elif x_pos == 'center':
            x = width // 2
        elif x_pos == 'right':
            x = width
        else:
            x = int(x_pos) if isinstance(x_pos, (int, str)) else width // 2
        
        # Y coordinate
        if y_pos == 'top':
            y = 0
        elif y_pos == 'center':
            y = height // 2
        elif y_pos == 'bottom':
            y = height
        else:
            y = int(y_pos) if isinstance(y_pos, (int, str)) else height // 2
        
        return x, y
    
    def apply_blur_background(self, clip: VideoClip,
                             blur_radius: int = 10) -> VideoClip:
        """Apply blur to background"""
        # Create blurred version
        blurred = clip.fl_image(lambda img: self._gaussian_blur(img, blur_radius))
        
        # Resize original to 80% and center
        foreground = clip.resize(0.8)
        foreground = foreground.set_position('center')
        
        # Composite
        from moviepy.editor import CompositeVideoClip
        return CompositeVideoClip([blurred, foreground])
    
    def _gaussian_blur(self, image: np.ndarray, radius: int) -> np.ndarray:
        """Apply Gaussian blur to image"""
        import cv2
        kernel_size = radius * 2 + 1
        return cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
    
    def apply_vignette(self, clip: VideoClip,
                      intensity: float = 0.5) -> VideoClip:
        """Apply vignette effect"""
        def vignette_filter(image):
            h, w = image.shape[:2]
            
            # Create radial gradient
            y, x = np.ogrid[:h, :w]
            center_y, center_x = h / 2, w / 2
            
            # Calculate distance from center
            dist = np.sqrt((x - center_x)**2 + (y - center_y)**2)
            max_dist = np.sqrt(center_x**2 + center_y**2)
            
            # Create vignette mask
            vignette = 1 - (dist / max_dist) * intensity
            vignette = np.clip(vignette, 0, 1)
            
            # Apply vignette
            if len(image.shape) == 3:
                vignette = np.stack([vignette] * 3, axis=-1)
            
            return (image * vignette).astype(np.uint8)
        
        return clip.fl_image(vignette_filter)
    
    def apply_color_filter(self, clip: VideoClip,
                          filter_type: str = 'sepia') -> VideoClip:
        """Apply color filters"""
        if filter_type == 'sepia':
            return self._apply_sepia(clip)
        elif filter_type == 'grayscale':
            return clip.fx(vfx.blackwhite)
        elif filter_type == 'vintage':
            return self._apply_vintage(clip)
        elif filter_type == 'cool':
            return self._apply_color_tone(clip, (0.9, 0.95, 1.0))
        elif filter_type == 'warm':
            return self._apply_color_tone(clip, (1.0, 0.95, 0.9))
        else:
            return clip
    
    def _apply_sepia(self, clip: VideoClip) -> VideoClip:
        """Apply sepia filter"""
        def sepia_filter(image):
            # Sepia matrix
            sepia_matrix = np.array([
                [0.393, 0.769, 0.189],
                [0.349, 0.686, 0.168],
                [0.272, 0.534, 0.131]
            ])
            
            # Apply sepia transformation
            sepia = image @ sepia_matrix.T
            sepia = np.clip(sepia, 0, 255)
            
            return sepia.astype(np.uint8)
        
        return clip.fl_image(sepia_filter)
    
    def _apply_vintage(self, clip: VideoClip) -> VideoClip:
        """Apply vintage filter"""
        # Reduce saturation and add warm tone
        clip = self._apply_color_tone(clip, (1.0, 0.9, 0.8))
        # Add vignette
        clip = self.apply_vignette(clip, intensity=0.7)
        # Reduce contrast slightly
        clip = clip.fx(vfx.colorx, 0.9)
        
        return clip
    
    def _apply_color_tone(self, clip: VideoClip,
                         tone: Tuple[float, float, float]) -> VideoClip:
        """Apply color tone adjustment"""
        def tone_filter(image):
            r_factor, g_factor, b_factor = tone
            
            if len(image.shape) == 3:
                result = image.copy()
                result[:, :, 0] = np.clip(result[:, :, 0] * r_factor, 0, 255)
                result[:, :, 1] = np.clip(result[:, :, 1] * g_factor, 0, 255)
                result[:, :, 2] = np.clip(result[:, :, 2] * b_factor, 0, 255)
                return result.astype(np.uint8)
            else:
                return image
        
        return clip.fl_image(tone_filter)
    
    def apply_shake(self, clip: VideoClip,
                   amplitude: int = 5,
                   frequency: float = 10) -> VideoClip:
        """Apply camera shake effect"""
        def shake_position(t):
            # Generate random shake
            dx = amplitude * np.sin(2 * np.pi * frequency * t)
            dy = amplitude * np.cos(2 * np.pi * frequency * t * 1.3)
            return (dx, dy)
        
        return clip.set_position(shake_position)
    
    def apply_glitch(self, clip: VideoClip,
                    intensity: float = 0.1,
                    frequency: float = 0.05) -> VideoClip:
        """Apply glitch effect"""
        def glitch_filter(get_frame, t):
            frame = get_frame(t)
            
            # Random chance of glitch
            if np.random.random() < frequency:
                # Shift color channels
                shift = int(intensity * frame.shape[1])
                glitched = frame.copy()
                
                # Shift red channel
                glitched[:, shift:, 0] = frame[:, :-shift, 0]
                # Shift blue channel opposite
                glitched[:, :-shift, 2] = frame[:, shift:, 2]
                
                # Add noise
                noise = np.random.randint(0, 50, frame.shape, dtype=np.uint8)
                glitched = np.clip(glitched.astype(int) + noise, 0, 255).astype(np.uint8)
                
                return glitched
            
            return frame
        
        return clip.fl(glitch_filter)
    
    def apply_slow_motion(self, clip: VideoClip,
                         factor: float = 0.5) -> VideoClip:
        """Apply slow motion effect"""
        return clip.fx(vfx.speedx, factor)
    
    def apply_speed_ramp(self, clip: VideoClip,
                        start_speed: float = 1.0,
                        end_speed: float = 0.5) -> VideoClip:
        """Apply speed ramping effect"""
        def speed_func(t):
            progress = t / clip.duration
            speed = start_speed + (end_speed - start_speed) * progress
            return speed
        
        # This is a simplified version - MoviePy doesn't directly support variable speed
        # For full implementation, would need to reconstruct clip with variable frame sampling
        avg_speed = (start_speed + end_speed) / 2
        return clip.fx(vfx.speedx, avg_speed)
    
    def create_transition(self, clip1: VideoClip, clip2: VideoClip,
                         transition_type: str = 'fade',
                         duration: Optional[float] = None) -> VideoClip:
        """Create transition between two clips"""
        duration = duration or self.transition_duration
        
        transitions = {
            'fade': self._fade_transition,
            'slide_left': lambda c1, c2, d: self._slide_transition(c1, c2, d, 'left'),
            'slide_right': lambda c1, c2, d: self._slide_transition(c1, c2, d, 'right'),
            'slide_up': lambda c1, c2, d: self._slide_transition(c1, c2, d, 'up'),
            'slide_down': lambda c1, c2, d: self._slide_transition(c1, c2, d, 'down'),
            'zoom': self._zoom_transition,
            'dissolve': self._dissolve_transition,
            'wipe': self._wipe_transition
        }
        
        transition_func = transitions.get(transition_type, self._fade_transition)
        return transition_func(clip1, clip2, duration)
    
    def _fade_transition(self, clip1: VideoClip, clip2: VideoClip,
                        duration: float) -> VideoClip:
        """Fade transition"""
        from moviepy.editor import CompositeVideoClip
        
        clip1 = clip1.fx(vfx.fadeout, duration)
        clip2 = clip2.fx(vfx.fadein, duration)
        clip2 = clip2.set_start(clip1.duration - duration)
        
        return CompositeVideoClip([clip1, clip2])
    
    def _slide_transition(self, clip1: VideoClip, clip2: VideoClip,
                         duration: float, direction: str) -> VideoClip:
        """Slide transition"""
        from moviepy.editor import CompositeVideoClip
        
        w, h = clip1.size
        
        if direction == 'left':
            pos1 = lambda t: (-w * min(1, max(0, (t - clip1.duration + duration) / duration)), 0)
            pos2 = lambda t: (w * (1 - min(1, t / duration)), 0)
        elif direction == 'right':
            pos1 = lambda t: (w * min(1, max(0, (t - clip1.duration + duration) / duration)), 0)
            pos2 = lambda t: (-w * (1 - min(1, t / duration)), 0)
        elif direction == 'up':
            pos1 = lambda t: (0, -h * min(1, max(0, (t - clip1.duration + duration) / duration)))
            pos2 = lambda t: (0, h * (1 - min(1, t / duration)))
        else:  # down
            pos1 = lambda t: (0, h * min(1, max(0, (t - clip1.duration + duration) / duration)))
            pos2 = lambda t: (0, -h * (1 - min(1, t / duration)))
        
        clip1 = clip1.set_position(pos1)
        clip2 = clip2.set_position(pos2)
        clip2 = clip2.set_start(clip1.duration - duration)
        
        return CompositeVideoClip([clip1, clip2], size=(w, h))
    
    def _zoom_transition(self, clip1: VideoClip, clip2: VideoClip,
                        duration: float) -> VideoClip:
        """Zoom transition"""
        from moviepy.editor import CompositeVideoClip
        
        # Zoom out first clip
        zoom_out = lambda t: 1.0 + 0.5 * max(0, (t - clip1.duration + duration) / duration)
        clip1 = clip1.resize(zoom_out)
        clip1 = clip1.fx(vfx.fadeout, duration)
        
        # Zoom in second clip
        zoom_in = lambda t: 0.5 + 0.5 * min(1, t / duration)
        clip2 = clip2.resize(zoom_in)
        clip2 = clip2.fx(vfx.fadein, duration)
        clip2 = clip2.set_start(clip1.duration - duration)
        
        return CompositeVideoClip([clip1, clip2])
    
    def _dissolve_transition(self, clip1: VideoClip, clip2: VideoClip,
                            duration: float) -> VideoClip:
        """Dissolve transition"""
        # Similar to fade but with different timing
        return self._fade_transition(clip1, clip2, duration)
    
    def _wipe_transition(self, clip1: VideoClip, clip2: VideoClip,
                        duration: float) -> VideoClip:
        """Wipe transition"""
        from moviepy.editor import CompositeVideoClip
        
        # Create a moving mask
        w, h = clip1.size
        
        def make_mask(t):
            progress = max(0, min(1, (t - clip1.duration + duration) / duration))
            mask = np.zeros((h, w))
            wipe_pos = int(w * progress)
            mask[:, :wipe_pos] = 1
            return mask
        
        mask_clip = VideoClip(make_mask, duration=clip1.duration, ismask=True)
        clip1 = clip1.set_mask(mask_clip)
        
        clip2 = clip2.set_start(clip1.duration - duration)
        
        return CompositeVideoClip([clip2, clip1])