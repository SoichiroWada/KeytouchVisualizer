# 実装・検証レポート

実施日: 2026年11月4日（日本時間）

## 1. Vue版から継承した機能

US 104キー／JIS 109キー、キー寸法とかな・記号、テンキー、左右修飾キー、ラジオによる配列切替、入力欄、Clear、inputValue、keydown / keypress / keyup各4プロパティ、複数キー同時押し、緑色ハイライト、リピート、window blur / visibilitychange解除、IME二言語警告、初回・pageshow・配列切替・Clear時のフォーカス、localStorage配列保存、注意書き、技術リンク3件を継承しました。

詳細は[Vue調査・移植表](vue-migration.md)。元のVueソースは変更していません。比較用の全キー定義と参照ファイルのSHA-256をfixtureに保存し、今後のCIでも元の配列からの逸脱を確認できます。

## 2. 新規機能

- 元の最大表示幅1100pxに対し1210px。SVGの比率によりキーの高さ、文字、隙間も110%拡大
- 透明な左右の線画、10本の指と掌・手首、ホームポジション、個別の指先移動と関節補間
- 担当手／指の表示。独立した同時押し、同じ指の競合解決、テンキー専用ポーズ
- 押下時の沈み込みと柔らかなグロー
- 表示、輪郭不透明度、速度、グロー設定、Reset HandsとlocalStorage永続化
- Clear後のSpace/Enterの遅延keyup抑制、input blur時の押下解除
- reduced-motion対応、設定ストレージ破損／利用不可時のフォールバック
- PR CI、ブラウザ検証、手動かつ初期無効のFirebase本番公開Workflow

## 3. Vue版との外観・機能差分

ページ、ケース、キー、押下、タイトル、パネルの主要色は元のCSSの値を使用。上部操作・左キーボード・右情報・下部の注意書きとリンクという構成を保っています。

JIS Enterの元の座標はBackspaceと重なっていたため、L字の位置を修正しました。US BackslashのShift表示を縦棒に修正しました。前の文字のkeypressを次のキーの結果と誤認しないよう、新しいkeydownごとにkeypressを未発火に戻します。空文字と未発火は別表示です。パネル文字サイズ、レスポンシブの切替幅、非フォーカスの入力文字色は読みやすさのため調整しました。

## 4. 追加・変更ファイル

| ファイル／ディレクトリ | 内容 |
| --- | --- |
| `src/App.tsx`, `src/App.css`, `src/main.tsx` | 画面統合、既存配色、レスポンシブ |
| `src/components/Keyboard/{Keyboard,KeyboardKey}.tsx`, `Keyboard.css` | 独立したキートップ、押下状態、SVGステージ |
| `src/components/Hands/{HandsOverlay,Finger}.tsx`, `Hands.css` | 透明な線画の手、10本の指 |
| `src/components/{AnimationControls,EventInfo,InputBox,LanguageSelector}/*.tsx` | 設定、イベント表示、入力、配列切替 |
| `src/data/{keyboardUS,keyboardJP,fingerMapping,keyboardGeometry}.ts` | 全キー定義と担当手指、共有座標 |
| `src/hooks/{useKeyboardEvents,useSettings}.ts` | nativeイベント、解除処理、設定保存 |
| `src/utils/handGeometry.ts`, `src/types/keyboard.ts` | 手の形状と担当解決、strictな型 |
| `src/App.test.tsx`, `src/data/keyboard.test.ts` | 機能・配列・割当・座標検証 |
| `src/test/{setup.ts,fixtures/vue-keyboards.json}` | テスト設定、元Vue全キーの比較fixture |
| `tests/browser/keyboard.spec.ts`, `playwright.config.ts` | 実ブラウザ・5解像度・高速入力検証 |
| `package.json`, `package-lock.json`, `.nvmrc` | 依存固定、コマンド、Node.js 24 |
| `tsconfig*.json`, `vite.config.ts`, `eslint.config.js` | TypeScript strict、Vite、Vitest、ESLint |
| `index.html`, `public/favicon.svg` | アプリ起点、favicon |
| `firebase.json`, `.gitignore` | 公開対象をdistに変更、ビルド等の除外 |
| `.github/workflows/{ci,firebase-hosting}.yml` | 品質チェック、承認後の手動公開 |
| `README.md`, `docs/*.md`, `docs/screenshots/*.png` | 実行・公開手順、調査・検証結果、実画面 |
| `docs/reference/firebase-welcome.html` | 元の`public/index.html`を内容保持で移動。ビルドへの混入防止 |

既存の`.firebaserc`はそのまま使用しました。作業前から存在した`firebase-debug.log`の削除状態、skills等の未追跡ファイルを保護しました。

## 5. アニメーション技術

