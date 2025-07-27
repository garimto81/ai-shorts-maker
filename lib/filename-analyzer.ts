// 파일명에서 날짜/시간 정보 추출 및 1차 정렬 시스템 (v1.5.0 강화)

export interface FileMetadata {
  originalName: string;
  extractedDate?: Date;
  confidence: number; // 0-1 점수
  pattern: string;
  size: number;
  uploadOrder: number;
}

interface DateExtractionResult {
  date: Date | null;
  confidence: number;
  pattern: string;
  source: 'filename' | 'metadata' | 'inferred';
}

export class FilenameAnalyzer {
  
  // 강화된 날짜/시간 패턴 정의 (v1.5.0)
  private readonly datePatterns = [
    // YYYY-MM-DD 형태
    {
      regex: /(\d{4})[-_](\d{1,2})[-_](\d{1,2})/,
      confidence: 0.9,
      name: 'YYYY-MM-DD'
    },
    
    // YYYYMMDD 형태
    {
      regex: /(\d{4})(\d{2})(\d{2})/,
      confidence: 0.85,
      name: 'YYYYMMDD'
    },
    
    // DD-MM-YYYY 형태
    {
      regex: /(\d{1,2})[-_](\d{1,2})[-_](\d{4})/,
      confidence: 0.8,
      name: 'DD-MM-YYYY'
    },
    
    // 한국어 날짜 (2024년1월27일)
    {
      regex: /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/,
      confidence: 0.95,
      name: 'Korean Date'
    },
    
    // 시간 포함 (YYYY-MM-DD_HH-MM-SS)
    {
      regex: /(\d{4})[-_](\d{1,2})[-_](\d{1,2})[-_\s](\d{1,2})[-_:](\d{1,2})[-_:](\d{1,2})/,
      confidence: 0.98,
      name: 'Full DateTime'
    },
    
    // 시간만 (HH-MM-SS)
    {
      regex: /(\d{1,2})[-_:](\d{1,2})[-_:](\d{1,2})/,
      confidence: 0.75,
      name: 'Time Only'
    },
    
    // 마이크로초 포함 타임스탬프 (YYYY-MM-DD_HH-MM-SS.mmm)
    {
      regex: /(\d{4})[-_](\d{1,2})[-_](\d{1,2})[-_\s](\d{1,2})[-_:](\d{1,2})[-_:](\d{1,2})\.(\d{3})/,
      confidence: 0.99,
      name: 'Full DateTime with Milliseconds'
    },
    
    // 타임스탬프 (13자리 밀리초)
    {
      regex: /(\d{13})/,
      confidence: 0.85,
      name: 'Timestamp_13'
    },
    
    // 타임스탬프 (10자리 초)
    {
      regex: /(\d{10})/,
      confidence: 0.8,
      name: 'Timestamp_10'
    },
    
    // 시퀀스 번호 (001, 002 등)
    {
      regex: /(\d{3,4})(?=\.|_|$)/,
      confidence: 0.4,
      name: 'Sequence'
    }
  ];

  // 순서 추론 키워드
  private readonly orderKeywords = [
    { words: ['처음', 'first', '시작', 'start', 'intro', '01'], weight: 1.0 },
    { words: ['두번째', 'second', '다음', '02'], weight: 0.8 },
    { words: ['세번째', 'third', '03'], weight: 0.6 },
    { words: ['마지막', 'last', 'final', 'end', 'outro'], weight: -1.0 },
    { words: ['중간', 'middle', 'mid'], weight: 0.0 },
    { words: ['before', '이전', 'pre'], weight: 0.9 },
    { words: ['after', '이후', 'post'], weight: -0.9 }
  ];

  /**
   * 파일명에서 날짜/시간 정보 추출
   */
  public extractDateFromFilename(filename: string): DateExtractionResult {
    const cleanName = filename.toLowerCase();
    
    for (const pattern of this.datePatterns) {
      const match = cleanName.match(pattern.regex);
      
      if (match) {
        const date = this.parseMatchToDate(match, pattern.name);
        if (date) {
          return {
            date,
            confidence: pattern.confidence,
            pattern: pattern.name,
            source: 'filename'
          };
        }
      }
    }

    // 패턴 매칭 실패 시 순서 키워드로 추론
    return this.inferOrderFromKeywords(cleanName);
  }

