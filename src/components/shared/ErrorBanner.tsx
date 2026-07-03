export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
      <span className="flex-1 text-sm">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-rose-400 hover:text-rose-600">✕</button>
      )}
    </div>
  );
}
