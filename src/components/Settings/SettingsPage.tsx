import { CategoryManager } from './CategoryManager';
import { ReParseButton } from './ReParseButton';

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Settings</h1>
      <div className="flex flex-col gap-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <CategoryManager />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ReParseButton />
        </div>
      </div>
    </div>
  );
}
