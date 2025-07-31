// 단순 파일명 기반 정렬 유틸리티

export class SimpleFileSorter {
  /**
   * 파일명을 기준으로 내림차순 정렬
   * @param files 정렬할 파일 배열
   * @returns 내림차순으로 정렬된 파일 배열
   */
  public static sortFilesByNameDesc(files: File[]): File[] {
    return [...files].sort((a, b) => {
      // 한국어 지원, 숫자 인식 정렬
      return b.name.localeCompare(a.name, 'ko-KR', { 
        numeric: true,
        sensitivity: 'base' 
      });
    });
  }

  /**
   * 파일명을 기준으로 오름차순 정렬
   * @param files 정렬할 파일 배열
   * @returns 오름차순으로 정렬된 파일 배열
   */
  public static sortFilesByNameAsc(files: File[]): File[] {
    return [...files].sort((a, b) => {
      // 한국어 지원, 숫자 인식 정렬
      return a.name.localeCompare(b.name, 'ko-KR', { 
        numeric: true,
        sensitivity: 'base' 
      });
    });
  }

  /**
   * 파일 정보를 간단한 형식으로 변환
   * @param files 파일 배열
   * @returns 정렬된 파일 정보
   */
  public static prepareFiles(files: File[]) {
    const sorted = this.sortFilesByNameDesc(files);
    
    return sorted.map((file, index) => ({
      file,
      originalName: file.name,
      sortedIndex: index,
      size: file.size,
      type: file.type
    }));
  }
}