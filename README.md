# NotebookLM Code Highlight

Google NotebookLM のチャット出力に含まれるコードブロックへシンタックスハイライトを適用する Chrome 拡張機能です。

## 機能

- **シンタックスハイライト** — highlight.js による自動言語検出と色付け
- **言語ラベル表示** — コードブロック右上に検出言語名を表示
- **コピーボタン** — コードを1クリックでクリップボードへコピー
- **Mermaid 図表レンダリング** — `classDiagram` を SVG 図として表示
- **ライト / ダークテーマ切り替え** — デフォルトはダーク（Dracula 配色）
- **ON / OFF トグル** — ポップアップから即時切り替え

### 対応言語

Python / Go / JavaScript / HTML / CSS（highlight.js の自動検出による）

## インストール

Chrome Web Store への公開は行っていません。開発者モードでローカルインストールしてください。

1. このリポジトリをクローンまたは ZIP でダウンロードして展開する
2. Chrome のアドレスバーに `chrome://extensions` と入力して開く
3. 右上の「デベロッパーモード」をオンにする
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、展開したフォルダを選択する
5. 拡張機能が一覧に追加されればインストール完了

## 使い方

1. [Google NotebookLM](https://notebooklm.google.com/) を開く
2. AI にコードを含む質問をする（「Python でサンプルコードを書いて」など）
3. AI の回答中のコードブロックに自動でハイライトが適用される

### ポップアップ設定

ツールバーの拡張機能アイコンをクリックするとポップアップが開きます。

| 項目 | 説明 |
|------|------|
| ハイライト | シンタックスハイライトの ON / OFF |
| Mermaid 図表 | `classDiagram` を図としてレンダリングする ON / OFF（ハイライトとは独立） |
| テーマ | Dark（Dracula 配色） / Light（VSCode Light 配色）を選択 |

設定は `chrome.storage.sync` に保存されるため、Chrome を再起動しても引き継がれます。

## 動作の仕組み

- `MutationObserver` で `.chat-panel-content` を監視し、`<pre><code>` 要素の追加を検出
- AI のストリーミング出力中はテキストが更新され続けるため、変化が止まった 500ms 後にハイライト処理を実行（debounce）
- `hljs.highlightAuto()` で言語を自動判定してハイライトを適用
- 処理済み要素には `data-highlighted="true"` を付与して二重処理を防止
- `classDiagram` を含む `<code>` ブロックは Mermaid でレンダリング、失敗時はコードブロック表示にフォールバック

## 技術スタック

| 項目 | 内容 |
|------|------|
| Manifest | V3 |
| シンタックスハイライト | [highlight.js](https://highlightjs.org/) 11.11.1（バンドル済み） |
| Mermaid レンダリング | [mermaid.js](https://mermaid.js.org/) 10.9.1（バンドル済み） |
| フォント | JetBrains Mono（Regular / Medium） |
| 設定永続化 | `chrome.storage.sync` |

## ディレクトリ構成

```
notebooklm-code-highlight/
├── manifest.json
├── content.js          # DOM 監視・コードブロック検出・変換・Mermaid レンダリング
├── content.css         # コードブロック・Mermaid コンテナのスタイル
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── lib/
│   ├── highlight.min.js
│   └── mermaid.min.js
├── fonts/
│   ├── JetBrainsMono-Regular.ttf
│   └── JetBrainsMono-Medium.ttf
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 注意事項

- NotebookLM の DOM 構造が変更された場合、セレクタの更新が必要になることがあります
- 本拡張機能は `https://notebooklm.google.com/*` のみで動作します
