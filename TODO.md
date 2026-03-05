# TODO

## Phase 1: 環境構築
- [x] NotebookLMのDOM構造を開発者ツールで調査し、チャット出力のセレクタを特定する（完了）
- [x] highlight.jsをダウンロードして `lib/` に配置する（対応言語: python, go, javascript, html, css）
  - highlight.js 11.11.1 common bundle (`lib/highlight.min.js`) をcdnjsから取得済み
- [x] アイコン画像を作成または用意する（16px, 48px, 128px）

## Phase 2: 基本実装
- [x] `manifest.json` を作成する（Manifest V3、content_scripts、permissions設定）
- [x] `content.js` を実装する
  - [x] MutationObserverで `.chat-panel-content` のDOM変化を監視
  - [x] 新たに追加された `.message-text-content pre > code` 要素を検出
  - [x] highlight.js の `hljs.highlightAuto()` でシンタックスハイライトを適用
  - [x] debounce処理でストリーミング完了後に適用（500ms）
  - [x] 変換済み要素に `data-highlighted="true"` 属性を付与して重複処理を防止
  - [x] コードブロックに言語名ラベルとコピーボタンを追加するDOM操作
- [x] `content.css` を実装する
  - [x] ダークテーマのコードブロックスタイル（Dracula配色）
  - [x] ライトテーマのコードブロックスタイル（VSCode Light配色）
  - [x] 言語名ラベルのスタイル
  - [x] コピーボタンのスタイル

## Phase 3: Popup UI実装
- [x] `popup/popup.html` を実装する（ON/OFFトグル、テーマ切り替え）
- [x] `popup/popup.js` を実装する
  - [x] chrome.storage.syncで設定を保存・読み込み
  - [x] ON/OFFトグルの状態をcontent.jsに反映
  - [x] テーマ切り替えをcontent.jsに反映
- [x] `popup/popup.css` を実装する

## Phase 4: 動作確認・調整
- [x] Chromeの開発者モードで拡張機能をロードしてテスト
- [x] 各対応言語のシンタックスハイライトが正しく動作するか確認
- [x] ON/OFFトグルが正しく機能するか確認
- [x] ライト/ダークテーマ切り替えが正しく機能するか確認
- [x] ストリーミング出力中の挙動を確認・調整
- [x] NotebookLMのDOMが更新された場合の対応（セレクタの見直し）
