# Mini League Desk / ミニリーグ運営

[English README](README.md)

Mini League Desk は、小規模な総当たり大会をブラウザで運営するローカル処理ツールです。**「次は誰と誰？」「まだどの試合が残っている？」「今の順位は？」**を大会中にすぐ確認できることを中心にしています。

現在の開発バージョン: **v0.8.0**

## 現在の機能

現在のMini League Deskには以下が入っています。

- 大会設定と3種類の結果記録方式
- 総当たり対戦表
- 結果の登録 / 修正 / 取消 + Undo
- 進行 / 対戦 / 順位
- 参加者別の未実施 / 完了相手
- 全試合完了時の最終順位
- 大会内容の端末内自動保存
- JSONバックアップ / 復元
- スマートフォン向けナビゲーション・狭幅対応
- 対戦結果CSV / 順位CSV
- Canvasで生成する順位表PNG
- 順位と全対戦結果の印刷
- 日本語 / 英語UI
- キーボードで見えるフォーカス表示・ローカライズ済みアクセシブルネーム
- ダイアログのフォーカス復帰・選択状態のARIA表現
- 実行時CDN、API、分析タグ、テレメトリ、外部出力サービスなし

## Accessibility / キーボード操作

v0.8.0では正式リリース前のAccessibility監査を行いました。

- ボタン、input、textarea、select、summaryにキーボードフォーカスを明示
- 対戦フィルターの選択状態を `aria-pressed` でも表現
- 完了済み結果の勝者 / 引き分け選択を `aria-pressed` でも表現
- 進行 / 対戦 / 順位ナビゲーション、進行率、対戦フィルターのアクセシブルネームを日英対応
- 結果 / 出力 / JSONバックアップ / ヘルプのダイアログを閉じた後、可能な範囲で元の操作位置へフォーカス復帰
- 得点入力のエラー表示を両方の得点欄へ関連付け
- 順位一覧へlist / listitemの意味を追加
- forced-colors時の境界線・選択状態を補強
- reduced motion対応を維持

日本語と英語の翻訳キーはリポジトリ検証で一致を確認し、HTMLから参照するi18nキーも両言語に存在することを自動確認します。

## プライバシー

大会名、参加者、対戦、結果、順位、端末内保存データ、JSON / CSV / PNGの生成データはブラウザ内で処理します。このアプリは実行時の外部通信を行わず、`connect-src 'none'` を維持します。

## 出力と保存

大会内容はブラウザ内へ自動保存します。移行・復旧用にJSONバックアップも利用できます。

大会中の **出力** から、対戦結果CSV、順位CSV、順位表PNG、印刷を利用できます。ファイルを保存する機能では保存前に安全なファイル名を編集できます。

## v1.0.0までに残っている作業

次のv0.9.0はリリース候補です。

- より広い回帰ケース
- README / スクリーンショット最終化
- standalone / privacy / network確認
- リリース候補としてのブラウザ / 実機確認

## 単一HTML / オフライン利用

ビルドでは `dist/index.html`、`dist/index.self-extract.html`、リポジトリ直下の `mini-league-desk.html` を生成します。通常版HTMLは `file://` で直接開いて利用できる構成を維持します。

## 対応ブラウザ

主要対象は現行Chrome / Edge。Firefox / Safari / Chrome for Android / Safari on iPhoneも可能な範囲で対応します。

## 開発

変更前に `AGENTS.md`、`APP_SPEC.md`、`docs/ARCHITECTURE.md`、`docs/LLM_WORKFLOW.md` を確認してください。

編集対象は `src/index.template.html` です。

## ビルド

```powershell
.\build-standalone.bat
```

リポジトリ検証:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-powershell-syntax.ps1
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

## ライセンス

MIT。詳細は [LICENSE](LICENSE) と [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。
