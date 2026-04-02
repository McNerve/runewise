interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  title?: string;
}

export default function ErrorState({
  error,
  onRetry,
  title = "Something went wrong",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-10 h-10 mb-4 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center text-danger text-lg">
        ⚠
      </div>
      <h3 className="text-base font-medium text-danger mb-1">{title}</h3>
      <p className="text-sm text-text-secondary/60 max-w-sm mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-1.5 rounded text-sm bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
