"""Example script to demonstrate Auto Shorts Generator usage"""

import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from main import ShortsGenerator
from core import ImageProcessor
import numpy as np
from PIL import Image


def create_sample_images():
    """Create sample images for testing"""
    print("Creating sample images...")
    
    images_dir = Path("input/images")
    images_dir.mkdir(parents=True, exist_ok=True)
    
    # Create 5 sample images with different colors
    colors = [
        (255, 100, 100, "빨간색"),  # Red
        (100, 255, 100, "초록색"),  # Green  
        (100, 100, 255, "파란색"),  # Blue
        (255, 255, 100, "노란색"),  # Yellow
        (255, 100, 255, "보라색"),  # Purple
    ]
    
    for i, (r, g, b, name) in enumerate(colors):
        # Create image
        img = Image.new('RGB', (1920, 1080), color=(r, g, b))
        
        # Add text
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        
        # Try to use a better font, fallback to default
        try:
            font = ImageFont.truetype("arial.ttf", 100)
        except:
            font = ImageFont.load_default()
        
        text = f"Image {i+1}\n{name}"
        # Get text bbox for centering
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        position = ((1920 - text_width) // 2, (1080 - text_height) // 2)
        draw.text(position, text, fill=(255, 255, 255), font=font)
        
        # Save image
        img.save(images_dir / f"sample_{i+1:02d}.jpg")
    
    print(f"Created {len(colors)} sample images in {images_dir}")


def create_sample_music():
    """Create a simple audio file for testing"""
    print("Creating sample background music...")
    
    music_dir = Path("assets/music")
    music_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        from pydub import AudioSegment
        from pydub.generators import Sine
        
        # Create a simple tone sequence
        duration_ms = 30000  # 30 seconds
        
        # Create a simple melody
        notes = [440, 494, 523, 587, 659, 698, 784]  # A major scale
        melody = AudioSegment.empty()
        
        for note in notes * 4:
            tone = Sine(note).to_audio_segment(duration=200)
            tone = tone.fade_in(50).fade_out(50)
            melody += tone
            melody += AudioSegment.silent(duration=100)
        
        # Make it quieter
        melody = melody - 20  # Reduce volume by 20dB
        
        # Save
        melody.export(music_dir / "sample_music.mp3", format="mp3")
        print(f"Created sample music in {music_dir}")
        
    except Exception as e:
        print(f"Could not create sample music: {e}")
        print("You can add your own MP3 file to assets/music/")


def run_basic_example():
    """Run basic shorts generation example"""
    print("\n" + "="*50)
    print("Running Basic Shorts Generation Example")
    print("="*50 + "\n")
    
    # Create sample data if needed
    if not Path("input/images").exists() or not list(Path("input/images").glob("*.jpg")):
        create_sample_images()
    
    if not Path("assets/music/sample_music.mp3").exists():
        create_sample_music()
    
    # Initialize generator
    generator = ShortsGenerator()
    
    # Generate shorts
    try:
        generator.generate_from_folder(
            images_folder="input/images",
            script_file="input/scripts/sample.txt",
            output_path="output/example_shorts.mp4",
            template="basic",
            background_music="assets/music/sample_music.mp3" if Path("assets/music/sample_music.mp3").exists() else None,
            use_tts=True
        )
        
        print("\n✅ Shorts generated successfully!")
        print(f"Output: output/example_shorts.mp4")
        
    except Exception as e:
        print(f"\n❌ Error generating shorts: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure FFmpeg is installed")
        print("2. Check that all required packages are installed")
        print("3. Verify input files exist")


def run_advanced_example():
    """Run advanced example with custom settings"""
    print("\n" + "="*50)
    print("Running Advanced Shorts Generation Example")
    print("="*50 + "\n")
    
    from core import ImageProcessor, TextProcessor, VideoGenerator, AudioProcessor
    import asyncio
    
    # Create processors
    image_processor = ImageProcessor()
    text_processor = TextProcessor()
    video_generator = VideoGenerator()
    audio_processor = AudioProcessor()
    
    print("Processing custom workflow...")
    
    # Load and process a single image
    if Path("input/images/sample_01.jpg").exists():
        image = image_processor.load_image("input/images/sample_01.jpg")
        
        # Apply effects
        image = image_processor.resize_for_shorts(image, method='smart')
        image = image_processor.apply_enhancement(
            image,
            brightness=1.2,
            contrast=1.1,
            saturation=1.3
        )
        
        # Save processed image
        Path("output").mkdir(exist_ok=True)
        image_processor.save_image(image, "output/processed_image.jpg")
        print("✅ Processed image saved to output/processed_image.jpg")
    
    # Generate TTS
    async def generate_sample_tts():
        text = "안녕하세요! 자동 쇼츠 생성기 테스트입니다."
        output_path = await audio_processor.generate_tts(
            text,
            "output/sample_tts.mp3"
        )
        print(f"✅ TTS generated: {output_path}")
    
    # Run TTS generation
    asyncio.run(generate_sample_tts())
    
    print("\n✅ Advanced example completed!")


def main():
    """Main entry point for examples"""
    print("""
╔══════════════════════════════════════════════╗
║     Auto Shorts Generator - Examples        ║
╚══════════════════════════════════════════════╝
    """)
    
    print("Select an example to run:")
    print("1. Basic Shorts Generation")
    print("2. Advanced Custom Workflow")
    print("3. Create Sample Data Only")
    print("0. Exit")
    
    choice = input("\nEnter your choice (0-3): ").strip()
    
    if choice == "1":
        run_basic_example()
    elif choice == "2":
        run_advanced_example()
    elif choice == "3":
        create_sample_images()
        create_sample_music()
        print("\n✅ Sample data created!")
    elif choice == "0":
        print("Goodbye!")
    else:
        print("Invalid choice. Please run again.")


if __name__ == "__main__":
    main()