import { useContent } from './useContent';

export const useTerm = () => {
  const { content, isLoading, error } = useContent('term');
  
  return {
    term: content,
    isLoading,
    error,
  };
};