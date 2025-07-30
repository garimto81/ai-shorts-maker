import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { createCanvas } from 'canvas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, audioUrl, duration = 10, width = 720, height = 1280 } = req.body;

    console.log('🎬 통합 비디오 생성 요청:', { text: text.substring(0, 50) + '...', audioUrl, duration });

    // 현재는 FFmpeg가 없으므로 Mock 응답 반환
    // 실제로는 여기서 FFmpeg를 사용해서 음성과 비디오를 병합
    
    const mockVideoData = {
      success: false, // FFmpeg가 없으므로 실패로 설정
      error: 'FFmpeg를 사용한 서버사이드 통합이 필요합니다. Canvas 방식을 사용하세요.',
      message: '현재 환경에서는 브라우저 기반 방식을 사용해주세요',
      fallbackSuggestion: 'Canvas 기반 비디오 생성 + 별도 음성 다운로드',
      integrationMethods: [
        '1. DaVinci Resolve (무료) - 전문적인 영상 편집',
        '2. OpenShot (무료, 오픈소스) - 간단한 편집',
        '3. Kapwing (온라인) - 브라우저에서 병합',
        '4. Clideo (온라인) - 간단한 온라인 병합'
      ]
    };

    // FFmpeg가 설치된 경우의 실제 구현 예시 (주석 처리)
    /*
    if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
      // 1. 오디오 파일 다운로드
      const audioResponse = await fetch(audioUrl);
      const audioBuffer = await audioResponse.arrayBuffer();
      const audioPath = path.join(process.cwd(), 'temp', `audio_${Date.now()}.mp3`);
      fs.writeFileSync(audioPath, Buffer.from(audioBuffer));

      // 2. Canvas로 프레임 이미지들 생성
      const frameDir = path.join(process.cwd(), 'temp', `frames_${Date.now()}`);
      fs.mkdirSync(frameDir, { recursive: true });
      
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      const fps = 30;
      const totalFrames = duration * fps;

      for (let frame = 0; frame < totalFrames; frame++) {
        const progress = frame / totalFrames;
        
        // 배경 그라디언트
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `hsl(${progress * 360}, 70%, 60%)`);
        gradient.addColorStop(1, `hsl(${(progress * 360 + 60) % 360}, 70%, 40%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 텍스트 렌더링
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AI Shorts Maker', width / 2, 200);
        
        ctx.font = '36px Arial';
        // 텍스트 줄바꿈 처리...
        
        // 프레임 저장
        const framePath = path.join(frameDir, `frame_${frame.toString().padStart(6, '0')}.png`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(framePath, buffer);
      }

      // 3. FFmpeg로 비디오 생성 및 음성 병합
      const outputPath = path.join(process.cwd(), 'public', 'videos', `integrated_${Date.now()}.mp4`);
      const ffmpegCommand = `"${process.env.FFMPEG_PATH}" -framerate ${fps} -i "${frameDir}/frame_%06d.png" -i "${audioPath}" -c:v libx264 -c:a aac -shortest -pix_fmt yuv420p "${outputPath}"`;
      
      await execAsync(ffmpegCommand);
      
      // 임시 파일 정리
      fs.rmSync(frameDir, { recursive: true });
      fs.unlinkSync(audioPath);

      return res.json({
        success: true,
        data: {
          videoUrl: `/videos/${path.basename(outputPath)}`,
          duration: duration,
          resolution: `${width}x${height}`,
          hasAudio: true
        }
      });
    }
    */

    return res.json(mockVideoData);

  } catch (error: any) {
    console.error('통합 비디오 생성 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      suggestion: 'Canvas 기반 방식을 사용하고 별도로 음성 파일을 다운로드하세요'
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};