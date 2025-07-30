// TTS 텍스트 전처리기 - 자연스러운 음성을 위한 텍스트 최적화

export class TTSTextPreprocessor {
  // 숫자를 한국어로 변환
  convertNumbersToKorean(text: string): string {
    // 기본 숫자 맵
    const digitMap: Record<string, string> = {
      '0': '영', '1': '일', '2': '이', '3': '삼', '4': '사',
      '5': '오', '6': '육', '7': '칠', '8': '팔', '9': '구'
    };

    // 큰 단위
    const units = ['', '십', '백', '천'];
    const bigUnits = ['', '만', '억', '조'];

    // 연도 변환 (예: 2025년 → 이천이십오년)
    text = text.replace(/(\d{4})년/g, (match, year) => {
      return this.convertYearToKorean(year) + '년';
    });

    // 금액 변환 (예: 1억원 → 일억원)
    text = text.replace(/(\d+)억/g, (match, num) => {
      return this.convertNumberToKorean(num) + '억';
    });

    // 퍼센트 변환 (예: 95% → 구십오 퍼센트)
    text = text.replace(/(\d+)%/g, (match, num) => {
      return this.convertNumberToKorean(num) + ' 퍼센트';
    });

    // 시간 변환 (예: 3초 → 삼초)
    text = text.replace(/(\d+)초/g, (match, num) => {
      return this.convertNumberToKorean(num) + '초';
    });

    // 일반 숫자 변환
    text = text.replace(/(\d+)/g, (match, num) => {
      if (num.length <= 2) {
        return this.convertNumberToKorean(num);
      }
      return num; // 큰 숫자는 그대로 유지
    });

    return text;
  }

  // 연도를 한국어로 변환
  private convertYearToKorean(year: string): string {
    const result: string[] = [];
    const digits = year.split('');
    
    // 천의 자리
    if (digits[0] !== '0') {
      result.push(this.getKoreanDigit(digits[0]));
      result.push('천');
    }
    
    // 백의 자리
    if (digits[1] !== '0') {
      result.push(this.getKoreanDigit(digits[1]));
      result.push('백');
    }
    
    // 십의 자리
    if (digits[2] !== '0') {
      result.push(this.getKoreanDigit(digits[2]));
      result.push('십');
    }
    
    // 일의 자리
    if (digits[3] !== '0') {
      result.push(this.getKoreanDigit(digits[3]));
    }
    
    return result.join('');
  }

  // 숫자를 한국어로 변환
  private convertNumberToKorean(num: string): string {
    const number = parseInt(num);
    
    if (number === 0) return '영';
    if (number === 1) return '일';
    
    const result: string[] = [];
    
    // 십의 자리
    if (number >= 10) {
      const tens = Math.floor(number / 10);
      if (tens > 1) {
        result.push(this.getKoreanDigit(tens.toString()));
      }
      result.push('십');
    }
    
    // 일의 자리
    const ones = number % 10;
    if (ones > 0) {
      result.push(this.getKoreanDigit(ones.toString()));
    }
    
    return result.join('');
  }

  private getKoreanDigit(digit: string): string {
    const digitMap: Record<string, string> = {
      '0': '영', '1': '일', '2': '이', '3': '삼', '4': '사',
      '5': '오', '6': '육', '7': '칠', '8': '팔', '9': '구'
    };
    return digitMap[digit] || digit;
  }

  // 영어 약어 및 단어를 한글로 변환
  convertEnglishToKorean(text: string): string {
    const englishMap: Record<string, string> = {
      // 자동차 관련
      'BMW': '비엠더블유',
      'SM6': '에스엠식스',
      'X5': '엑스파이브',
      'SUV': '에스유브이',
      'CNC': '씨엔씨',
      
      // 기술 용어
      'AI': '에이아이',
      'TTS': '티티에스',
      'UI': '유아이',
      'UX': '유엑스',
      'API': '에이피아이',
      'IT': '아이티',
      
      // 일반 약어
      'DIY': '디아이와이',
      'OK': '오케이',
      'CEO': '씨이오',
      'FAQ': '에프에이큐'
    };

    // 대소문자 구분 없이 치환
    Object.entries(englishMap).forEach(([eng, kor]) => {
      const regex = new RegExp(`\\b${eng}\\b`, 'gi');
      text = text.replace(regex, kor);
    });

    return text;
  }

