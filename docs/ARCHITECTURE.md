# 🏗️ Auto Shorts Generator - Architecture Documentation

## System Overview

Auto Shorts Generator is a modular Python application designed to automatically create short-form videos from images and text. The system follows a layered architecture with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│  (CLI / REST API / Web UI)                              │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                 Application Layer                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │            ShortsGenerator (main.py)             │  │
│  │         Orchestrates the entire workflow         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                    Core Modules                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Image     │  │    Text     │  │    Video    │    │
│  │ Processor   │  │  Processor  │  │  Generator  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │   Audio     │  │   Effects   │                      │
│  │ Processor   │  │   Manager   │                      │
│  └─────────────┘  └─────────────┘                      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                   Utility Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Config    │  │   Logger    │  │  Validator  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              External Dependencies                       │
│  ┌──────┐  ┌────────┐  ┌────────┐  ┌──────────┐      │
│  │OpenCV│  │MoviePy │  │Edge-TTS│  │  FFmpeg  │      │
│  └──────┘  └────────┘  └────────┘  └──────────┘      │
└──────────────────────────────────────────────────────────┘
```

## Component Details

### 1. User Interface Layer

#### CLI (Command Line Interface)
- **File**: `src/main.py`
- **Purpose**: Primary interface for users
- **Features**:
  - Argument parsing
  - Command execution
  - Progress display

#### REST API
- **File**: `src/api/main.py`
- **Framework**: FastAPI
- **Features**:
  - Asynchronous request handling
  - File upload support
  - Task queue management
  - Progress tracking

### 2. Application Layer

#### ShortsGenerator
- **File**: `src/main.py`
- **Responsibilities**:
  - Workflow orchestration
  - Module coordination
  - Error handling
  - Progress reporting

**Key Methods**:
```python
generate_from_folder()  # Main generation workflow
generate_from_config()  # Config-based generation
_generate_async()       # Async processing
```

### 3. Core Modules

#### ImageProcessor
- **File**: `src/core/image_processor.py`
- **Responsibilities**:
  - Image loading and validation
  - Smart cropping (face detection)
  - Resizing for 9:16 aspect ratio
  - Filter and enhancement application

**Key Features**:
- Face detection-based cropping
- Multiple resize methods (smart, center, blur_background)
- Batch processing support
- Enhancement pipeline (brightness, contrast, saturation)

#### TextProcessor
- **File**: `src/core/text_processor.py`
- **Responsibilities**:
  - Script parsing (TXT, JSON, YAML)
  - Text wrapping and formatting
  - Subtitle generation
  - Text rendering on images

**Key Features**:
- Multi-format script support
- Automatic text wrapping
- Customizable styling
- Animation support

#### VideoGenerator
- **File**: `src/core/video_generator.py`
- **Responsibilities**:
  - Scene creation and management
  - Video compilation
  - Transition application
  - Output rendering

**Key Features**:
- Scene-based architecture
- Multiple transition types
- Audio synchronization
- Quality optimization

#### AudioProcessor
- **File**: `src/core/audio_processor.py`
- **Responsibilities**:
  - TTS generation
  - Audio mixing
  - Volume normalization
  - Background music management

**Key Features**:
- Multi-language TTS support
- Async TTS generation
- Audio effects and mixing
- Silence trimming

#### EffectsManager
- **File**: `src/core/effects.py`
- **Responsibilities**:
  - Visual effects application
  - Transition management
  - Filter pipeline
  - Animation control

**Key Features**:
- Ken Burns effect
- Color filters
- Vignette and blur effects
- Custom transitions

### 4. Utility Layer

#### Config
- **File**: `src/utils/config.py`
- **Pattern**: Singleton
- **Features**:
  - YAML configuration loading
  - Nested key access
  - Dynamic updates
  - Default values

#### Logger
- **File**: `src/utils/logger.py`
- **Features**:
  - Color-coded console output
  - File logging
  - Log rotation
  - Multiple log levels

#### Validator
- **File**: `src/utils/validators.py`
- **Features**:
  - Input validation
  - File format checking
  - Resolution validation
  - Color format validation

## Data Flow

### Generation Pipeline

```
1. Input Collection
   ├── Load Images → Validate → Store in memory
   └── Parse Script → Validate → Create text clips