  /**
   * 매칭된 패턴을 실제 Date 객체로 변환
   */
  private parseMatchToDate(match: RegExpMatchArray, patternName: string): Date | null {
    try {
      switch (patternName) {
        case 'YYYY-MM-DD':
        case 'YYYYMMDD':
          return new Date(
            parseInt(match[1]), // year
            parseInt(match[2]) - 1, // month (0-based)
            parseInt(match[3]) // day
          );

        case 'DD-MM-YYYY':
          return new Date(
            parseInt(match[3]), // year
            parseInt(match[2]) - 1, // month
            parseInt(match[1]) // day
          );

        case 'Korean Date':
          return new Date(
            parseInt(match[1]), // 년
            parseInt(match[2]) - 1, // 월
            parseInt(match[3]) // 일
          );

        case 'Full DateTime':
          return new Date(
            parseInt(match[1]), // year
            parseInt(match[2]) - 1, // month
            parseInt(match[3]), // day
            parseInt(match[4]), // hour
            parseInt(match[5]), // minute
            parseInt(match[6]) // second
          );
          
        case 'Full DateTime with Milliseconds':
          return new Date(
            parseInt(match[1]), // year
            parseInt(match[2]) - 1, // month
            parseInt(match[3]), // day
            parseInt(match[4]), // hour
            parseInt(match[5]), // minute
            parseInt(match[6]), // second
            parseInt(match[7]) // milliseconds
          );
          
        case 'Time Only':
          const today = new Date();
          today.setHours(
            parseInt(match[1]), // hour
            parseInt(match[2]), // minute
            parseInt(match[3]), // second
            0 // milliseconds
          );
          return today;

        case 'Timestamp_13':
          return new Date(parseInt(match[1]));
          
        case 'Timestamp_10':
          return new Date(parseInt(match[1]) * 1000);

        case 'Sequence':
          // 시퀀스 번호를 기준일로부터의 상대적 날짜로 변환
          const baseDate = new Date();
          const sequence = parseInt(match[1]);
          return new Date(baseDate.getTime() + sequence * 1000);

        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * 키워드를 통한 순서 추론
   */
  private inferOrderFromKeywords(filename: string): DateExtractionResult {
    let maxWeight = -2;
    let matchedKeyword = '';

    for (const keywordGroup of this.orderKeywords) {
      for (const word of keywordGroup.words) {
        if (filename.includes(word)) {
          if (keywordGroup.weight > maxWeight) {
            maxWeight = keywordGroup.weight;
            matchedKeyword = word;
          }
        }
      }
    }

    if (maxWeight > -2) {
      // 가상의 날짜 생성 (순서 기반)
      const baseDate = new Date();
      const offsetHours = maxWeight * 24; // 가중치를 시간으로 변환
      const inferredDate = new Date(baseDate.getTime() + offsetHours * 60 * 60 * 1000);

      return {
        date: inferredDate,
        confidence: 0.3,
        pattern: `Keyword: ${matchedKeyword}`,
        source: 'inferred'
      };
    }

    return {
      date: null,
      confidence: 0,
      pattern: 'No pattern found',
      source: 'filename'
    };
  }

  /**
   * 파일 목록 1차 정렬 (파일명 기반)
   */
  public sortFilesByName(files: any[]): FileMetadata[] {
    const analyzedFiles: FileMetadata[] = files.map((file, index) => {
      const dateResult = this.extractDateFromFilename(file.name);
      
      return {
        originalName: file.name,
        extractedDate: dateResult.date || undefined,
        confidence: dateResult.confidence,
        pattern: dateResult.pattern,
        size: file.size || 0,
        uploadOrder: index
      };
    });

    // 정렬 로직
    return analyzedFiles.sort((a, b) => {
      // 1. 날짜가 추출된 파일이 우선
      if (a.extractedDate && !b.extractedDate) return -1;
      if (!a.extractedDate && b.extractedDate) return 1;
      
      // 2. 둘 다 날짜가 있으면 날짜 순
      if (a.extractedDate && b.extractedDate) {
        return a.extractedDate.getTime() - b.extractedDate.getTime();
      }
      
      // 3. 둘 다 날짜가 없으면 신뢰도 순
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      
      // 4. 마지막으로 업로드 순서
      return a.uploadOrder - b.uploadOrder;
    });
  }

  /**
   * 파일명 패턴 분석 리포트 생성
   */
  public generateAnalysisReport(files: FileMetadata[]): {
    totalFiles: number;
    withDates: number;
    withSequence: number;
    patterns: Record<string, number>;
    recommendations: string[];
  } {
    const patterns: Record<string, number> = {};
    let withDates = 0;
    let withSequence = 0;

    files.forEach(file => {
      if (file.extractedDate) withDates++;
      if (file.pattern.includes('Sequence')) withSequence++;
      
      patterns[file.pattern] = (patterns[file.pattern] || 0) + 1;
    });

    const recommendations: string[] = [];
    
    if (withDates / files.length < 0.5) {
      recommendations.push('파일명에 날짜 정보를 포함하면 더 정확한 정렬이 가능합니다');
    }
    
    if (withSequence > withDates) {
      recommendations.push('시퀀스 번호보다 실제 날짜/시간 정보가 더 정확합니다');
    }

    return {
      totalFiles: files.length,
      withDates,
      withSequence,
      patterns,
      recommendations
    };
  }
}

// 사용 예시
export const filenameAnalyzer = new FilenameAnalyzer();