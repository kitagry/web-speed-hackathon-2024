// 文字列正規化用のキャッシュ
const normalizedCache = new Map<string, string>();

// 文字列を正規化する関数
function normalizeString(str: string): string {
  if (normalizedCache.has(str)) {
    return normalizedCache.get(str)!;
  }
  
  // 全角を半角に、カタカナをひらがなに変換し、小文字化
  const normalized = str
    .normalize('NFKC') // Unicode正規化形式のC形式で正規化（全角→半角など）
    .toLowerCase() // 小文字化
    .replace(/[\u30a1-\u30f6]/g, (match) => { // カタカナ→ひらがな
      return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
  
  normalizedCache.set(str, normalized);
  return normalized;
}

type Params = {
  query: string;
  target: string;
};

// ひらがな・カタカナ・半角・全角を区別せずに文字列が含まれているかを調べる
export function isContains({ query, target }: Params): boolean {
  if (query.length === 0) return true;
  if (target.length === 0) return false;
  
  // 文字列を正規化して比較
  const normalizedQuery = normalizeString(query);
  const normalizedTarget = normalizeString(target);
  
  // includesメソッドで比較（最適化済みのJavaScript機能を使用）
  return normalizedTarget.includes(normalizedQuery);
}
