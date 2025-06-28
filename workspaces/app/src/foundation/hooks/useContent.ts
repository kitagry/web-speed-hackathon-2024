import { useCallback, useState } from 'react';

type ContentType = 'contact' | 'overview' | 'question' | 'company' | 'term';

export const useContent = (type: ContentType) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchContent = useCallback(async () => {
    if (loaded) return content;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/content/${type}`);
      if (!response.ok) {
        throw new Error(`コンテンツ(${type})の取得に失敗しました`);
      }
      const data = await response.json();
      console.log(`useContent ${type}:`, data);
      setContent(data.content);
      setLoaded(true);
      return data.content;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [type, loaded, content]);

  return {
    content,
    isLoading,
    error,
    fetchContent,
  };
};
