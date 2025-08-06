"""Main entry point for Auto Shorts Generator"""

import asyncio
import argparse
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from tqdm import tqdm

from core import (
    ImageProcessor,
    TextProcessor,
    VideoGenerator,
    AudioProcessor,
    EffectsManager
)
from utils import Config, setup_logger, get_logger


class ShortsGenerator:
    """Main class for generating shorts videos"""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize shorts generator"""
        self.config = Config()
        if config_path:
            self.config.load_config(config_path)
        
        self.logger = setup_logger()
        
        # Initialize processors
        self.image_processor = ImageProcessor(self.config)
        self.text_processor = TextProcessor(self.config)
        self.video_generator = VideoGenerator(self.config)
        self.audio_processor = AudioProcessor(self.config)
        self.effects_manager = EffectsManager(self.config)
        
    def generate_from_folder(self, 
                           images_folder: str,
                           script_file: str,
                           output_path: str,
                           template: str = 'basic',
                           background_music: Optional[str] = None,
                           use_tts: bool = True):
        """Generate shorts from folder of images and script file"""
        self.logger.info("Starting shorts generation from folder")
        
        # Load images
        images_path = Path(images_folder)
        image_files = sorted(list(images_path.glob("*.jpg")) + 
                           list(images_path.glob("*.png")) +
                           list(images_path.glob("*.jpeg")))
        
        if not image_files:
            raise ValueError(f"No images found in {images_folder}")
        
        self.logger.info(f"Found {len(image_files)} images")
        
        # Load and parse script
        scripts = self.text_processor.parse_script(script_file)
        self.logger.info(f"Loaded {len(scripts)} script entries")
        
        # Generate shorts
        asyncio.run(self._generate_async(
            image_files, scripts, output_path,
            template, background_music, use_tts
        ))
    
    async def _generate_async(self,
                            image_files: List[Path],
                            scripts: List[Dict[str, Any]],
                            output_path: str,
                            template: str,
                            background_music: Optional[str],
                            use_tts: bool):
        """Async generation process"""
        # Process images
        self.logger.info("Processing images...")
        processed_images = []
        
        for img_path in tqdm(image_files, desc="Processing images"):
            image = self.image_processor.load_image(str(img_path))
            image = self.image_processor.resize_for_shorts(image)
            
            # Apply enhancements based on template
            if template == 'vintage':
                image = self.image_processor.apply_filter(image, 'vintage')
            elif template == 'modern':
                image = self.image_processor.apply_enhancement(
                    image, brightness=1.1, contrast=1.1, saturation=1.2
                )
            
            processed_images.append(image)
        
        # Create text clips
        self.logger.info("Creating text clips...")
        text_clips = self.text_processor.create_text_clips(scripts)
        
        # Generate TTS if enabled
        narration_path = None
        if use_tts and scripts:
            self.logger.info("Generating TTS narration...")
            tts_texts = [script.get('text', '') for script in scripts]
            tts_output_dir = Path("temp/tts")
            tts_output_dir.mkdir(parents=True, exist_ok=True)
            
            tts_files = await self.audio_processor.batch_generate_tts(
                tts_texts, str(tts_output_dir)
            )
            
            # Combine TTS files
            narration_segments = []
            for tts_file in tts_files:
                audio = self.audio_processor.load_audio(str(tts_file))
                narration_segments.append(audio)
            
            if narration_segments:
                from pydub import AudioSegment
                combined_narration = sum(narration_segments)
                narration_path = "temp/narration_combined.mp3"
                self.audio_processor.save_audio(combined_narration, narration_path)
        
        # Create scenes
        self.logger.info("Creating video scenes...")
        scenes = []
        
        # Match images with text clips
        for i, image in enumerate(processed_images):
            # Get corresponding text clip if available
            text_clip = text_clips[i] if i < len(text_clips) else None
            
            # Determine scene duration
            if text_clip:
                duration = text_clip.duration
            else:
                duration = self.config.get('image.default_duration', 3.0)
            
            # Create scene
            scene = self.video_generator.create_scene(
                image=image,
                duration=duration,
                text_clip=text_clip,
                transition='fade',
                transition_duration=0.5
            )
            
            scenes.append(scene)
        
        # Compile video
        self.logger.info("Compiling video...")
        final_video = self.video_generator.compile_scenes(
            scenes,
            background_music=background_music,
            narration=narration_path
        )
        
        # Apply template-specific effects
        if template == 'news':
            # Add news-style lower third
            pass  # Would implement news template specifics
        elif template == 'story':
            # Add Ken Burns effect to images
            pass  # Would implement story template specifics
        
        # Render final video
        self.logger.info(f"Rendering video to {output_path}...")
        self.video_generator.render_video(
            final_video,
            output_path,
            compress=True
        )
        
        self.logger.info("✅ Shorts generation completed!")
    
    def generate_from_config(self, config_file: str):
        """Generate shorts from configuration file"""
        with open(config_file, 'r', encoding='utf-8') as f:
            generation_config = json.load(f)
        
        self.generate_from_folder(
            images_folder=generation_config['images_folder'],
            script_file=generation_config['script_file'],
            output_path=generation_config['output_path'],
            template=generation_config.get('template', 'basic'),
            background_music=generation_config.get('background_music'),
            use_tts=generation_config.get('use_tts', True)
        )


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="Auto Shorts Generator")
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Generate command
    generate_parser = subparsers.add_parser('generate', help='Generate shorts video')
    generate_parser.add_argument('-i', '--images', required=True,
                                help='Path to images folder')
    generate_parser.add_argument('-s', '--script', required=True,
                                help='Path to script file')
    generate_parser.add_argument('-o', '--output', required=True,
                                help='Output video path')
    generate_parser.add_argument('-t', '--template', default='basic',
                                choices=['basic', 'news', 'story', 'product', 'vintage', 'modern'],
                                help='Video template')
    generate_parser.add_argument('-m', '--music',
                                help='Background music file')
    generate_parser.add_argument('--no-tts', action='store_true',
                                help='Disable TTS narration')
    generate_parser.add_argument('-c', '--config',
                                help='Configuration file path')
    
    # Config command
    config_parser = subparsers.add_parser('from-config', help='Generate from config file')
    config_parser.add_argument('config_file', help='Configuration JSON file')
    
    args = parser.parse_args()
    
    if args.command == 'generate':
        generator = ShortsGenerator(args.config)
        generator.generate_from_folder(
            images_folder=args.images,
            script_file=args.script,
            output_path=args.output,
            template=args.template,
            background_music=args.music,
            use_tts=not args.no_tts
        )
    elif args.command == 'from-config':
        generator = ShortsGenerator()
        generator.generate_from_config(args.config_file)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()