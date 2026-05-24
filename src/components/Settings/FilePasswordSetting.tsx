import { useState } from 'react';
import { useFilePassword } from '../../hooks/useFilePassword';

export function FilePasswordSetting() {
  const { password, setPassword } = useFilePassword();
  const [value, setValue] = useState(password);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setPassword(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-gray-900">File Password</h2>
      <p className="mb-4 text-sm text-gray-500">
        Used to unlock password-protected PDF and Excel bank statements.
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Enter file password"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleSave}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>
    </div>
  );
}
