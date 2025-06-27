@README.md を読み込んで

# 何から手をつけるか？

- フロントエンドの知識はない人がほとんどだと思うので、公式の動画を元に以下に改善することを挙げていきます。
- ネットの記事を読んでAIで改善してもおそらく終わらないので、積極的にネットのネタバレを見ていき、 AIを活用して改善していきましょう。
  - 公式でも解説しなかった改善が存在しそう
- Dev Toolsの「ネットワーク」タブを開いて眺めることが最初の基本的な改善方法になります

## Good First Issue（ログインが非常に重い）

ログイン機能が非常に重いです。これは正規表現が重いからという噂です。改善しましょう。
（workspaces/admin/src/pages/AuthPage/internal/LoginContent.tsx)

## Good Second Issue（配信画像の改善）

詳細ページの漫画画像などはJPEG XLという形式でソースに含まれています。（workspaces/server/seeds/images）
しかし、ChromeではJPEG XLがサポートされていないため、そのまま配信しても画像が表示されません。

この問題を解決するために、このサイトではwasmを用いてJPEG XLをBMPに変換して配信しています。この機能は明らかに改善の余地があるため、解決しましょう。
（workspaces/client/src/serviceworker/index.ts）

## AIなんとかしてくれ

CLAUDE.mdを用意しておいたので適宜利用してください。（改善されていない部分も含めて記載されています）

Claude CodeにPlaywright MCPを入れて、どうにかしてもらいます。
```
claude mcp add playwright -- npx @playwright/mcp@latest
```

```
http://localhost:8000/ に非常に重いサイトがデプロイされています。これはWeb Speed HackathonというLighthouseスコアを改善することを目的にしたハッカソンのプロダクトで、テストは workspaces/testing/playwright.config.tsにあります。playwrightのMCPも使いながら、改善できる部分を探して改善してください。
```

もしくはスコアリングツールから逆算できなくもないかもしれません

```
http://localhost:8000/ に非常に重いサイトがデプロイされています。これはWeb Speed HackathonというLighthouseスコアを改善することを目的にしたハッカソンのプロダクトで、スコアリングツールは /[ローカル環境のパス]/web-speed-hackathon-2024-scoring-tool/src/local.mts にあります。playwrightのMCPも使いながら、改善できる部分を探して改善してください。
```

## 作者のおちゃらけコメントを探す

例えば、workspaces/app/src/features/viewer/components/ComicViewerCore.tsx には以下のようなコメントがある。
```typescript
// 世界は我々の想像する以上に変化するため、2 ** 12 回繰り返し観測する
```
なので、おそらくここは修正箇所と思われる。

他にも言っていることが本当に正しいのか？という部分があったりする。

![img_2.png](../img/img_2_.png)

メタ的であるが、`// `で始まるコメントを探して、「コメントを検証し、それがスコアを落とす原因になっていると推測される場合は修正してください」というのが、AIを使った改善方法になるかもしれない。

## YouTubeの解説動画を見ましょう

公式の解説が存在するため、これを見ながら改善しましょう。
https://www.youtube.com/watch?v=RwQC8eQzeyI
2時間で全ては改善できないが、AIでスピードを出せば、ある程度の改善はできるはず。
以下に改善点を挙げていきます。簡単な改修はぼかした解説になってます。

### キャッシュしたい

画像がno-storeになっていて、意図的にキャッシュされていないため、修正したい。
(workspaces/server/src/middlewares/cacheControlMiddleware.ts)

### Webフォントって重いよね

Webフォントって重い原因なのでなんとかしたい。消し去ってもいいかもしれない。

### useImage

workspaces/app/src/foundation/hooks/useImage.ts ではcanvasを使って画像を加工しているが、おそらくこんなことをしなくてもいい。

### 画像リサイズサーバー

クエリパラメータで指定されたサイズに画像をリサイズする機能が用意されているが、この実装よりも元々用意しておいて静的に返す方がもちろん早そう（workspaces/server/src/routes/image/index.ts）

### 利用規約が長すぎる

画面の利用規約が長すぎて、1MBを超えている。これをバンドルして配信すると非常に重いので、例えばバックエンドからAPIで取得するとかできないのか？

### スクロールスナップ

