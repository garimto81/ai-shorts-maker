// 로딩 스피너 컴포넌트
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message = '로딩 중...',
  overlay = false
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10', 
    large: 'w-16 h-16'
  };

  const LoadingComponent = (
    <div className={`loading-spinner ${overlay ? 'overlay' : ''}`}>
      <div className="spinner-container">
        <div className={`spinner ${sizeClasses[size]}`}>
          <div className="spinner-inner"></div>
        </div>
        {message && <p className="loading-message">{message}</p>}
      </div>

      <style jsx>{`
        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .loading-spinner.overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          z-index: 9999;
        }

        .spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner-inner {
          width: 100%;
          height: 100%;
          border: 2px solid transparent;
          border-top: 2px solid #e74c3c;
          border-radius: 50%;
          animation: spin 0.8s linear infinite reverse;
        }

        .loading-message {
          color: #666;
          font-size: 0.9rem;
          font-weight: 500;
          margin: 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return LoadingComponent;
};

export default LoadingSpinner;