// React Error Boundary 컴포넌트
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트합니다.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary에서 오류를 감지했습니다:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 에러 리포팅 서비스에 전송 (개발 환경에서는 콘솔에만 출력)
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  public render() {
    if (this.state.hasError) {
      // 커스텀 폴백 UI가 제공되면 사용, 아니면 기본 에러 UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-container">
            <h2>🚨 애플리케이션 오류가 발생했습니다</h2>
            <details className="error-details">
              <summary>오류 세부사항 보기</summary>
              <div className="error-info">
                <h3>오류 메시지:</h3>
                <pre>{this.state.error?.message}</pre>
                
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <h3>스택 트레이스:</h3>
                    <pre>{this.state.error?.stack}</pre>
                    
                    <h3>컴포넌트 스택:</h3>
                    <pre>{this.state.errorInfo?.componentStack}</pre>
                  </>
                )}
              </div>
            </details>
            
            <div className="error-actions">
              <button 
                onClick={() => window.location.reload()}
                className="retry-button"
              >
                🔄 페이지 새로고침
              </button>
              
              <button 
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="reset-button"
              >
                🏠 에러 상태 초기화
              </button>
            </div>
          </div>

          <style jsx>{`
            .error-boundary {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .error-container {
              background: white;
              border-radius: 12px;
              padding: 2rem;
              max-width: 600px;
              width: 90%;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              text-align: center;
            }

            .error-container h2 {
              color: #e74c3c;
              margin-bottom: 1.5rem;
              font-size: 1.5rem;
            }

            .error-details {
              margin: 1.5rem 0;
              text-align: left;
            }

            .error-details summary {
              cursor: pointer;
              color: #3498db;
              font-weight: 600;
              margin-bottom: 1rem;
            }

            .error-info {
              background: #f8f9fa;
              padding: 1rem;
              border-radius: 6px;
              margin-top: 1rem;
            }

            .error-info h3 {
              color: #2c3e50;
              margin: 1rem 0 0.5rem 0;
              font-size: 1rem;
            }

            .error-info pre {
              background: #2c3e50;
              color: white;
              padding: 1rem;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 0.8rem;
              line-height: 1.4;
            }

            .error-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
              margin-top: 2rem;
            }

            .retry-button, .reset-button {
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            }

            .retry-button {
              background: #3498db;
              color: white;
            }

            .retry-button:hover {
              background: #2980b9;
              transform: translateY(-1px);
            }

            .reset-button {
              background: #95a5a6;
              color: white;
            }

            .reset-button:hover {
              background: #7f8c8d;
              transform: translateY(-1px);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;