import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Đã xảy ra lỗi</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Ứng dụng gặp lỗi không mong muốn:</p>
              {this.state.error && (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <code className="text-red-800 text-xs">
                    {this.state.error.message}
                  </code>
                </div>
              )}
              <p className="mt-4">Vui lòng thử làm mới trang hoặc liên hệ admin.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Làm mới trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}