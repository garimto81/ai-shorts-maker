// 드래그 앤 드롭으로 정렬 가능한 이미지 리스트 컴포넌트

import React, { useState, useRef, useEffect } from 'react';
import { SortableImage, SortMode, ImageSorter } from '@/lib/image-sorter';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Shuffle, 
  GripVertical,
  RotateCcw,
  Save
} from 'lucide-react';

interface SortableImageListProps {
  images: SortableImage[];
  onSortChange: (sortedImages: SortableImage[]) => void;
  enableAISort?: boolean;
}

export function SortableImageList({ 
  images: initialImages, 
  onSortChange,
  enableAISort = true 
}: SortableImageListProps) {
  
  const [images, setImages] = useState<SortableImage[]>(initialImages);
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [sortBy, setSortBy] = useState<'filename' | 'fileSize' | 'uploadTime' | 'dateTime'>('filename');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const sorter = useRef(new ImageSorter());
  const originalOrder = useRef<SortableImage[]>(initialImages);
  
  useEffect(() => {
    setImages(initialImages);
    originalOrder.current = initialImages;
  }, [initialImages]);
  
  // 정렬 모드 변경
  const handleSortModeChange = (mode: SortMode) => {
    setSortMode(mode);
    
    if (mode === 'manual') {
      // 수동 모드로 전환시 현재 순서 유지
      return;
    }
    
    const sortedImages = sorter.current.sortImages(images, {
      mode,
      sortBy,
      customOrder: images.map(img => img.id)
    });
    
    setImages(sortedImages);
    onSortChange(sortedImages);
  };
  
  // 정렬 기준 변경
  const handleSortByChange = (by: typeof sortBy) => {
    setSortBy(by);
    
    if (sortMode === 'ascending' || sortMode === 'descending') {
      const sortedImages = sorter.current.sortImages(images, {
        mode: sortMode,
        sortBy: by,
        customOrder: images.map(img => img.id)
      });
      
      setImages(sortedImages);
      onSortChange(sortedImages);
    }
  };
  
  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setIsDragging(true);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    
    // 드래그 중인 요소에 대한 미리보기 이미지 설정
    const dragImage = new Image();
    dragImage.src = images[index].path;
    e.dataTransfer.setDragImage(dragImage, 50, 50);
  };
  
  // 드래그 오버
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };
  
  // 드래그 종료
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  // 드롭
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }
    
    const reorderedImages = sorter.current.reorderImages(
      images,
      draggedIndex,
      dropIndex
    );
    
    setImages(reorderedImages);
    onSortChange(reorderedImages);
    setSortMode('manual'); // 수동 정렬로 전환
    
    handleDragEnd();
  };
  
  // 원래 순서로 복원
  const handleResetOrder = () => {
    setImages(originalOrder.current);
    onSortChange(originalOrder.current);
    setSortMode('manual');
  };
  
  // 정렬 상태 저장
  const handleSaveOrder = () => {
    const state = sorter.current.saveSortState(images, {
      mode: sortMode,
      sortBy,
      customOrder: images.map(img => img.id)
    });
    
    localStorage.setItem('imagesSortState', state);
    alert('정렬 순서가 저장되었습니다.');
  };
  
  // 정렬 상태 불러오기
  const handleLoadOrder = () => {
    const state = localStorage.getItem('imagesSortState');
    if (state) {
      const sortedImages = sorter.current.restoreSortState(state, originalOrder.current);
      setImages(sortedImages);
      onSortChange(sortedImages);
      alert('저장된 정렬 순서를 불러왔습니다.');
    }
  };
  
  return (
    <div className="space-y-4">
      {/* 정렬 컨트롤 */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortMode === 'ascending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortModeChange('ascending')}
          >
            <ArrowUp className="w-4 h-4 mr-1" />
            오름차순
          </Button>
          
          <Button
            variant={sortMode === 'descending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortModeChange('descending')}
          >
            <ArrowDown className="w-4 h-4 mr-1" />
            내림차순
          </Button>
          
          <Button
            variant={sortMode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortModeChange('manual')}
          >
            <GripVertical className="w-4 h-4 mr-1" />
            수동 정렬
          </Button>
          
          {enableAISort && (
            <Button
              variant={sortMode === 'ai' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortModeChange('ai')}
            >
              <Shuffle className="w-4 h-4 mr-1" />
              AI 정렬
            </Button>
          )}
        </div>
        
        {/* 정렬 기준 선택 */}
        {(sortMode === 'ascending' || sortMode === 'descending') && (
          <div className="flex flex-wrap gap-2">
            <label className="text-sm font-medium">정렬 기준:</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortByChange(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="filename">파일명</option>
              <option value="fileSize">파일 크기</option>
              <option value="uploadTime">업로드 시간</option>
              <option value="dateTime">촬영 날짜</option>
            </select>
          </div>
        )}
        
        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetOrder}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            원래 순서로
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveOrder}
          >
            <Save className="w-4 h-4 mr-1" />
            순서 저장
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadOrder}
          >
            불러오기
          </Button>
        </div>
      </div>
      
      {/* 이미지 리스트 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`
              relative group cursor-move
              ${isDragging && draggedIndex === index ? 'opacity-50' : ''}
              ${isDragging && dragOverIndex === index ? 'border-2 border-blue-500' : ''}
            `}
            draggable={sortMode === 'manual'}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, index)}
          >
            {/* 순서 번호 */}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>
            
            {/* 드래그 핸들 (수동 모드일 때만) */}
            {sortMode === 'manual' && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
            )}
            
            {/* 이미지 */}
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={image.path}
                alt={image.filename}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            
            {/* 파일명 */}
            <p className="mt-2 text-xs text-gray-600 truncate">
              {image.filename}
            </p>
          </div>
        ))}
      </div>
      
      {/* 드래그 중 표시 */}
      {isDragging && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          이미지를 드래그하여 순서를 변경하세요
        </div>
      )}
    </div>
  );
}