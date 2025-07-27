// 통합 파일 정렬 엔진 - 1차(파일명) + 2차(이미지 분석) 조합

import { filenameAnalyzer, FileMetadata } from './filename-analyzer';
import { geminiImageAnalyzer, ImageAnalysisResult } from './gemini-image-analyzer';

interface SortedFile {
  file: any;
  originalIndex: number;
  finalIndex: number;
  metadata: FileMetadata;
  imageAnalysis?: ImageAnalysisResult;
  sortingReasons: string[];
  confidence: number;
}

interface SortingReport {
  totalFiles: number;
  processingTime: number;
  sortingMethod: string;
  confidenceScore: number;
  adjustments: {
    fromFilename: number;
    fromImageAnalysis: number;
    conflictResolutions: number;
  };
  recommendations: string[];
}

export class IntelligentFileSorter {
  
  /**
   * 메인 정렬 함수 - 1차(파일명) + 2차(이미지 분석)
   */
  public async sortFiles(files: any[]): Promise<{
    sortedFiles: SortedFile[];
    report: SortingReport;
  }> {
    const startTime = Date.now();
    console.log(`🎯 ${files.length}개 파일 지능형 정렬 시작...`);

    // 1차: 파일명 기반 정렬
    console.log('📝 1차: 파일명 분석 중...');
    const filenameResults = filenameAnalyzer.sortFilesByName(files);
    
    // 파일명 순서로 파일 재정렬
    const reorderedFiles = filenameResults.map(metadata => {
      const file = files.find(f => f.name === metadata.originalName)!;
      return file;
    });

    // 2차: 이미지 내용 분석
    console.log('🤖 2차: Gemini AI 이미지 분석 중...');
    const imageAnalyses = await geminiImageAnalyzer.analyzeBatch(reorderedFiles);

    // 3차: 결과 통합 및 최종 순서 결정
    console.log('🔄 3차: 결과 통합 및 순서 최적화...');
    const finalSortedFiles = this.combineAndOptimize(
      reorderedFiles,
      filenameResults,
      imageAnalyses
    );

    const processingTime = Date.now() - startTime;
    
    // 정렬 리포트 생성
    const report = this.generateSortingReport(
      files,
      finalSortedFiles,
      filenameResults,
      imageAnalyses,
      processingTime
    );

    console.log(`✅ 파일 정렬 완료 (${processingTime}ms)`);
    
    return {
      sortedFiles: finalSortedFiles,
      report
    };
  }

  /**
   * 파일명 분석과 이미지 분석 결과를 통합하여 최종 순서 결정
   */
  private combineAndOptimize(
    files: any[],
    filenameResults: FileMetadata[],
    imageAnalyses: ImageAnalysisResult[]
  ): SortedFile[] {
    
    const combinedData = files.map((file, index) => {
      const metadata = filenameResults.find(f => f.originalName === file.name)!;
      const imageAnalysis = imageAnalyses.find(a => a.filename === file.name);
      
      return {
        file,
        originalIndex: index,
        metadata,
        imageAnalysis,
        filenameOrder: filenameResults.findIndex(f => f.originalName === file.name),
        imageOrder: imageAnalysis?.sequenceHints.chronologicalOrder || index + 1
      };
    });

    // 가중 점수 계산
    const scoredFiles = combinedData.map(item => {
      const filenameWeight = item.metadata.confidence;
      const imageWeight = item.imageAnalysis?.confidence || 0;
      
      // 파일명과 이미지 분석 결과를 종합한 점수
      const filenameScore = (1 / item.filenameOrder) * filenameWeight;
      const imageScore = item.imageAnalysis ? 
        this.calculateImageSequenceScore(item.imageAnalysis) * imageWeight : 0;
      
      // 최종 점수 (파일명 70%, 이미지 분석 30%)
      const finalScore = (filenameScore * 0.7) + (imageScore * 0.3);
      
      const sortingReasons = this.generateSortingReasons(
        item.metadata,
        item.imageAnalysis,
        filenameWeight,
        imageWeight
      );

      return {
        ...item,
        finalScore,
        sortingReasons,
        confidence: Math.max(filenameWeight, imageWeight)
      };
    });

    // 최종 점수로 정렬
    const sorted = scoredFiles.sort((a, b) => b.finalScore - a.finalScore);

    // SortedFile 형태로 변환
    return sorted.map((item, finalIndex) => ({
      file: item.file,
      originalIndex: item.originalIndex,
      finalIndex,
      metadata: item.metadata,
      imageAnalysis: item.imageAnalysis,
      sortingReasons: item.sortingReasons,
      confidence: item.confidence
    }));
  }