  // 문장 부호 최적화 및 자연스러운 일시정지 추가
  addNaturalPauses(text: string): string {
    // 마침표 뒤에 긴 일시정지
    text = text.replace(/\. /g, '. <break time="800ms"/> ');
    
    // 물음표 뒤에 중간 일시정지
    text = text.replace(/\? /g, '? <break time="600ms"/> ');
    
    // 느낌표 뒤에 중간 일시정지
    text = text.replace(/! /g, '! <break time="600ms"/> ');
    
    // 쉼표 뒤에 짧은 일시정지
    text = text.replace(/, /g, ', <break time="300ms"/> ');
    
    // 줄바꿈은 중간 일시정지로
    text = text.replace(/\n/g, ' <break time="500ms"/> ');
    
    // 문단 사이에 더 긴 일시정지
    text = text.replace(/\n\n/g, ' <break time="1500ms"/> ');
    
    return text;
  }

  // 감정 표현을 위한 SSML 태그 추가
  addEmotionalEmphasis(text: string, emotion: string): string {
    const emotionSettings = {
      'excited': {
        rate: '110%',
        pitch: '+10%',
        volume: '+2dB'
      },
      'calm': {
        rate: '90%',
        pitch: '-5%',
        volume: '0dB'
      },
      'professional': {
        rate: '95%',
        pitch: '0%',
        volume: '0dB'
      },
      'cheerful': {
        rate: '105%',
        pitch: '+8%',
        volume: '+1dB'
      },
      'neutral': {
        rate: '100%',
        pitch: '0%',
        volume: '0dB'
      }
    };

    const settings = emotionSettings[emotion] || emotionSettings['neutral'];
    
    // 전체 텍스트에 감정 설정 적용
    return `<prosody rate="${settings.rate}" pitch="${settings.pitch}" volume="${settings.volume}">${text}</prosody>`;
  }

  // 중요한 단어나 구문 강조
  addEmphasisToKeywords(text: string, keywords: string[]): string {
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      text = text.replace(regex, `<emphasis level="strong">${keyword}</emphasis>`);
    });
    
    return text;
  }

  // 대화체를 자연스럽게 변환
  convertConversationalTone(text: string): string {
    // 축약형을 풀어서 쓰기
    text = text.replace(/됐습니다/g, '되었습니다');
    text = text.replace(/했습니다/g, '하였습니다');
    text = text.replace(/됐어요/g, '되었어요');
    text = text.replace(/했어요/g, '하였어요');
    
    // 구어체를 문어체로
    text = text.replace(/근데/g, '그런데');
    text = text.replace(/걸/g, '것을');
    text = text.replace(/거예요/g, '것입니다');
    
    return text;
  }

  // 전체 전처리 파이프라인
  preprocessText(
    text: string,
    options: {
      emotion?: string;
      keywords?: string[];
      convertNumbers?: boolean;
      convertEnglish?: boolean;
      addPauses?: boolean;
      formalTone?: boolean;
    } = {}
  ): string {
    let processedText = text;

    // 1. 숫자 변환
    if (options.convertNumbers !== false) {
      processedText = this.convertNumbersToKorean(processedText);
    }

    // 2. 영어 변환
    if (options.convertEnglish !== false) {
      processedText = this.convertEnglishToKorean(processedText);
    }

    // 3. 대화체 변환 (격식체로)
    if (options.formalTone) {
      processedText = this.convertConversationalTone(processedText);
    }

    // 4. 키워드 강조
    if (options.keywords && options.keywords.length > 0) {
      processedText = this.addEmphasisToKeywords(processedText, options.keywords);
    }

    // 5. 자연스러운 일시정지 추가
    if (options.addPauses !== false) {
      processedText = this.addNaturalPauses(processedText);
    }

    // 6. 감정 표현 추가
    if (options.emotion) {
      processedText = this.addEmotionalEmphasis(processedText, options.emotion);
    }

    return processedText;
  }

  // 자동차 정비 영상용 특화 전처리
  preprocessAutoRepairScript(text: string): string {
    // 자동차 관련 중요 키워드
    const autoKeywords = [
      '휠복원', '휠수리', '샌드블라스터', 'CNC', '클리어코트',
      '휠굴절', '휠크랙', '분체도색', '유분제거', '신차급'
    ];

    return this.preprocessText(text, {
      emotion: 'professional',
      keywords: autoKeywords,
      convertNumbers: true,
      convertEnglish: true,
      addPauses: true,
      formalTone: true
    });
  }
}