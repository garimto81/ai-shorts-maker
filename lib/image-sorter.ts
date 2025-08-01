// 이미지 정렬 시스템
// 오름차순, 내림차순, 수동 정렬 지원

export type SortMode = 'ascending' | 'descending' | 'manual' | 'ai';

export interface SortableImage {
  id: string;
  path: string;
  filename: string;
  fileSize: number;
  uploadTime: number;
  index: number;
  metadata?: {
    dateTime?: string;
    width?: number;
    height?: number;
  };
}

export interface SortOptions {
  mode: SortMode;
  sortBy: 'filename' | 'fileSize' | 'uploadTime' | 'dateTime';
  customOrder?: string[]; // 수동 정렬시 사용
}

export class ImageSorter {
  
  /**
   * 이미지 배열을 지정된 방식으로 정렬
   */
  sortImages(images: SortableImage[], options: SortOptions): SortableImage[] {
    switch (options.mode) {
      case 'ascending':
        return this.sortAscending(images, options.sortBy);
      
      case 'descending':
        return this.sortDescending(images, options.sortBy);
      
      case 'manual':
        return this.sortManual(images, options.customOrder || []);
      
      case 'ai':
        // AI 정렬은 기존 intelligent-file-sorter 사용
        return images;
      
      default:
        return images;
    }
  }
  
  /**
   * 오름차순 정렬
   */
  private sortAscending(images: SortableImage[], sortBy: string): SortableImage[] {
    return [...images].sort((a, b) => {
      switch (sortBy) {
        case 'filename':
          return this.naturalSort(a.filename, b.filename);
        
        case 'fileSize':
          return a.fileSize - b.fileSize;
        
        case 'uploadTime':
          return a.uploadTime - b.uploadTime;
        
        case 'dateTime':
          const dateA = this.extractDateTime(a);
          const dateB = this.extractDateTime(b);
          return dateA - dateB;
        
        default:
          return 0;
      }
    });
  }
  
  /**
   * 내림차순 정렬
   */
  private sortDescending(images: SortableImage[], sortBy: string): SortableImage[] {
    return [...images].sort((a, b) => {
      switch (sortBy) {
        case 'filename':
          return this.naturalSort(b.filename, a.filename);
        
        case 'fileSize':
          return b.fileSize - a.fileSize;
        
        case 'uploadTime':
          return b.uploadTime - a.uploadTime;
        
        case 'dateTime':
          const dateA = this.extractDateTime(a);
          const dateB = this.extractDateTime(b);
          return dateB - dateA;
        
        default:
          return 0;
      }
    });
  }
  
  /**
   * 수동 정렬 (사용자가 지정한 순서)
   */
  private sortManual(images: SortableImage[], customOrder: string[]): SortableImage[] {
    if (customOrder.length === 0) {
      return images;
    }
    
    // customOrder의 ID 순서에 따라 정렬
    const orderMap = new Map<string, number>();
    customOrder.forEach((id, index) => {
      orderMap.set(id, index);
    });
    
    return [...images].sort((a, b) => {
      const indexA = orderMap.get(a.id) ?? Infinity;
      const indexB = orderMap.get(b.id) ?? Infinity;
      return indexA - indexB;
    });
  }
  
  /**
   * 자연스러운 문자열 정렬 (숫자 고려)
   */
  private naturalSort(a: string, b: string): number {
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: 'base'
    });
    return collator.compare(a, b);
  }
  
  /**
   * 이미지에서 날짜/시간 추출
   */
  private extractDateTime(image: SortableImage): number {
    // 1. 메타데이터에서 날짜 확인
    if (image.metadata?.dateTime) {
      return new Date(image.metadata.dateTime).getTime();
    }
    
    // 2. 파일명에서 날짜 패턴 추출
    const datePatterns = [
      /(\d{4})[._-]?(\d{2})[._-]?(\d{2})[._-]?(\d{2})?(\d{2})?(\d{2})?/,
      /(\d{2})[._-](\d{2})[._-](\d{4})/,
    ];
    
    for (const pattern of datePatterns) {
      const match = image.filename.match(pattern);
      if (match) {
        try {
          const dateStr = match[0].replace(/[._-]/g, '');
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.getTime();
          }
        } catch (e) {
          // 날짜 파싱 실패시 계속
        }
      }
    }
    
    // 3. 업로드 시간 사용
    return image.uploadTime;
  }
  
  /**
   * 정렬 상태 저장
   */
  saveSortState(images: SortableImage[], sortOptions: SortOptions): string {
    const state = {
      sortOptions,
      imageOrder: images.map(img => img.id),
      timestamp: Date.now()
    };
    
    return JSON.stringify(state);
  }
  
  /**
   * 정렬 상태 복원
   */
  restoreSortState(stateJson: string, images: SortableImage[]): SortableImage[] {
    try {
      const state = JSON.parse(stateJson);
      
      if (state.sortOptions.mode === 'manual') {
        state.sortOptions.customOrder = state.imageOrder;
      }
      
      return this.sortImages(images, state.sortOptions);
    } catch (error) {
      console.error('정렬 상태 복원 실패:', error);
      return images;
    }
  }
  
  /**
   * 드래그 앤 드롭으로 순서 변경
   */
  reorderImages(
    images: SortableImage[],
    dragIndex: number,
    dropIndex: number
  ): SortableImage[] {
    const result = [...images];
    const [removed] = result.splice(dragIndex, 1);
    result.splice(dropIndex, 0, removed);
    
    // 인덱스 재할당
    return result.map((img, index) => ({
      ...img,
      index
    }));
  }
}