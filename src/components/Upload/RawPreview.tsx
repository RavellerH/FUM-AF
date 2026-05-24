const MAX_PREVIEW = 3000;

export function RawPreview({ text, fileName }: { text: string; fileName: string }) {
  const preview = text.length > MAX_PREVIEW ? text.slice(0, MAX_PREVIEW) + '\n...(truncated)' : text;
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs font-medium text-gray-600">{fileName}</span>
        <span className="ml-auto text-xs text-gray-400">{text.split('\n').length} rows</span>
      </div>
      <pre className="max-h-64 overflow-auto p-4 text-xs text-gray-700 whitespace-pre-wrap">{preview}</pre>
    </div>
  );
}