workspaces/app/src/features/viewer/components/ComicViewerCore.tsx では、スクロールをJavascriptで制御しているが、CSSのscroll-snapを使うことで、より軽量に実装できる。

### 検索画面

検索画面で1文字打つごとに検索がされている気がする。どうにかしたい。（workspaces/app/src/pages/SearchPage/index.tsx）

### Viteに置き換える

バンドラーにtsupというものを使っていますが、これは非常に遅いです。Viteに置き換えましょう。

### SSRのためのサーバー処理を確認

workspaces/server/src/routes/ssr/index.tsx ではSSRのための処理が書かれている。しかしこれは不完全なSSRになっているっぽい。

### decryptがcanvasで全ページ分行われている

workspaces/app/src/features/viewer/components/ComicViewerPage.tsx を対象に、decryptがcanvasで全ページ分行われている。これを画面内のページのみdecrypt対象にするように変更したい。

### 文字列の比較

workspaces/app/src/lib/filter/isContains.ts の文字列比較処理は効率化できそう。

# Web Speed Hackathon 2024

## 舞台設定

「Cyber TOON」と名付けられた架空の漫画閲覧サイトをチューニングします。このアプリケーションは、TypeScript、React、Node.jsで構築されており、意図的に「非常に重たい」状態、すなわちパフォーマンスが極端に悪い状態で提供されています。この技術的負債を抱えたサイトを高速化することが目標となります。

## 公式ルール
- 0.1vCPU / 512MB のサーバーを 1 つ使用
  - 今回の設定も公式ルールに則ってます
- Chrome最新版での E2E テストと VRT をクリアすること
  - 見た目や機能を維持する必要があります。例えばブランクページを表示することで数値的なパフォーマンスを改善する、のようなハックは封じられています。
- 漫画ビューアーの画像に難読化を施すこと
  - 今回はこれは無視します

# 計測するもの

