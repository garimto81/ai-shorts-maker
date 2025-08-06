# 📡 Auto Shorts Generator API Documentation

## Overview

Auto Shorts Generator provides a RESTful API for programmatic video generation. The API allows you to upload images and scripts to generate short videos asynchronously.

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, the API does not require authentication. In production, implement proper API key authentication.

## Endpoints

### 1. Generate Video

**POST** `/generate`

Generate a video from uploaded images and script.

#### Request

**Headers:**
```
Content-Type: multipart/form-data
```

**Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| images | File[] | Yes | Array of image files (JPEG, PNG) |
| script_text | String | No | Script text content |
| script_file | String | No | Path to existing script file |
| template | String | No | Template name (default: "basic") |
| use_tts | Boolean | No | Enable TTS narration (default: true) |
| background_music | String | No | Path to background music file |

**Example Request (curl):**
```bash
curl -X POST http://localhost:8000/generate \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.jpg" \
  -F 'request={"script_text":"Hello World","template":"modern","use_tts":true}'
```

**Example Request (Python):**
```python
import requests

files = [
    ('images', open('image1.jpg', 'rb')),
    ('images', open('image2.jpg', 'rb')),
    ('images', open('image3.jpg', 'rb'))
]

data = {
    'request': json.dumps({
        'script_text': 'Welcome to my video!',
        'template': 'modern',
        'use_tts': True
    })
}

response = requests.post('http://localhost:8000/generate', files=files, data=data)
```

#### Response

**Success Response (200):**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Video generation started"
}
```

**Error Response (400):**
```json
{
  "detail": "At least one image is required"
}
```

---

### 2. Check Task Status

**GET** `/status/{task_id}`

Check the status of a video generation task.

#### Request

**Path Parameters:**
- `task_id` (string): The task ID returned from the generate endpoint

**Example Request:**
```bash
curl http://localhost:8000/status/550e8400-e29b-41d4-a716-446655440000
```

#### Response

**Success Response (200):**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 1.0,
  "message": "Video generation completed",
  "output_file": "/app/output/550e8400-e29b-41d4-a716-446655440000.mp4",
  "error": null
}
```

**Status Values:**
- `pending`: Task is queued
- `processing`: Task is being processed
- `completed`: Task completed successfully
- `failed`: Task failed with error

---

### 3. Download Video

**GET** `/download/{task_id}`

Download the generated video file.

#### Request

**Path Parameters:**
- `task_id` (string): The task ID of the completed video

**Example Request:**
```bash
curl -O http://localhost:8000/download/550e8400-e29b-41d4-a716-446655440000
```

#### Response

**Success Response (200):**
- Returns the video file as `video/mp4` content type
- Filename: `shorts_{task_id}.mp4`

**Error Response (404):**
```json
{
  "detail": "Task not found"
}
```

**Error Response (400):**
```json
{
  "detail": "Video not ready yet"
}
```

---

### 4. List Templates

**GET** `/templates`

Get a list of available video templates.

#### Request

**Example Request:**
```bash
curl http://localhost:8000/templates
```

#### Response

**Success Response (200):**
```json
{
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
```

---

### 5. List TTS Voices

**GET** `/voices`

Get available TTS voices for different languages.

#### Request

**Example Request:**
```bash
curl http://localhost:8000/voices
```

#### Response

**Success Response (200):**
```json
{
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
```

---

### 6. Clean Up Task

**DELETE** `/cleanup/{task_id}`

Remove task files and clean up resources.

#### Request

**Path Parameters:**
- `task_id` (string): The task ID to clean up

**Example Request:**
```bash
curl -X DELETE http://localhost:8000/cleanup/550e8400-e29b-41d4-a716-446655440000
```

#### Response

**Success Response (200):**
```json
{
  "message": "Task cleaned up successfully"
}
```

---

## Complete Workflow Example

```python
import requests
import time
import json

# 1. Generate video
files = [
    ('images', open('photo1.jpg', 'rb')),
    ('images', open('photo2.jpg', 'rb')),
    ('images', open('photo3.jpg', 'rb'))
]

generate_response = requests.post(
    'http://localhost:8000/generate',
    files=files,
    data={'request': json.dumps({
        'script_text': 'My awesome video script',
        'template': 'modern',
        'use_tts': True
    })}
)

task_data = generate_response.json()
task_id = task_data['task_id']
print(f"Task ID: {task_id}")

# 2. Check status
while True:
    status_response = requests.get(f'http://localhost:8000/status/{task_id}')
    status_data = status_response.json()
    
    print(f"Status: {status_data['status']} - Progress: {status_data['progress']}")
    
    if status_data['status'] == 'completed':
        break
    elif status_data['status'] == 'failed':
        print(f"Error: {status_data['error']}")
        break
    
    time.sleep(2)

# 3. Download video
if status_data['status'] == 'completed':
    download_response = requests.get(f'http://localhost:8000/download/{task_id}')
    
    with open(f'output_{task_id}.mp4', 'wb') as f:
        f.write(download_response.content)
    
    print(f"Video saved as output_{task_id}.mp4")
    
    # 4. Clean up
    requests.delete(f'http://localhost:8000/cleanup/{task_id}')
```

## Docker Deployment

### Using Docker Compose

```bash
# Start API server
docker-compose up auto-shorts-api

# API will be available at http://localhost:8000
```

### Using Docker

```bash
# Build image
docker build -f docker/Dockerfile -t auto-shorts-generator .

# Run API server
docker run -p 8000:8000 -v $(pwd)/input:/app/input -v $(pwd)/output:/app/output auto-shorts-generator python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

## Rate Limiting

In production, implement rate limiting to prevent abuse:
- Maximum 10 requests per minute per IP
- Maximum file size: 10MB per image
- Maximum 20 images per request

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource not found |
| 413 | Payload Too Large - File size exceeded |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## WebSocket Support (Coming Soon)

Future versions will support WebSocket connections for real-time progress updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/{task_id}');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`Progress: ${data.progress}%`);
};
```