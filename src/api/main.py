"""FastAPI server for Auto Shorts Generator"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import shutil
from pathlib import Path
import uuid
import json
import asyncio
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from main import ShortsGenerator

app = FastAPI(
    title="Auto Shorts Generator API",
    description="API for generating short videos from images and text",
    version="1.0.0"
)

# Storage paths
UPLOAD_DIR = Path("temp/uploads")
OUTPUT_DIR = Path("output")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Task storage (in production, use Redis or database)
tasks = {}


class GenerationRequest(BaseModel):
    """Video generation request model"""
    script_text: Optional[str] = None
    script_file: Optional[str] = None
    template: str = "basic"
    use_tts: bool = True
    background_music: Optional[str] = None


class GenerationResponse(BaseModel):
    """Video generation response model"""
    task_id: str
    status: str
    message: str


class TaskStatus(BaseModel):
    """Task status model"""
    task_id: str
    status: str  # pending, processing, completed, failed
    progress: float
    message: str
    output_file: Optional[str] = None
    error: Optional[str] = None


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "Auto Shorts Generator API",
        "version": "1.0.0",
        "endpoints": {
            "POST /generate": "Generate video from images and script",
            "GET /status/{task_id}": "Check generation status",
            "GET /download/{task_id}": "Download generated video",
            "GET /templates": "List available templates",
            "GET /voices": "List available TTS voices"
        }
    }


@app.post("/generate", response_model=GenerationResponse)
async def generate_video(
    background_tasks: BackgroundTasks,
    request: GenerationRequest,
    images: List[UploadFile] = File(...)
):
    """Generate video from uploaded images and script"""
    
    # Validate images
    if len(images) < 1:
        raise HTTPException(status_code=400, detail="At least one image is required")
    
    # Create task ID
    task_id = str(uuid.uuid4())
    
    # Create task directory
    task_dir = UPLOAD_DIR / task_id
    task_dir.mkdir(parents=True, exist_ok=True)
    images_dir = task_dir / "images"
    images_dir.mkdir(exist_ok=True)
    
    # Save uploaded images
    for i, image in enumerate(images):
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"File {image.filename} is not an image")
        
        file_path = images_dir / f"image_{i:03d}.jpg"
        with open(file_path, "wb") as f:
            shutil.copyfileobj(image.file, f)
    
    # Save script
    script_path = task_dir / "script.txt"
    if request.script_text:
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(request.script_text)
    elif request.script_file:
        # Copy existing script file
        shutil.copy(request.script_file, script_path)
    else:
        # Create default script
        with open(script_path, "w", encoding="utf-8") as f:
            f.write("Welcome to Auto Shorts Generator!\n")
            f.write("This is an automatically generated video.\n")
            f.write("Thank you for watching!")
    
    # Initialize task status
    tasks[task_id] = {
        "status": "pending",
        "progress": 0.0,
        "message": "Task queued for processing",
        "output_file": None,
        "error": None
    }
    
    # Add background task
    background_tasks.add_task(
        process_video_generation,
        task_id,
        str(images_dir),
        str(script_path),
        request.template,
        request.use_tts,
        request.background_music
    )
    
    return GenerationResponse(
        task_id=task_id,
        status="pending",
        message="Video generation started"
    )


async def process_video_generation(
    task_id: str,
    images_dir: str,
    script_path: str,
    template: str,
    use_tts: bool,
    background_music: Optional[str]
):
    """Process video generation in background"""
    try:
        # Update status
        tasks[task_id]["status"] = "processing"
        tasks[task_id]["progress"] = 0.1
        tasks[task_id]["message"] = "Starting video generation..."
        
        # Generate video
        generator = ShortsGenerator()
        output_path = OUTPUT_DIR / f"{task_id}.mp4"
        
        # Run generation
        await asyncio.get_event_loop().run_in_executor(
            None,
            generator.generate_from_folder,
            images_dir,
            script_path,
            str(output_path),
            template,
            background_music,
            use_tts
        )
        
        # Update status
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["progress"] = 1.0
        tasks[task_id]["message"] = "Video generation completed"
        tasks[task_id]["output_file"] = str(output_path)
        
    except Exception as e:
        # Update error status
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["progress"] = 0.0
        tasks[task_id]["message"] = "Video generation failed"
        tasks[task_id]["error"] = str(e)


@app.get("/status/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    """Get video generation task status"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = tasks[task_id]
    return TaskStatus(
        task_id=task_id,
        status=task["status"],
        progress=task["progress"],
        message=task["message"],
        output_file=task["output_file"],
        error=task["error"]
    )


@app.get("/download/{task_id}")
async def download_video(task_id: str):
    """Download generated video"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = tasks[task_id]
    
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="Video not ready yet")
    
    if not task["output_file"] or not Path(task["output_file"]).exists():
        raise HTTPException(status_code=404, detail="Output file not found")
    
    return FileResponse(
        task["output_file"],
        media_type="video/mp4",
        filename=f"shorts_{task_id}.mp4"
    )


@app.get("/templates")
async def list_templates():
    """List available video templates"""
    return {
        "templates": [
            {
                "id": "basic",
                "name": "Basic",
                "description": "Simple image slideshow with text"
            },
            {
                "id": "modern",
                "name": "Modern",
                "description": "Dynamic modern style with vibrant colors"
            },
            {
                "id": "vintage",
                "name": "Vintage",
                "description": "Retro style with warm filters"
            },
            {
                "id": "story",
                "name": "Story",
                "description": "Storytelling optimized with Ken Burns effect"
            },
            {
                "id": "news",
                "name": "News",
                "description": "News style with lower third text"
            },
            {
                "id": "product",
                "name": "Product",
                "description": "Product showcase with clean design"
            }
        ]
    }


@app.get("/voices")
async def list_voices():
    """List available TTS voices"""
    return {
        "voices": {
            "ko-KR": {
                "female": ["ko-KR-SunHiNeural", "ko-KR-JiMinNeural"],
                "male": ["ko-KR-InJoonNeural", "ko-KR-BongJinNeural"]
            },
            "en-US": {
                "female": ["en-US-JennyNeural", "en-US-AriaNeural"],
                "male": ["en-US-GuyNeural", "en-US-DavisNeural"]
            },
            "ja-JP": {
                "female": ["ja-JP-NanamiNeural", "ja-JP-MayuNeural"],
                "male": ["ja-JP-KeitaNeural", "ja-JP-DaichiNeural"]
            }
        }
    }


@app.delete("/cleanup/{task_id}")
async def cleanup_task(task_id: str):
    """Clean up task files"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Remove task directory
    task_dir = UPLOAD_DIR / task_id
    if task_dir.exists():
        shutil.rmtree(task_dir)
    
    # Remove output file
    output_file = OUTPUT_DIR / f"{task_id}.mp4"
    if output_file.exists():
        output_file.unlink()
    
    # Remove from tasks
    del tasks[task_id]
    
    return {"message": "Task cleaned up successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)