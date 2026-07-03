import { useDropzone } from 'react-dropzone';

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled,
    onDropAccepted: ([file]) => onFile(file),
  });

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
        isDragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-slate-100'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <input {...getInputProps()} />
      <svg className="mb-3 h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm font-medium text-slate-700">
        {isDragActive ? 'Drop the file here' : 'Drag & drop a bank statement'}
      </p>
      <p className="mt-1 text-xs text-slate-400">or click to browse — .pdf (Mandiri), .csv, .xls, .xlsx</p>
    </div>
  );
}
