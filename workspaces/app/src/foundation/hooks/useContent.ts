import { useCallback, useEffect, useState } from 'react';

type ContentType = 'contact' | 'overview' | 'question' | 'company' | 'term';

export const useContent = (type: ContentType) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/content/${type}`);
      if (!response.ok) {
        throw new Error(`コンテンツ(${type})の取得に失敗しました`);
      }
      const data = await response.json();
      setContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    content,
    isLoading,
    error,
  };
};