[Motion for ReactのSVGアニメーション](https://motion.dev/docs/react-svg-animation)とCSSを採用。指の輪郭・関節を同じ構造のベジェ曲線で生成し、Motionで`d`の数値を補間します。移動時間はNormal 105ms、Slow 220ms、Fast 45ms。OSの動きを減らす設定では補間を行いません。キー表面はCSSの色・沈み込み・drop-shadowで反応します。

## 6. 手指の制御方法

左右それぞれ5本のFingerコンポーネントを独立制御。輪郭と関節以外は描画せず`fill="none"`です。人差し指～小指はそれぞれホームキーの中心、親指はSpaceの左右付近に配置します。掌は指の根元、指の間、親指、手首へ接続する輪郭線で構成します。

pressed Setの順序から各担当指の最後の保持キーを選びます。リピートでSetを重複させず、同じ指の複数入力を解除すると直前の保持キーに戻します。テンキー使用時は右手をテンキー用ポーズに切り替えます。

## 7. キー座標との同期

キーボードと手は単一のSVG `viewBox="0 0 1000 400"`内に描画。ケースは1000×330、残りは透明な手首領域です。座標は`keyCenter()`を共有し、JIS EnterのみL字内部に押下点を指定します。手を非表示にするとviewBoxの高さを330に戻します。

画面幅や横スクロールでキートップと手が同じ変換を受けます。ブラウザテストではSVGの画面変換行列で指先の座標を実ピクセルへ変換し、KeyFの中心との差が0.1px未満であることを全5サイズで確認しています。

## 8. 検証結果

| 検証 | 結果 |
| --- | --- |
| `npm ci`（取得済みキャッシュからのclean install） | 成功 |
| `npm run lint` | 成功 |
| `npm run typecheck` | 成功 |
| `npm test` | **36件成功** |
| `npm run test:e2e` | **Chromium 10件成功** |
| `npm run build` | 成功、`dist/`生成 |
| production preview | HTTP 200を確認 |
| `npm audit --omit=dev`（オンライン） | 実行時依存の脆弱性 **0件** |
| `npm audit`（オンライン、開発依存を含む） | moderate 12件、high / critical 0件。ESLint周辺のminimatchの問題に由来 |

Vitestは指示書の20項目に加え、元Vue全キーの比較、同一指の競合、未知キー、保存値破損、ストレージ拒否、listener解除、pageshow、IME、Clearの遅延keyupを検証します。実ブラウザはnativeイベント、実際のSVG path変化、左右Shiftと同時押し、設定再読み込み、reduced-motion、連続288文字と30回のキーリピート後の残留なしを確認します。

解像度: **1920×1080 / 1600×900 / 1440×900 / 1366×768 / 390×844**。ページ全体の横はみ出しがなく、狭い画面ではキーボード領域だけが横スクロールします。1920幅でキーボード表示幅1210pxを確認しました。

画面画像: [JISデスクトップ](screenshots/jis-desktop.png)、[タイピング中](screenshots/typing.png)、[US](screenshots/us-desktop.png)、[モバイル・横スクロール後](screenshots/mobile.png)。

## 9. 制限・残る確認

- 2Dのベジェ輪郭です。厳密な人体IK、3D、同じ指で同時に2キーを押す姿勢は実装していません。遠い特殊キーでは輪郭が伸びます
- テンキーとアルファベットを同時に保持すると右手のテンキーポーズを優先します
- Esc、F1～F12、PrintScreen、ScrollLock、Pause等に担当指を推測して割り当てません。受信できたキーは発光します
- Shiftは押された物理的な側を反映します。実際と異なる側へ自動的に指を切り替えません
- OSが消費するキー、実機IME、ブラウザやOSによるイベント差異は完全には再現できません。compositionイベントと互換警告は自動検証しました
- Chromiumで検証しました。Firefox / Safariの実機確認、長時間のメモリ／60fpsの定量測定は未実施です
- 開発依存にはminimatchに由来するmoderateの監査指摘が残ります。現行安定版のlint関連パッケージへ更新済み。互換性を崩す強制downgrade／overrideは行っていません。公開バンドルの実行時依存には含まれません
- GitHub上のCI実行とFirebase上の公開確認は、push・デプロイ承認後に行います

## 10. GitHub反映状況

ローカルブランチ`feature/keyboard-hand-animation`を作成。変更は作業ツリーに保持しています。commit / push / PR作成は行っていません。既存履歴と開始時の変更を維持しました。CIファイルは準備済みですが、GitHubへ送信していないためリモートのCI実行結果はありません。

## 11. Firebase Hostingへの公開手順

既存`.firebaserc`からProject ID **`keytouch-visualizer`** を確認しました。`firebase.json`の公開先は`dist/`、SPA rewriteは`/index.html`、predeployでproduction buildを実行します。Firebase App Hostingは使用しません。

本番公開は実施していません。所有者の明示的承認後に、READMEのコマンドで`npx firebase-tools@latest deploy --only hosting --project keytouch-visualizer`を実行できます。

GitHub経由では、所有者承認後に`production` Environmentのrequired reviewers、Environment secret、Repository variableを設定し、既定ブランチの手動Workflowを起動します。push／PRに連動する本番公開トリガーはありません。認証情報はリポジトリへ保存していません。詳細は[READMEのFirebase・GitHub Actions手順](../README.md#firebase-hosting)に記載しています。