チューニングで改善すべき数値は[Lighthouse v10](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring?hl=ja#lighthouse-10)のスコアを基準にしています。

特に、以下のCore Web Vitalsを中心とした指標を「良好」な状態にすることが目標となります。

| 指標 | 日本語名 | 説明 | 目標値          |
| :--- | :--- | :--- |:-------------|
| **FCP** | 初期コンテンツ表示 | ページが最初に何らかのDOMコンテンツを描画するまでの時間 。 | 1.8秒以内       |
| **LCP** | 最大コンテンツ表示 | 最も大きな画像またはテキストブロックを描画するまでの時間 。 | 2.5秒以内       |
| **INP** | 次の描画とのインタラクション | ページ上の全てのユーザーインタラクションに対する遅延 。 | 200ミリ秒未満     |
| **TBT** | 合計ブロッキング時間 | メインスレッドがブロックされ、ユーザー入力を妨げていた合計時間 。 | 200ミリ秒未満  |
| **CLS** | 累積レイアウトシフト | 視覚的な安定性。予期しないレイアウトのズレを測定します 。 | 0.1未満     |
| **SI** | スピードインデックス | ページのコンテンツがどれだけ速く視覚的に表示されるか 。 | 3.4秒以内    |

# Cyber TOONの主な機能

「Cyber TOON」は、ユーザーが漫画を閲覧するための基本的な機能を備えています。最適化の対象となる主要な機能は以下のページです。

- **トップページ**
  - 特集（ピックアップ）作品、ランキング、本日の更新作品などが表示される、サイトの入り口となるページです。

- **エピソード一覧ページ**
  - 特定の漫画作品を選択した際に、その作品の各エピソード（話数）が一覧で表示されるページです。

- **漫画ビューワー**
  - 選択したエピソードの漫画を実際に閲覧するためのページです。

- **ログイン機能**
  - ユーザーがログインするための機能も提供されています。初期状態では、この機能に関連する正規表現に脆弱性が存在しています。

- **管理画面**
  - サイト運営者向けに、作者の詳細情報を確認したり、作品のエピソードを追加したりする機能が含まれています。

# 初期改善

- 初期状態から始めると2時間ではとても終わらない（&よくわからないまま終わる）ため、以下の対応を実施済みです
- 基本的に「悪意をもって重くしている」状態を改善するという傾向が強いです。

## ビルドコンフィグの最適化

- tsupと呼ばれるビルドツールが使用されていますが、凶悪な設定にされているので、最適化します
  - https://github.com/inakam/web-speed-hackathon-2024/commit/9922fb0dc94a84d938f5fbaa6c4585ef8a4d3821

## バンドルサイズの改善

- 今回のフロントエンドでは、ユーザー環境に必要なデータが1つのjsになって全て配信されるので、配信されるデータを少なくすることが重要です。
  - 不要なライブラリや情報は使わないようにした方がよい
- bundle analyzerというものを使い、可視化して、不要なものを削除する、という手順を取ります。
  - 不要なパッケージを削除（パッケージを削除するために処理を修正することもある）
    - https://github.com/inakam/web-speed-hackathon-2024/commit/bc53007f324d2a734a5f7182e8ced4f18aaff824
  - 静的画像でいい部分は静的に配信する
    - https://github.com/inakam/web-speed-hackathon-2024/commit/1f35fde349cdc8f812cdd7ec05d095f1eaac6716

## fetchの最適化

- F12でdevツールを開き、ネットワークタブを開くと、610回リクエストが実行されています
  ![img.png](../img/img_.png)
  - こんなにリクエストを実行する必要がないように、1度フェッチした情報を再利用するようにする
  - https://github.com/inakam/web-speed-hackathon-2024/commit/9dc4ca70f6c9555ae2fdf393f69492fa5e2eadd4
  - これでfetch回数が1/3程度に減り、描画も半分ぐらいの時間(30秒)で終わるようになります
  - 作品詳細ページも同じように修正します
    - https://github.com/inakam/web-speed-hackathon-2024/commit/953b1474a9b0d35fef620d0fa18dc15eef378364

## 画像のpreloadをしない

- ネットワークタブを眺めていると、最初に延々と画像がロードされている
  ![img_1.png](../img/img_1_.png)
  - 画像をpreloadしており、これがレンダリングを阻害している（これが終わるまで画面がでない）
  - レンダリングが阻害されないように、画像のpreloadをやめる
  - https://github.com/inakam/web-speed-hackathon-2024/commit/9df948eaa8361e0565a5bdefa961b2700005d4ad

## 画像の圧縮はクライアント側で実行

- 画像の圧縮はサーバー側で実行されているが、これをクライアント側で実行するように変更
  - これにより、サーバーの負荷を軽減し、クライアント側での処理を最適化
  -https://github.com/inakam/web-speed-hackathon-2024/commit/cbcfa2b36040e546c7fccf2ca885728505af85ae


## 遅延を削除

- もっともらしい理由で入っている遅延を削除します
  - https://github.com/inakam/web-speed-hackathon-2024/commit/9f96080a7133990a31351b840f89bba1f3a3814e

## SVG画像の不要な部分の削除

- 大会用にSVG画像に不要な部分が大量に含まれており重くなっているので、不要な部分を削除します
  - https://github.com/inakam/web-speed-hackathon-2024/commit/8ec153a80b2e658957124715a118c46e6af0c9ea

## クライアントとサーバーのバンドルを分離

- クライアントとサーバーのバンドルが1つになっており、クライアント側に不要なサーバー側のコードが含まれているため、分離します
  - これにより、クライアント側のバンドルサイズを削減し、パフォーマンスを向上させます
    - おそらく最初は分離されており、大会向けに1つにまとめられたものと思われるため、これもあまり本質的な改善ではない
  - https://github.com/inakam/web-speed-hackathon-2024/commit/92a90d0c224447fbbdf64cf4101ac52fb88b5f71

## 作品編集ができないバグ修正

- 作品編集ができないバグが存在していたため、修正します
  - GitHub Actionsでテストが回るときに、この項目だけ常に「計測できません」になるため、修正しておきます
  - 大会だと2日間あるので気付きますが、今回の短時間だとそもそも気づかない可能性が高いため
  - https://github.com/inakam/web-speed-hackathon-2024/commit/8d8c5eaf112762ab824720a14e2fc38e1b5cb322

ここまで実施すると、「まぁ遅いけど、使えなくはない」というサイトになるので、ここからチューニングしていきましょう。
