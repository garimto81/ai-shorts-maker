import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    version: '2.0.1',
    features: [
      '파일명 내림차순 정렬 (Z→A)',
      '파일명 오름차순 정렬 (A→Z)',
      '드래그로 순서 변경',
      '번호 직접 입력'
    ],
    lastUpdated: new Date().toISOString(),
    message: '정렬 기능이 정상적으로 작동합니다!'
  });
}