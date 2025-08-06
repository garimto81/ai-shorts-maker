"""Audio processing and TTS module for Auto Shorts Generator"""

import asyncio
import os
from pathlib import Path
from typing import List, Optional, Union, Tuple
import edge_tts
from pydub import AudioSegment
from pydub.effects import normalize
from pydub.silence import detect_nonsilent
import numpy as np
from ..utils.logger import LoggerMixin
from ..utils.config import Config
from ..utils.validators import Validator


class AudioProcessor(LoggerMixin):
    """Process audio and generate TTS for videos"""
    
    # Available TTS voices
    VOICES = {
        'ko-KR': {
            'female': ['ko-KR-SunHiNeural', 'ko-KR-JiMinNeural'],
            'male': ['ko-KR-InJoonNeural', 'ko-KR-BongJinNeural']
        },
        'en-US': {
            'female': ['en-US-JennyNeural', 'en-US-AriaNeural'],
            'male': ['en-US-GuyNeural', 'en-US-DavisNeural']
        },
        'ja-JP': {
            'female': ['ja-JP-NanamiNeural', 'ja-JP-MayuNeural'],
            'male': ['ja-JP-KeitaNeural', 'ja-JP-DaichiNeural']
        }
    }
    
    def __init__(self, config: Optional[Config] = None):
        """Initialize audio processor"""
        self.config = config or Config()
        self.tts_enabled = self.config.get('audio.tts.enabled', True)
        self.tts_voice = self.config.get('audio.tts.voice', 'ko-KR-SunHiNeural')
        self.tts_rate = self.config.get('audio.tts.rate', 1.0)
        self.tts_pitch = self.config.get('audio.tts.pitch', 1.0)
        self.tts_volume = self.config.get('audio.tts.volume', 0.8)
        self.bgm_volume = self.config.get('audio.background_music.volume', 0.3)
        self.effects_volume = self.config.get('audio.effects.volume', 0.5)
        
    async def generate_tts(self, text: str, output_path: str,
                          voice: Optional[str] = None,
                          rate: Optional[float] = None,
                          pitch: Optional[float] = None) -> Path:
        """Generate TTS audio from text"""
        voice = voice or self.tts_voice
        rate = rate or self.tts_rate
        pitch = pitch or self.tts_pitch
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.logger.info(f"Generating TTS: voice={voice}, rate={rate}, pitch={pitch}")
        
        # Format rate and pitch for edge-tts
        rate_str = f"{int((rate - 1) * 100):+d}%"
        pitch_str = f"{int((pitch - 1) * 50):+d}Hz"
        
        # Create TTS communicate object
        communicate = edge_tts.Communicate(text, voice, rate=rate_str, pitch=pitch_str)
        
        # Save audio
        await communicate.save(str(output_path))
        
        self.logger.info(f"TTS generated: {output_path}")
        return output_path
    
    def generate_tts_sync(self, text: str, output_path: str, **kwargs) -> Path:
        """Synchronous wrapper for TTS generation"""
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(self.generate_tts(text, output_path, **kwargs))
    
    async def batch_generate_tts(self, texts: List[str],
                                output_dir: str,
                                voice: Optional[str] = None) -> List[Path]:
        """Generate TTS for multiple texts"""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        tasks = []
        for i, text in enumerate(texts):
            output_path = output_dir / f"tts_{i:03d}.mp3"
            task = self.generate_tts(text, str(output_path), voice=voice)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        return results
    
    def load_audio(self, audio_path: str) -> AudioSegment:
        """Load audio file"""
        path = Validator.validate_audio_path(audio_path)
        self.logger.info(f"Loading audio: {path}")
        
        audio = AudioSegment.from_file(str(path))
        return audio
    
    def adjust_volume(self, audio: AudioSegment, volume: float) -> AudioSegment:
        """Adjust audio volume (0.0 to 1.0)"""
        # Convert volume to dB
        if volume == 0:
            db_change = -120  # Effectively mute
        else:
            db_change = 20 * np.log10(volume)
        
        return audio + db_change
    
    def normalize_audio(self, audio: AudioSegment) -> AudioSegment:
        """Normalize audio levels"""
        return normalize(audio)
    
    def trim_silence(self, audio: AudioSegment,
                    silence_thresh: int = -40,
                    min_silence_len: int = 500) -> AudioSegment:
        """Trim silence from audio"""
        nonsilent_parts = detect_nonsilent(
            audio,
            min_silence_len=min_silence_len,
            silence_thresh=silence_thresh
        )
        
        if not nonsilent_parts:
            return audio
        
        # Get start and end of non-silent parts
        start = nonsilent_parts[0][0]
        end = nonsilent_parts[-1][1]
        
        return audio[start:end]
    
    def add_fade(self, audio: AudioSegment,
                fade_in: float = 0.0,
                fade_out: float = 0.0) -> AudioSegment:
        """Add fade in/out effects"""
        if fade_in > 0:
            audio = audio.fade_in(int(fade_in * 1000))
        
        if fade_out > 0:
            audio = audio.fade_out(int(fade_out * 1000))
        
        return audio
    
    def mix_audio(self, background: AudioSegment,
                 foreground: AudioSegment,
                 position: int = 0) -> AudioSegment:
        """Mix two audio tracks"""
        # Adjust position to milliseconds
        position_ms = position * 1000
        
        # Overlay foreground on background
        mixed = background.overlay(foreground, position=position_ms)
        
        return mixed
    
    def create_audio_track(self, narration_paths: List[str],
                          background_music: Optional[str] = None,
                          effects: Optional[List[Tuple[str, float]]] = None,
                          total_duration: float = None) -> AudioSegment:
        """Create complete audio track with narration, music, and effects"""
        self.logger.info("Creating audio track")
        
        # Create silent base track
        if total_duration:
            base_track = AudioSegment.silent(duration=int(total_duration * 1000))
        else:
            base_track = AudioSegment.silent(duration=1000)  # 1 second minimum
        
        # Add narration
        if narration_paths:
            narration_track = self._create_narration_track(narration_paths)
            narration_track = self.adjust_volume(narration_track, self.tts_volume)
            base_track = self.mix_audio(base_track, narration_track, position=0)
        
        # Add background music
        if background_music:
            bgm_track = self.load_audio(background_music)
            bgm_track = self.adjust_volume(bgm_track, self.bgm_volume)
            
            # Loop or trim music to match duration
            if total_duration:
                target_duration_ms = int(total_duration * 1000)
                if len(bgm_track) < target_duration_ms:
                    # Loop music
                    loops_needed = (target_duration_ms // len(bgm_track)) + 1
                    bgm_track = bgm_track * loops_needed
                
                bgm_track = bgm_track[:target_duration_ms]
            
            # Add fade in/out
            fade_duration = self.config.get('audio.background_music.fade_in', 2.0)
            bgm_track = self.add_fade(bgm_track, fade_in=fade_duration, fade_out=fade_duration)
            
            base_track = self.mix_audio(base_track, bgm_track, position=0)
        
        # Add sound effects
        if effects:
            for effect_path, position in effects:
                effect = self.load_audio(effect_path)
                effect = self.adjust_volume(effect, self.effects_volume)
                base_track = self.mix_audio(base_track, effect, position=position)
        
        # Normalize final track
        base_track = self.normalize_audio(base_track)
        
        return base_track
    
    def _create_narration_track(self, narration_paths: List[str]) -> AudioSegment:
        """Create narration track from multiple audio files"""
        narration_segments = []
        
        for path in narration_paths:
            audio = self.load_audio(path)
            audio = self.trim_silence(audio)
            narration_segments.append(audio)
            
            # Add small pause between segments
            narration_segments.append(AudioSegment.silent(duration=500))
        
        # Concatenate all segments
        if narration_segments:
            return sum(narration_segments)
        else:
            return AudioSegment.silent(duration=1000)
    
    def save_audio(self, audio: AudioSegment, output_path: str,
                  format: str = 'mp3', bitrate: str = '192k'):
        """Save audio to file"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        audio.export(
            str(output_path),
            format=format,
            bitrate=bitrate
        )
        
        self.logger.info(f"Audio saved: {output_path}")
    
    def get_audio_duration(self, audio_path: str) -> float:
        """Get duration of audio file in seconds"""
        audio = self.load_audio(audio_path)
        return len(audio) / 1000.0
    
    def extract_audio_from_video(self, video_path: str,
                                 output_path: str) -> Path:
        """Extract audio track from video file"""
        from moviepy.editor import VideoFileClip
        
        video = VideoFileClip(video_path)
        audio = video.audio
        
        if audio:
            audio.write_audiofile(output_path)
            self.logger.info(f"Audio extracted: {output_path}")
        else:
            self.logger.warning(f"No audio track found in video: {video_path}")
        
        return Path(output_path)
    
    def analyze_audio(self, audio: AudioSegment) -> dict:
        """Analyze audio properties"""
        return {
            'duration_seconds': len(audio) / 1000.0,
            'channels': audio.channels,
            'sample_width': audio.sample_width,
            'frame_rate': audio.frame_rate,
            'frame_count': audio.frame_count(),
            'max_dBFS': audio.max_dBFS,
            'rms': audio.rms
        }
    
    async def list_available_voices(self, language: Optional[str] = None) -> List[str]:
        """List available TTS voices"""
        voices = await edge_tts.list_voices()
        
        if language:
            voices = [v for v in voices if v['Locale'].startswith(language)]
        
        return [v['ShortName'] for v in voices]