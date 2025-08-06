"""Video generation engine for Auto Shorts Generator"""

import numpy as np
from pathlib import Path
from typing import List, Optional, Union, Tuple, Any
from moviepy.editor import (
    VideoClip, ImageClip, TextClip, CompositeVideoClip,
    concatenate_videoclips, AudioFileClip, CompositeAudioClip
)
from moviepy.video.fx import fadein, fadeout, resize
from moviepy.video.tools.drawing import color_gradient
import moviepy.video.fx.all as vfx
from dataclasses import dataclass
from ..utils.logger import LoggerMixin
from ..utils.config import Config
from ..utils.validators import Validator
from .text_processor import TextClip as TextClipData


@dataclass
class Scene:
    """Data class for video scenes"""
    image: np.ndarray
    duration: float
    text_clip: Optional[TextClipData] = None
    transition: str = 'fade'
    transition_duration: float = 0.5
    audio_clip: Optional[str] = None


class VideoGenerator(LoggerMixin):
    """Generate videos from images and text"""
    
    def __init__(self, config: Optional[Config] = None):
        """Initialize video generator"""
        self.config = config or Config()
        self.width = self.config.get('video.width', 1080)
        self.height = self.config.get('video.height', 1920)
        self.fps = self.config.get('video.fps', 30)
        self.codec = self.config.get('video.codec', 'libx264')
        self.format = self.config.get('video.format', 'mp4')
        self.quality = self.config.get('video.quality', 'high')
        self.bitrate = self.config.get('video.bitrate', '5M')
        
    def create_scene(self, image: np.ndarray, duration: float,
                    text_clip: Optional[TextClipData] = None,
                    transition: str = 'fade',
                    transition_duration: float = 0.5) -> Scene:
        """Create a scene from image and optional text"""
        return Scene(
            image=image,
            duration=duration,
            text_clip=text_clip,
            transition=transition,
            transition_duration=transition_duration
        )
    
    def generate_video_clip(self, scene: Scene) -> VideoClip:
        """Generate MoviePy video clip from scene"""
        # Create image clip
        image_clip = ImageClip(scene.image, duration=scene.duration)
        
        # Add text if provided
        if scene.text_clip:
            image_clip = self._add_text_to_clip(image_clip, scene.text_clip)
        
        # Apply transition effects
        if scene.transition == 'fade':
            # Apply fade in and fade out
            if scene.transition_duration > 0:
                image_clip = image_clip.fx(
                    fadein, scene.transition_duration
                ).fx(
                    fadeout, scene.transition_duration
                )
        
        return image_clip
    
    def _add_text_to_clip(self, video_clip: VideoClip, 
                         text_data: TextClipData) -> VideoClip:
        """Add text overlay to video clip"""
        # Create text clip
        text_clip = TextClip(
            text_data.text,
            fontsize=text_data.font_size,
            color=text_data.color,
            stroke_color=text_data.stroke_color,
            stroke_width=text_data.stroke_width,
            font='Arial',
            method='label',
            size=(self.width - 100, None)
        )
        
        # Position text
        if text_data.position == 'top':
            text_clip = text_clip.set_position(('center', 100))
        elif text_data.position == 'center':
            text_clip = text_clip.set_position('center')
        else:  # bottom
            text_clip = text_clip.set_position(('center', self.height - 200))
        
        # Set duration and timing
        text_clip = text_clip.set_duration(text_data.duration)
        text_clip = text_clip.set_start(0)
        
        # Apply text animation
        if text_data.animation == 'fade':
            text_clip = text_clip.fx(
                fadein, text_data.animation_duration
            ).fx(
                fadeout, text_data.animation_duration
            )
        
        # Composite text over video
        return CompositeVideoClip([video_clip, text_clip])
    
    def apply_transition(self, clip1: VideoClip, clip2: VideoClip,
                        transition_type: str = 'fade',
                        duration: float = 0.5) -> VideoClip:
        """Apply transition between two clips"""
        if transition_type == 'fade':
            return self._fade_transition(clip1, clip2, duration)
        elif transition_type == 'slide':
            return self._slide_transition(clip1, clip2, duration)
        elif transition_type == 'zoom':
            return self._zoom_transition(clip1, clip2, duration)
        elif transition_type == 'wipe':
            return self._wipe_transition(clip1, clip2, duration)
        else:
            # No transition, just concatenate
            return concatenate_videoclips([clip1, clip2])
    
    def _fade_transition(self, clip1: VideoClip, clip2: VideoClip,
                        duration: float) -> VideoClip:
        """Fade transition between clips"""
        # Fade out first clip
        clip1 = clip1.fx(fadeout, duration)
        
        # Fade in second clip
        clip2 = clip2.fx(fadein, duration)
        
        # Overlap clips
        clip2 = clip2.set_start(clip1.duration - duration)
        
        return CompositeVideoClip([clip1, clip2])
    
    def _slide_transition(self, clip1: VideoClip, clip2: VideoClip,
                         duration: float) -> VideoClip:
        """Slide transition between clips"""
        # Create sliding effect
        def slide_out(t):
            if t < clip1.duration - duration:
                return ['center', 'center']
            else:
                progress = (t - (clip1.duration - duration)) / duration
                return [self.width * progress, 'center']
        
        def slide_in(t):
            if t < duration:
                progress = t / duration
                return [-self.width * (1 - progress), 'center']
            else:
                return ['center', 'center']
        
        clip1 = clip1.set_position(slide_out)
        clip2 = clip2.set_position(slide_in)
        clip2 = clip2.set_start(clip1.duration - duration)
        
        return CompositeVideoClip([clip1, clip2])
    
    def _zoom_transition(self, clip1: VideoClip, clip2: VideoClip,
                        duration: float) -> VideoClip:
        """Zoom transition between clips"""
        # Zoom out first clip
        def zoom_out(t):
            if t < clip1.duration - duration:
                return 1.0
            else:
                progress = (t - (clip1.duration - duration)) / duration
                return 1.0 + progress * 0.5
        
        # Zoom in second clip
        def zoom_in(t):
            if t < duration:
                progress = t / duration
                return 0.5 + progress * 0.5
            else:
                return 1.0
        
        clip1 = clip1.resize(zoom_out)
        clip2 = clip2.resize(zoom_in)
        clip2 = clip2.set_start(clip1.duration - duration)
        
        return CompositeVideoClip([clip1, clip2])
    
    def _wipe_transition(self, clip1: VideoClip, clip2: VideoClip,
                        duration: float) -> VideoClip:
        """Wipe transition between clips"""
        # Create wipe mask
        def make_mask(t):
            if t < clip1.duration - duration:
                return np.ones((self.height, self.width))
            else:
                progress = (t - (clip1.duration - duration)) / duration
                mask = np.zeros((self.height, self.width))
                wipe_position = int(self.width * progress)
                mask[:, :wipe_position] = 1
                return mask
        
        # Apply mask to clips
        mask_clip = VideoClip(make_mask, duration=clip1.duration, ismask=True)
        clip1 = clip1.set_mask(mask_clip)
        
        clip2 = clip2.set_start(clip1.duration - duration)
        
        return CompositeVideoClip([clip2, clip1])
    
    def compile_scenes(self, scenes: List[Scene],
                      background_music: Optional[str] = None,
                      narration: Optional[str] = None) -> CompositeVideoClip:
        """Compile multiple scenes into a single video"""
        clips = []
        current_time = 0
        
        for i, scene in enumerate(scenes):
            # Generate clip for scene
            clip = self.generate_video_clip(scene)
            
            # Set clip timing
            clip = clip.set_start(current_time)
            clips.append(clip)
            
            # Add transition to next scene
            if i < len(scenes) - 1:
                current_time += scene.duration - scene.transition_duration
            else:
                current_time += scene.duration
        
        # Create composite video
        video = CompositeVideoClip(clips, size=(self.width, self.height))
        
        # Add audio if provided
        if background_music or narration:
            video = self._add_audio(video, background_music, narration)
        
        return video
    
    def _add_audio(self, video: CompositeVideoClip,
                  background_music: Optional[str] = None,
                  narration: Optional[str] = None) -> CompositeVideoClip:
        """Add audio tracks to video"""
        audio_clips = []
        
        # Add background music
        if background_music:
            music_path = Validator.validate_audio_path(background_music)
            music_clip = AudioFileClip(str(music_path))
            
            # Loop music if necessary
            if music_clip.duration < video.duration:
                music_clip = music_clip.loop(duration=video.duration)
            else:
                music_clip = music_clip.subclip(0, video.duration)
            
            # Reduce volume for background
            music_clip = music_clip.volumex(0.3)
            audio_clips.append(music_clip)
        
        # Add narration
        if narration:
            narration_path = Validator.validate_audio_path(narration)
            narration_clip = AudioFileClip(str(narration_path))
            
            # Adjust narration volume
            narration_clip = narration_clip.volumex(0.8)
            audio_clips.append(narration_clip)
        
        # Composite audio
        if audio_clips:
            final_audio = CompositeAudioClip(audio_clips)
            video = video.set_audio(final_audio)
        
        return video
    
    def render_video(self, video: CompositeVideoClip, output_path: str,
                    compress: bool = True, preview: bool = False):
        """Render video to file"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Set codec parameters
        codec_params = self._get_codec_params(compress)
        
        self.logger.info(f"Rendering video to: {output_path}")
        
        # Preview if requested
        if preview:
            video.preview(fps=self.fps)
        
        # Write video file
        video.write_videofile(
            str(output_path),
            fps=self.fps,
            codec=self.codec,
            bitrate=self.bitrate,
            threads=4,
            preset='medium' if compress else 'slow',
            ffmpeg_params=codec_params
        )
        
        self.logger.info(f"Video rendered successfully: {output_path}")
        
        # Validate output file size
        file_size_mb = output_path.stat().st_size / (1024 * 1024)
        self.logger.info(f"Output file size: {file_size_mb:.1f} MB")
        
        max_size = self.config.get('output.max_file_size', 50)
        if file_size_mb > max_size:
            self.logger.warning(f"File size exceeds limit: {file_size_mb:.1f} MB > {max_size} MB")
    
    def _get_codec_params(self, compress: bool) -> List[str]:
        """Get codec parameters for video encoding"""
        params = []
        
        if self.quality == 'ultra':
            params.extend(['-crf', '18'])
        elif self.quality == 'high':
            params.extend(['-crf', '23'])
        elif self.quality == 'medium':
            params.extend(['-crf', '28'])
        else:  # low
            params.extend(['-crf', '33'])
        
        if compress:
            params.extend([
                '-movflags', '+faststart',
                '-pix_fmt', 'yuv420p'
            ])
        
        return params
    
    def create_thumbnail(self, video_path: str, output_path: str,
                        timestamp: float = 0.0):
        """Create thumbnail from video"""
        from moviepy.editor import VideoFileClip
        
        video = VideoFileClip(video_path)
        frame = video.get_frame(timestamp)
        
        # Save thumbnail
        from PIL import Image
        img = Image.fromarray(frame)
        img.save(output_path)
        
        self.logger.info(f"Thumbnail created: {output_path}")