# NotebookLM Code Highlight - Chrome Extension

## プロジェクト概要

Google NotebookLMのチャット欄に出力されたコードブロック（マークダウン形式）を検出し、シンタックスハイライトや見やすいスタイルに変換するChrome拡張機能。

## 背景・課題

- NotebookLMはAIの回答中のコードを `<pre><code>` タグとしてHTMLレンダリングするが、シンタックスハイライトや言語ラベルがなく見づらい
- `<code>` タグに言語クラス（`language-python` 等）が付与されないため、ハイライトライブラリの自動適用ができない状態
- ユーザーがNotebookLMに「マークダウン形式で出力する」よう指示することで、コードが `<pre><code>` ブロックとして出力される

## 仕様

### 対応言語
- Python
- Go
- JavaScript
- HTML
- CSS

### 表示改善内容
- シンタックスハイライト（言語別に色付け）
- 等幅フォントへの変更
- コードブロックの背景色変更
- Obsidianのマークダウンレンダリングに近いスタイル

### 機能
- ON/OFF トグル（拡張機能を有効/無効）
- Mermaid図表トグル（classDiagramを図としてレンダリング、独立してON/OFF可能）
- ライト/ダークテーマ切り替え
- 設定画面（Popup UI）

### 検出・変換タイミング
- MutationObserverを使用してDOMの変化を監視（監視対象: `.chat-panel-content`）
- `<pre><code>` 要素が追加されたことを検出してハイライト処理を実行
- ストリーミング中は `<code>` 要素の内容が更新され続けるため、テキスト変化が止まったタイミング（debounce）で処理

### 配布形態
- ローカルインストールのみ（Chromeの開発者モード）
- Chrome Web Store公開は対象外

## 技術スタック

- **Manifest**: Manifest V3
- **コンテンツスクリプト**: content.js / content.css
- **シンタックスハイライトライブラリ**: highlight.js 11.11.1（CDNではなくバンドル）
- **Mermaidレンダリングライブラリ**: mermaid.js 10.9.1（CDNではなくバンドル）
- **Popup**: popup.html / popup.js / popup.css
- **設定の永続化**: chrome.storage.sync

## ディレクトリ構成

```
notebooklm-code-highlight/
├── CLAUDE.md
├── manifest.json
├── content.js          # DOMの監視・コードブロックの検出・変換・Mermaidレンダリング
├── content.css         # コードブロック・Mermaidコンテナのスタイル
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── lib/
│   ├── highlight.min.js  # highlight.js 11.11.1のバンドル
│   └── mermaid.min.js    # mermaid.js 10.9.1のバンドル
├── fonts/
│   ├── JetBrainsMono-Regular.ttf
│   └── JetBrainsMono-Medium.ttf
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## NotebookLMのDOM構造（調査済み）

- 対象URL: `https://notebooklm.google.com/*`

### 重要な発見
NotebookLMは、AIの回答中のコードブロックをすでに `<pre><code>` HTMLとしてレンダリングしている。
つまり**マークダウンテキストを自前でパースする必要はなく、既存の `<pre><code>` 要素にhighlight.jsを適用するだけでよい**。

### 主要セレクタ
| 役割 | セレクタ |
|------|---------|
| チャット全体エリア | `.chat-panel-content` |
| AIメッセージのカード | `div.to-user-container` |
| AIメッセージのテキスト領域 | `.to-user-message-card-content .message-text-content` |
| コードブロック（対象） | `.message-text-content pre > code` |
| インラインコード | `.message-text-content code.code` |
| 各メッセージペア | `div.chat-message-pair` |
| ユーザーメッセージ | `div.from-user-container` |

### DOM構造の詳細
```
div.chat-message-pair
  └── chat-message (AI回答)
        └── div.to-user-container
              └── mat-card.to-user-message-card-content
                    └── div.message-text-content
                          └── element-list-renderer
                                └── labs-tailwind-structural-element-view-v2
                                      └── pre.ng-star-inserted   ← コードブロック
                                            └── code             ← ここにhighlight.js適用
```

### 注意点
- `<code>` タグには言語クラスが付与されていない → highlight.jsの**自動言語検出**（`hljs.highlightAuto()`）を使用
- Angularのカスタム要素（`labs-tailwind-structural-element-view-v2` 等）を使用しているが、Shadow DOMではなく通常DOM

## Mermaid仕様

- 検出: `<code>` の textContent が `/^\s*classDiagram\b/` にマッチする場合
- classDiagramのみ対応（他の図種は今後の拡張予定）
- 元の `<pre>` を非表示にし、直前に `.mermaid-container` div を挿入してSVGを描画
- `mermaid.render(id, text)` はasync/awaitで呼び出す（mermaid v10+ API）
- 描画失敗時は `<pre>` をそのまま表示（コードブロックにフォールバック）
- テーマ変更時は既存の全Mermaidダイアグラムを再レンダリング
- MermaidトグルをOFFにすると `.mermaid-container` を削除し、hljs再適用

## デザイン方針

- デフォルトはダークテーマ（Obsidian風）
- ライトテーマも用意
- コードブロックに言語名ラベルを表示
- コピーボタンをコードブロック右上に配置

---

タスク一覧は [TODO.md](./TODO.md) を参照。