2. Processing
   ├── Image Processing
   │   ├── Resize to 9:16
   │   ├── Apply enhancements
   │   └── Apply filters
   ├── Text Processing
   │   ├── Generate TTS (if enabled)
   │   └── Create subtitle overlays
   └── Audio Processing
       ├── Load background music
       └── Mix audio tracks

3. Video Generation
   ├── Create scenes
   ├── Apply transitions
   ├── Compile video
   └── Add audio track

4. Output
   ├── Render final video
   ├── Compress (if enabled)
   └── Save to disk
```

## Design Patterns

### 1. Singleton Pattern
- **Used in**: Config class
- **Purpose**: Ensure single configuration instance

### 2. Factory Pattern
- **Used in**: Scene creation
- **Purpose**: Abstract scene generation logic

### 3. Strategy Pattern
- **Used in**: Resize methods, transitions
- **Purpose**: Interchangeable algorithms

### 4. Template Method Pattern
- **Used in**: Video generation workflow
- **Purpose**: Define algorithm skeleton

### 5. Mixin Pattern
- **Used in**: LoggerMixin
- **Purpose**: Add logging capability to classes

## Performance Considerations

### Memory Management
- Stream large files instead of loading entirely
- Clear unused objects after processing
- Use generators for batch operations

### Parallel Processing
```python
# Batch image processing
with concurrent.futures.ThreadPoolExecutor() as executor:
    results = executor.map(process_image, images)
```

### Caching Strategy
- Cache processed images
- Store TTS audio for reuse
- Keep font objects in memory

### Optimization Techniques
1. **Lazy Loading**: Load resources only when needed
2. **Batch Processing**: Process multiple items together
3. **Async Operations**: Use async for I/O operations
4. **Resource Pooling**: Reuse expensive objects

## Scalability

### Horizontal Scaling
- Stateless design enables multiple instances
- Task queue for distributed processing
- Shared storage for input/output

### Vertical Scaling
- Adjustable worker threads
- Configurable batch sizes
- Memory-mapped file support

## Security Considerations

### Input Validation
- File type verification
- Size limits enforcement
- Path traversal prevention
- Content sanitization

### API Security
```python
# Rate limiting
@app.middleware("http")
async def rate_limit(request, call_next):
    # Implement rate limiting logic
    pass

# File size limits
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
```

### Data Privacy
- No persistent user data storage
- Automatic cleanup of temporary files
- Configurable data retention

## Testing Strategy

### Unit Tests
- Test individual components
- Mock external dependencies
- Coverage target: >80%

### Integration Tests
- Test module interactions
- Verify workflow completion
- Validate output quality

### Performance Tests
- Measure processing time
- Monitor memory usage
- Stress test with large files

## Deployment

### Docker Deployment
```dockerfile
# Multi-stage build
FROM python:3.9-slim as builder
# Build stage

FROM python:3.9-slim
# Runtime stage
```

### Environment Variables
```bash
VIDEO_WIDTH=1080
VIDEO_HEIGHT=1920
API_PORT=8000
LOG_LEVEL=INFO
```

### Monitoring
- Health check endpoints
- Performance metrics
- Error tracking
- Resource utilization

## Future Enhancements

### Planned Features
1. **AI Integration**
   - Automatic script generation
   - Smart image selection
   - Content recommendation

2. **Advanced Effects**
   - 3D transitions
   - Particle effects
   - Motion tracking

3. **Cloud Integration**
   - S3 storage support
   - CDN distribution
   - Serverless deployment

4. **Real-time Features**
   - WebSocket progress updates
   - Live preview
   - Collaborative editing

### Architecture Evolution
- Microservices architecture
- Message queue integration
- GraphQL API
- WebAssembly modules