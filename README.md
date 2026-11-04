# Keytouch Visualizer

Vue版「Keycode Finder」をReact + TypeScriptで移植し、透明な線画の手と指ごとのアニメーションを追加した静的キーボード可視化アプリです。入力内容はブラウザ内で処理され、サーバーに送信しません。

- 元のVue版: `/mnt/disk2/VUECLI3/keytester`（参照のみ。変更なし）
- リポジトリ: [SoichiroWada/KeytouchVisualizer](https://github.com/SoichiroWada/KeytouchVisualizer)
- 開発ブランチ: `feature/keyboard-hand-animation`
- [Vue版の調査・移植一覧](docs/vue-migration.md)
- [実装・検証レポート](docs/implementation-report.md)

## 機能

- US 104キー／JIS 109キー。テンキー、左右の修飾キー、日本語固有キーを独立表示
- Vue版の配色、キートップ、基本配置、入力欄、Clear、IME警告、3件の技術リンクを継承
- `keydown` / `keypress` / `keyup` と `inputValue`、`key`、`code`、`keyCode`、`charCode` を表示
- キーごとの緑色発光、柔らかいグロー、沈み込み、同時押し、リピート対応
- 元の最大幅1100pxから1210pxへ110%拡大。狭いデスクトップでは縮小し、モバイルはキーボード部分のみ横スクロール
- 左右10本の指、ホームポジション、関節の曲げとキー中心への移動
- Show Hands、Hand Opacity（初期65%）、Animation Speed（Slow / Normal / Fast）、Glow Effect、Reset Hands
- 配列と表示設定をlocalStorageに保存。旧Vue版の`keyboardLayout`も読み込み
- フォーカス喪失・非表示時の押下リセット、IME入力、`prefers-reduced-motion`対応

## 技術構成

React 19、TypeScript 5.9（strict）、Vite 8、Motion for React、SVG、CSS、Vitest 5、React Testing Library、ESLint 10、Playwright。実際の導入バージョンは`package-lock.json`で固定しています。

Node.js **24.15以上の24系**を推奨します（CIは24系）。22系は22.22.2以上、26系以降も利用可能です。

```bash
npm ci
npm run dev
```

表示されたローカルURL（通常 `http://127.0.0.1:5173`）を開き、`CLICK THIS TEXT BOX`の入力欄でキーを押します。

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

ブラウザテスト（初回のみChromiumが必要）:

```bash
npx playwright install chromium
npm run test:e2e
```

## イベントと指の仕様

Vue版と同様、キーの発光はwindow上の実際の`keydown`/`keyup`を参照し、イベント情報パネルは入力欄を対象にしたイベントだけを表示します。入力欄は初回表示、配列切替、Clear、`pageshow`でフォーカスします。ブラウザ標準の入力やショートカットを妨げません。

`keypress`、`keyCode`、`charCode`は旧版互換の表示です。主要ロジックには`code`を使います。`keypress`を合成せず、次の`keydown`で前回の`keypress`をクリアします。`—`（未発火）、`0`、`""`（空文字）を区別します。IME中は元の二言語警告を表示し、確定した日本語テキストをそのまま扱います。

`src/data/keyboardUS.ts`、`keyboardJP.ts`にはphysical code、ラベル、配列、座標、寸法、担当手指を定義。キートップと手は同じ`viewBox`内にあり、CSS変換後も位置関係を保ちます。指先はその定義から計算したキー中心に向かいます。JIS EnterのみL字内部の押下点を明示します。

手の内部は`fill="none"`。各指の左右輪郭と関節をベジェ曲線で描き、Motionで曲線の制御点を補間します。10本の指は独立して動きます。通常の移動時間は約105ms（Slow 220ms、Fast 45ms）。途中の入力は進行中のアニメーションの位置から追従し、タイマーを積みません。動きを減らす設定では即時に位置が変わります。

担当ルール:

- 通常キーは標準的なタッチタイピング。左手ASDF、右手JKL;、Spaceは右親指
- Shiftは実際に押された側の小指。文字キーと反対側のShiftを使う通常の操作に追従し、左右を推測して入れ替えません
- 左右Ctrl / Metaは同じ側の小指、Altは同じ側の親指、無変換は左親指、変換・かなは右親指
- 記号は近い側の小指等。矢印は右人差し指（左）、中指（上下）、薬指（右）。編集6キーは右小指
- テンキーは右手専用ポーズ。4/5/6を人差し指/中指/薬指の基準にし、0は親指、Enter/+は小指
- Esc、F1〜F12、PrintScreen、ScrollLock、Pause、未知のcodeは担当を推測せず「未割り当て」。受信できたキーは発光します
- 同じ指の複数キー同時押しは最後に押したキーを優先。離すと以前の保持キーへ戻ります。全キーの発光はそれぞれ継続します
- Reset Handsは押下と指を戻し、入力内容とイベント履歴は維持。Clearはそれらも初期化します

## Firebase Hosting

既存の`.firebaserc`で確認したProject IDは **`keytouch-visualizer`**。`firebase.json`は`dist/`を公開し、SPA rewriteを適用します。Firebase App Hostingは使用しません。アプリにFirebase SDKや秘密鍵は不要です。

**本番デプロイとGitHubへのpushは所有者の明示的承認後に実行してください。開発作業では実行していません。**

承認後のローカルデプロイ手順:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx firebase-tools@latest login
npx firebase-tools@latest deploy --only hosting --project keytouch-visualizer
```

`firebase.json`のpredeployでもbuildを行い、古いビルドの公開を防ぎます。

## GitHub Actions

- `ci.yml`: PRおよび主要ブランチへのpushで`npm ci`、ESLint、TypeScript、Vitest、production build。別jobでChromiumのブラウザテストと画面画像を保存
- `firebase-hosting.yml`: 手動`workflow_dispatch`のみ。本番の自動デプロイは無効。既定ブランチ以外からも実行しません

所有者の承認後に、GitHub側で次を設定します:

1. `production` Environmentを作成し、required reviewersによる承認を設定
2. Firebase Hosting公開用サービスアカウントのJSONをEnvironment secret **`FIREBASE_SERVICE_ACCOUNT_KEYTOUCH_VISUALIZER`** に保存。JSON自体をリポジトリに置かない
3. Repository variable **`ENABLE_FIREBASE_PRODUCTION_DEPLOY=true`** を設定
4. 既定ブランチのWorkflowを手動起動し、`confirm_project`へ`keytouch-visualizer`と入力。Environmentの承認を実施

認証の手順は[Firebase公式GitHub連携ドキュメント](https://firebase.google.com/docs/hosting/github-integration)を参照してください。変数未設定時はdeploy jobをスキップします。push／PRで本番公開されるトリガーはありません。

## 制限・今後の拡張

- OSやブラウザが消費するFn、Metaの組み合わせ、PrintScreen等はイベントが届かない場合があります
- JIS/USの切替は表示設定です。OSの物理配列・IME設定は変更しません
- 人体の厳密なIK／3Dモデルではなく、キー対応を優先する2D輪郭アニメーションです。遠い特殊キーでは指の形が伸び、アルファベットとテンキーの同時入力は手の専用ポーズが優先されます
- 同じ指で同時に2キーを押す形状は再現できません
- 手指の担当カスタマイズ、Spaceの左右親指選択、テンキーレス配列、ブラウザ別検証、長時間の性能計測は今後の拡張候補です

元のFirebase初期ページは`docs/reference/firebase-welcome.html`に保存しています。Viteの`public/`から取り除くことでproduction buildへの混入を防いでいます。
