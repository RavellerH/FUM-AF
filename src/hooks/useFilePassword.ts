import { useState } from 'react';

const KEY = 'fum_file_password';

export function useFilePassword() {
  const [password, setPasswordState] = useState<string>(() => localStorage.getItem(KEY) ?? '');

  const setPassword = (value: string) => {
    localStorage.setItem(KEY, value);
    setPasswordState(value);
  };

  return { password, setPassword };
}