  /**
   * 이미지 분석 결과를 순서 점수로 변환
   */
  private calculateImageSequenceScore(analysis: ImageAnalysisResult): number {
    const { sequenceHints } = analysis;
    
    // 시작, 중간, 끝의 확률을 점수로 변환
    let score = 0;
    
    // 시작 장면일 가능성이 높으면 높은 점수
    if (sequenceHints.isBeginning > 0.7) {
      score += 1.0;
    }
    
    // 끝 장면일 가능성이 높으면 낮은 점수
    if (sequenceHints.isEnding > 0.7) {
      score += 0.1;
    }
    
    // 중간 장면은 chronologicalOrder 기반
    if (sequenceHints.isMiddle > 0.5) {
      score += (11 - sequenceHints.chronologicalOrder) / 10;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 정렬 근거 생성
   */
  private generateSortingReasons(
    metadata: FileMetadata,
    imageAnalysis?: ImageAnalysisResult,
    filenameWeight?: number,
    imageWeight?: number
  ): string[] {
    const reasons: string[] = [];
    
    // 파일명 기반 근거
    if (metadata.extractedDate) {
      reasons.push(`파일명 날짜: ${metadata.extractedDate.toLocaleDateString()}`);
    }
    
    if (metadata.pattern !== 'No pattern found') {
      reasons.push(`패턴: ${metadata.pattern}`);
    }
    
    // 이미지 분석 기반 근거
    if (imageAnalysis) {
      if (imageAnalysis.sequenceHints.isBeginning > 0.7) {
        reasons.push('AI 분석: 시작 장면 특징');
      }
      
      if (imageAnalysis.sequenceHints.isEnding > 0.7) {
        reasons.push('AI 분석: 마무리 장면 특징');
      }
      
      if (imageAnalysis.analysis.timeOfDay) {
        reasons.push(`시간대: ${imageAnalysis.analysis.timeOfDay}`);
      }
      
      if (imageAnalysis.analysis.temporalClues.length > 0) {
        reasons.push(`시간적 단서: ${imageAnalysis.analysis.temporalClues.join(', ')}`);
      }
    }
    
    // 가중치 정보
    if (filenameWeight && filenameWeight > 0.5) {
      reasons.push(`파일명 신뢰도: ${Math.round(filenameWeight * 100)}%`);
    }
    
    if (imageWeight && imageWeight > 0.5) {
      reasons.push(`AI 분석 신뢰도: ${Math.round(imageWeight * 100)}%`);
    }
    
    return reasons;
  }

  /**
   * 정렬 리포트 생성
   */
  private generateSortingReport(
    originalFiles: any[],
    sortedFiles: SortedFile[],
    filenameResults: FileMetadata[],
    imageAnalyses: ImageAnalysisResult[],
    processingTime: number
  ): SortingReport {
    
    // 순서 변경 통계
    let fromFilename = 0;
    let fromImageAnalysis = 0;
    let conflictResolutions = 0;
    
    sortedFiles.forEach((sortedFile, index) => {
      const originalOrder = sortedFile.originalIndex;
      const filenameOrder = filenameResults.findIndex(f => f.originalName === sortedFile.file.name);
      
      if (index !== originalOrder && index === filenameOrder) {
        fromFilename++;
      } else if (index !== originalOrder && index !== filenameOrder) {
        fromImageAnalysis++;
      }
      
      if (Math.abs(index - filenameOrder) > 2) {
        conflictResolutions++;
      }
    });

    // 전체 신뢰도 계산
    const totalConfidence = sortedFiles.reduce((sum, file) => sum + file.confidence, 0) / sortedFiles.length;
    
    // 정렬 방법 결정
    let sortingMethod = 'hybrid';
    if (fromFilename > fromImageAnalysis * 2) {
      sortingMethod = 'filename-dominant';
    } else if (fromImageAnalysis > fromFilename * 2) {
      sortingMethod = 'ai-dominant';
    }

    // 추천사항 생성
    const recommendations = this.generateRecommendations(
      sortedFiles,
      filenameResults,
      imageAnalyses,
      totalConfidence
    );

    return {
      totalFiles: originalFiles.length,
      processingTime,
      sortingMethod,
      confidenceScore: totalConfidence,
      adjustments: {
        fromFilename,
        fromImageAnalysis,
        conflictResolutions
      },
      recommendations
    };
  }

  /**
   * 추천사항 생성
   */
  private generateRecommendations(
    sortedFiles: SortedFile[],
    filenameResults: FileMetadata[],
    imageAnalyses: ImageAnalysisResult[],
    totalConfidence: number
  ): string[] {
    const recommendations: string[] = [];
    
    // 파일명 관련 추천
    const filesWithoutDates = filenameResults.filter(f => !f.extractedDate).length;
    if (filesWithoutDates / filenameResults.length > 0.5) {
      recommendations.push('파일명에 날짜/시간 정보를 포함하면 더 정확한 정렬이 가능합니다');
    }
    
    // 이미지 분석 관련 추천
    const lowConfidenceImages = imageAnalyses.filter(a => a.confidence < 0.5).length;
    if (lowConfidenceImages / imageAnalyses.length > 0.3) {
      recommendations.push('이미지 해상도를 높이거나 더 명확한 장면을 포함하면 AI 분석 정확도가 향상됩니다');
    }
    
    // 순서 관련 추천
    const hasBeginning = imageAnalyses.some(a => a.sequenceHints.isBeginning > 0.7);
    const hasEnding = imageAnalyses.some(a => a.sequenceHints.isEnding > 0.7);
    
    if (!hasBeginning) {
      recommendations.push('명확한 시작 장면을 추가하면 스토리 구성이 더 자연스러워집니다');
    }
    
    if (!hasEnding) {
      recommendations.push('명확한 마무리 장면을 추가하면 스토리가 완성됩니다');
    }
    
    // 전체 신뢰도 관련 추천
    if (totalConfidence < 0.6) {
      recommendations.push('파일명 규칙을 통일하고 이미지 품질을 개선하면 정렬 정확도가 크게 향상됩니다');
    }
    
    return recommendations;
  }

  /**
   * 정렬 결과 수동 조정
   */
  public adjustOrder(
    sortedFiles: SortedFile[],
    fromIndex: number,
    toIndex: number
  ): SortedFile[] {
    const adjusted = [...sortedFiles];
    const [movedFile] = adjusted.splice(fromIndex, 1);
    adjusted.splice(toIndex, 0, movedFile);
    
    // finalIndex 업데이트
    return adjusted.map((file, index) => ({
      ...file,
      finalIndex: index,
      sortingReasons: [
        ...file.sortingReasons,
        '사용자 수동 조정'
      ]
    }));
  }

  /**
   * 정렬 결과 검증
   */
  public validateSorting(sortedFiles: SortedFile[]): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // 시간 순서 검증
    const filesWithDates = sortedFiles.filter(f => f.metadata.extractedDate);
    for (let i = 1; i < filesWithDates.length; i++) {
      const prevDate = filesWithDates[i - 1].metadata.extractedDate!;
      const currDate = filesWithDates[i].metadata.extractedDate!;
      
      if (prevDate > currDate) {
        issues.push(`날짜 순서 불일치: ${filesWithDates[i - 1].file.name} → ${filesWithDates[i].file.name}`);
      }
    }
    
    // 스토리 흐름 검증
    const storyFlow = sortedFiles
      .filter(f => f.imageAnalysis)
      .map(f => f.imageAnalysis!.sequenceHints);
    
    const beginningCount = storyFlow.filter(s => s.isBeginning > 0.7).length;
    const endingCount = storyFlow.filter(s => s.isEnding > 0.7).length;
    
    if (beginningCount > 1) {
      issues.push('시작 장면이 여러 개 감지되었습니다');
      suggestions.push('가장 적절한 시작 장면 하나를 선택하세요');
    }
    
    if (endingCount > 1) {
      issues.push('마무리 장면이 여러 개 감지되었습니다');
      suggestions.push('가장 적절한 마무리 장면 하나를 선택하세요');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

export const intelligentFileSorter = new IntelligentFileSorter();