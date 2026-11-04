# Vue版調査・移植一覧

参照元: `/mnt/disk2/VUECLI3/keytester`。`package.json`、`src/App.vue`、`src/components/{keyTester,EnglishKeyboard,JapaneseKeyboard}.vue`、`tests/{keyTester,JapaneseKeyboard}.test.js`を参照。Vue版は変更せず、ソースは読み取り専用で使用。

Vue版はVue 3 + Viteで構成され、配列は各Keyboardコンポーネント内のデータ生成関数で定義されていた。React側はFirebase初期ページと初期設定のみ。開始時ブランチmaster、remoteは`https://github.com/SoichiroWada/KeytouchVisualizer.git`、既存の`firebase-debug.log`削除と初期設定・skills等の未追跡ファイルを確認し、その状態を保護した。

| 調査したVue機能 | React版の対応 |
| --- | --- |
| 日本語109キー／英語104キー | 元の生成データをTypeScriptへ移植、キーごとに独立したSVG要素 |
| 日本語・英語ラジオボタン | 同じ表示文言と選択状態、localStorage保存 |
| 旧`keyboardLayout`保存 | 互換読み込み・書き込み |
| テキスト入力、CLICK THIS TEXT BOX | controlled input、同じplaceholder |
| 入力欄の白いフォーカス表示、初回・pageshowフォーカス | CSS focusとReact refで移植 |
| 配列切替後の入力欄フォーカス | 維持。保持キーは安全に初期化 |
| Clearで入力・全イベント・警告を初期化、入力欄へフォーカス | 移植。手・保持状態と遅延keyupも初期化 |
| keydown / keypress / keyup | 独立セクション。入力欄に届いたnativeイベントを収集 |
| event.key / keyCode / charCode / code | 4値すべて維持。0、空文字、未発火を明示 |
| inputValue表示 | 入力欄の確定値に同期 |
| IME keyCode 229の二言語警告 | 元の文言を継承、compositionイベントとisComposingでも処理 |
| global keydown/keyupで発光 | window listenerを移植、physical codeで左右・テンキーを区別 |
| 同時押し・リピート | Setによる独立管理、同じコードのrepeatで状態を重複させない |
| window blur / visibilitychangeで解除 | 維持。入力欄のblur時にも解除 |
| unmount時のイベント解除 | Hook cleanupで全listenerを解除 |
| 機能／編集／矢印／テンキー | 全キーを継承。縦長+とEnter、横長0、Space等の比率も継承 |
| OS固有キーの注意書き | 「FnキーやPrintScreenなど、OSが受け取るキーは反応しない場合があります。」を継承 |
| 技術情報リンク3件 | 原文URLを完全に継承、rel=noopener noreferrer追加 |

## 配色

| 要素 | Vue版から採用した色 |
| --- | --- |
| ページ背景 | `#232323` |
| タイトル | `#7ca7df` |
| キーボードケース | `#111820`、線`#465467` |
| キートップ | `#303b49`、線`#607086` |
| キー文字 | `#edf2fa` |
| 押下 | `#57e6a0`、線`#b8ffdb`、文字`#062819` |
| 情報パネル | `#19212c`、線`#3d4d61` |
| 入力欄（非フォーカス） | `#021128` |
| 通常説明 | `#b8c5d5` |

## 意図的な差分

- 最大幅1100pxから1210pxへ拡大。キーボード本体の高さもSVG比率で110%となる。手首用の透明領域を下に追加
- 元の日本語Enterのpolygonは`628,64 … 669,164`で、Backspaceと重なり、ホーム行に届かなかった。上端を116、下端を216に修正し、L字内部にラベルと指の押下点を配置
- 英語Backslashの元のラベルは上下ともバックスラッシュだった。USのShift時の縦棒を表示するよう修正
- 旧版ではkeypressが発火しないキーでも前の文字のkeypress表示が残った。React版では次のkeydownで未発火に戻し、合成イベントを表示しない
- 元の入力欄非フォーカス時の文字色`#777`は暗い背景で読みにくいため、パネルと同系の`#b8c5d5`へ。フォーカス時は元と同じ白背景
- 元のレイアウト上部のIME警告は入力欄付近に維持し、下部には元のOS注意書きと技術リンクを配置
- パネルの4値を常にラベル付きで表示し、`—`で未発火を明示。手指割当を下部に追加
- 元の情報パネルの17px等幅文字を15pxへ調整し、手指情報と待機状態を同じ幅内に収めた
- 新しい設定パネルはキーボード下部に配置。画面幅1150px以下でイベントパネルを下へ移動

## リンク

- https://www.w3.org/2002/09/tests/keys.html
- https://www.w3.org/TR/uievents-code/
- https://javascript.info/keyboard-events

移植データは`src/test/fixtures/vue-keyboards.json`に参照元のSHA-256付きで保持し、CIからVueディレクトリへ依存せず全キーの寸法・ラベル・座標を比較する。
