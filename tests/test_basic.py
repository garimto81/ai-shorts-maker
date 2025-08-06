"""Basic tests for Auto Shorts Generator"""

import sys
import pytest
from pathlib import Path
import numpy as np

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from core import ImageProcessor, TextProcessor, VideoGenerator, AudioProcessor
from utils import Config, Validator, ValidationError


class TestImageProcessor:
    """Test image processor functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.processor = ImageProcessor()
    
    def test_resize_for_shorts(self):
        """Test image resizing for shorts format"""
        # Create test image
        test_image = np.random.randint(0, 255, (1080, 1920, 3), dtype=np.uint8)
        
        # Test resize
        resized = self.processor.resize_for_shorts(test_image)
        
        # Check dimensions
        assert resized.shape[0] == 1920  # Height
        assert resized.shape[1] == 1080  # Width
        assert resized.shape[2] == 3     # Channels
    
    def test_apply_enhancement(self):
        """Test image enhancement"""
        test_image = np.ones((100, 100, 3), dtype=np.uint8) * 128
        
        # Apply enhancement
        enhanced = self.processor.apply_enhancement(
            test_image,
            brightness=1.5,
            contrast=1.2,
            saturation=1.1
        )
        
        # Check that image was modified
        assert not np.array_equal(test_image, enhanced)
    
    def test_apply_filter(self):
        """Test filter application"""
        test_image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        
        filters = ['blur', 'sharpen', 'grayscale']
        
        for filter_type in filters:
            filtered = self.processor.apply_filter(test_image, filter_type)
            assert filtered.shape[:2] == test_image.shape[:2]


class TestTextProcessor:
    """Test text processor functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.processor = TextProcessor()
    
    def test_wrap_text(self):
        """Test text wrapping"""
        long_text = "This is a very long text that needs to be wrapped into multiple lines for display"
        
        wrapped = self.processor._wrap_text(long_text)
        
        # Check that text was wrapped
        assert '\n' in wrapped
        
        # Check line length
        lines = wrapped.split('\n')
        for line in lines:
            assert len(line) <= self.processor.max_chars_per_line + 10  # Some tolerance
    
    def test_create_text_clips(self):
        """Test text clip creation"""
        scripts = [
            {"text": "First text", "duration": 2.0},
            {"text": "Second text", "duration": 3.0},
            {"text": "Third text", "duration": 2.5}
        ]
        
        clips = self.processor.create_text_clips(scripts)
        
        assert len(clips) == 3
        assert clips[0].duration == 2.0
        assert clips[1].start_time == 2.0
        assert clips[2].start_time == 5.0
    
    def test_hex_to_rgb(self):
        """Test color conversion"""
        # Test white
        rgb = self.processor._hex_to_rgb("#FFFFFF")
        assert rgb == (255, 255, 255)
        
        # Test black
        rgb = self.processor._hex_to_rgb("#000000")
        assert rgb == (0, 0, 0)
        
        # Test red
        rgb = self.processor._hex_to_rgb("#FF0000")
        assert rgb == (255, 0, 0)


class TestConfig:
    """Test configuration management"""
    
    def test_config_singleton(self):
        """Test config singleton pattern"""
        config1 = Config()
        config2 = Config()
        
        assert config1 is config2
    
    def test_get_config(self):
        """Test getting config values"""
        config = Config()
        
        # Test getting nested values
        width = config.get('video.width')
        assert width is not None
        
        # Test default value
        nonexistent = config.get('nonexistent.key', 'default')
        assert nonexistent == 'default'
    
    def test_set_config(self):
        """Test setting config values"""
        config = Config()
        
        # Set value
        config.set('test.key', 'test_value')
        
        # Get value
        value = config.get('test.key')
        assert value == 'test_value'


class TestValidator:
    """Test input validation"""
    
    def test_validate_resolution(self):
        """Test resolution validation"""
        # Valid resolution
        w, h = Validator.validate_resolution(1080, 1920)
        assert w == 1080
        assert h == 1920
        
        # Invalid resolution
        with pytest.raises(ValidationError):
            Validator.validate_resolution(-100, 1920)
        
        with pytest.raises(ValidationError):
            Validator.validate_resolution(5000, 5000)
    
    def test_validate_fps(self):
        """Test FPS validation"""
        # Valid FPS
        fps = Validator.validate_fps(30)
        assert fps == 30
        
        # Invalid FPS
        with pytest.raises(ValidationError):
            Validator.validate_fps(45)
    
    def test_validate_duration(self):
        """Test duration validation"""
        # Valid duration
        duration = Validator.validate_duration(5.0)
        assert duration == 5.0
        
        # Too short
        with pytest.raises(ValidationError):
            Validator.validate_duration(0.05)
        
        # Too long
        with pytest.raises(ValidationError):
            Validator.validate_duration(100.0)
    
    def test_validate_color(self):
        """Test color validation"""
        # Valid colors
        color = Validator.validate_color("#FFFFFF")
        assert color == "#FFFFFF"
        
        color = Validator.validate_color("#ff0000")
        assert color == "#FF0000"
        
        # Invalid color
        with pytest.raises(ValidationError):
            Validator.validate_color("red")
        
        with pytest.raises(ValidationError):
            Validator.validate_color("#GGG")


def test_imports():
    """Test that all modules can be imported"""
    from core import ImageProcessor, TextProcessor, VideoGenerator, AudioProcessor, EffectsManager
    from utils import Config, setup_logger, get_logger, Validator
    
    # Check classes exist
    assert ImageProcessor is not None
    assert TextProcessor is not None
    assert VideoGenerator is not None
    assert AudioProcessor is not None
    assert EffectsManager is not None
    assert Config is not None
    assert Validator is not None


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])