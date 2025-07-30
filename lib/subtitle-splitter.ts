// 자막 분할 시스템 - 읽기 속도 기반 자막 생성

export interface SubtitleSegment {
  id: string;
  text: string;
  startTime: number; // 초 단위
  endTime: number;   // 초 단위
  duration: number;  // 초 단위
}

export interface ImageSubtitles {
  imageIndex: number;
  totalDuration: number;
  segments: SubtitleSegment[];
}

export class SubtitleSplitter {
  // 읽기 속도 설정 (분당 글자 수)
  private static readonly READING_SPEEDS = {
    slow: 200,      // 느린 읽기 (고령자, 복잡한 내용)
    normal: 300,    // 일반 읽기 (평균 성인)
    fast: 400       // 빠른 읽기 (젊은층, 간단한 내용)
  };

  // 자막 표시 설정
  private static readonly SUBTITLE_CONFIG = {
    minDuration: 1.5,     // 최소 표시 시간 (초)
    maxDuration: 6.0,     // 최대 표시 시간 (초)
    maxCharsPerLine: 20,  // 한 줄 최대 글자 수
    maxLines: 2,          // 최대 줄 수
    pauseBetween: 0.3,    // 자막 간 간격 (초)
    endPadding: 0.5       // 마지막 자막 후 여유 시간 (초)
  };

  /**
   * 텍스트를 읽기 속도에 맞게 자막으로 분할
   */
  public static splitTextToSubtitles(
    text: string,
    imageDuration: number,
    speed: 'slow' | 'normal' | 'fast' = 'normal'
  ): SubtitleSegment[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const readingSpeed = this.READING_SPEEDS[speed];
    const sentences = this.splitIntoSentences(text);
    const segments: SubtitleSegment[] = [];
    
    let currentTime = 0;
    let segmentId = 1;

    for (const sentence of sentences) {
      // 문장을 적절한 길이로 분할
      const chunks = this.splitSentenceIntoChunks(sentence);
      
      for (const chunk of chunks) {
        const charsCount = chunk.replace(/\s/g, '').length; // 공백 제외
        const readingTime = (charsCount / readingSpeed) * 60; // 초 단위
        
        // 표시 시간 계산 (읽기 시간 + 여유 시간)
        let duration = Math.max(
          readingTime * 1.5, // 읽기 시간의 1.5배
          this.SUBTITLE_CONFIG.minDuration
        );
        
        duration = Math.min(duration, this.SUBTITLE_CONFIG.maxDuration);
        
        // 이미지 시간을 초과하지 않도록 조정
        if (currentTime + duration > imageDuration - this.SUBTITLE_CONFIG.endPadding) {
          duration = Math.max(
            imageDuration - currentTime - this.SUBTITLE_CONFIG.endPadding,
            this.SUBTITLE_CONFIG.minDuration
          );
        }

        if (duration > 0) {
          segments.push({
            id: `subtitle_${segmentId}`,
            text: chunk.trim(),
            startTime: currentTime,
            endTime: currentTime + duration,
            duration: duration
          });

          currentTime += duration + this.SUBTITLE_CONFIG.pauseBetween;
          segmentId++;

          // 이미지 시간을 초과하면 중단
          if (currentTime >= imageDuration - this.SUBTITLE_CONFIG.endPadding) {
            break;
          }
        }
      }
    }

    return segments;
  }

  /**
   * 텍스트를 문장 단위로 분할
   */
  private static splitIntoSentences(text: string): string[] {
    // 한국어 문장 분할 (., !, ?, ㅋ, ㅎ 등으로 끝나는 경우)
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return sentences.length > 0 ? sentences : [text];
  }

  /**
   * 문장을 읽기 적절한 청크로 분할
   */
  private static splitSentenceIntoChunks(sentence: string): string[] {
    const maxChars = this.SUBTITLE_CONFIG.maxCharsPerLine * this.SUBTITLE_CONFIG.maxLines;
    
    if (sentence.length <= maxChars) {
      return [sentence];
    }

    const chunks: string[] = [];
    const words = sentence.split(/\s+/);
    let currentChunk = '';

    for (const word of words) {
      const testChunk = currentChunk ? `${currentChunk} ${word}` : word;
      
      if (testChunk.length <= maxChars) {
        currentChunk = testChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = word;
        } else {
          // 단어가 너무 긴 경우 강제 분할
          chunks.push(word.substring(0, maxChars));
          currentChunk = word.substring(maxChars);
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * 여러 이미지의 스크립트를 자막으로 변환
   */
  public static generateImageSubtitles(
    scriptSections: any[],
    speed: 'slow' | 'normal' | 'fast' = 'normal'
  ): ImageSubtitles[] {
    return scriptSections.map((section, index) => {
      const subtitles = this.splitTextToSubtitles(
        section.text,
        section.duration,
        speed
      );

      return {
        imageIndex: index,
        totalDuration: section.duration,
        segments: subtitles
      };
    });
  }

  /**
   * 자막을 SRT 형식으로 변환
   */
  public static toSRT(imageSubtitles: ImageSubtitles[]): string {
    let srtContent = '';
    let globalIndex = 1;
    let globalTime = 0;

    for (const imageSubtitle of imageSubtitles) {
      for (const segment of imageSubtitle.segments) {
        const startTime = this.formatSRTTime(globalTime + segment.startTime);
        const endTime = this.formatSRTTime(globalTime + segment.endTime);
        
        srtContent += `${globalIndex}\n`;
        srtContent += `${startTime} --> ${endTime}\n`;
        srtContent += `${segment.text}\n\n`;
        
        globalIndex++;
      }
      globalTime += imageSubtitle.totalDuration;
    }

    return srtContent;
  }

  /**
   * 시간을 SRT 형식으로 변환 (HH:MM:SS,mmm)
   */
  private static formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  /**
   * 자막 통계 정보
   */
  public static getSubtitleStats(imageSubtitles: ImageSubtitles[]): {
    totalImages: number;
    totalSubtitles: number;
    averageSubtitlesPerImage: number;
    totalDuration: number;
  } {
    const totalImages = imageSubtitles.length;
    const totalSubtitles = imageSubtitles.reduce((sum, img) => sum + img.segments.length, 0);
    const totalDuration = imageSubtitles.reduce((sum, img) => sum + img.totalDuration, 0);

    return {
      totalImages,
      totalSubtitles,
      averageSubtitlesPerImage: totalImages > 0 ? totalSubtitles / totalImages : 0,
      totalDuration
    };
  }
}