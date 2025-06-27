import { useCallback, useEffect, useState } from 'react';

export const useTerm = () => {
  const [term, setTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTerm = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/term');
      if (!response.ok) {
        throw new Error('利用規約の取得に失敗しました');
      }
      const data = await response.json();
      setTerm(data.term);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTerm();
  }, [fetchTerm]);

  return {
    term,
    isLoading,
    error,
  };
};