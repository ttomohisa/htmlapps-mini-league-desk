# Mini League Desk / ミニリーグ運営

[English README](README.md)

Mini League Desk は、小規模な総当たり大会をブラウザで運営するローカル処理ツールです。**「次は誰と誰？」「まだどの試合が残っている？」「今の順位は？」**を大会中にすぐ確認できることを中心にしています。

現在の開発バージョン: **v0.7.0**

## 現在の機能

v0.7.0では、League Deskにローカル出力機能を追加しました。

- 大会設定と3種類の結果記録方式
- 総当たり対戦表
- 結果の登録 / 修正 / 取消 + Undo
- 進行 / 対戦 / 順位
- 参加者別の未実施 / 完了相手
- 大会内容の端末内自動保存
- JSONバックアップ / 復元
- スマートフォン向けの進行・結果入力UI
- **対戦結果CSV**
- **順位CSV**
- **順位表PNG**
- **順位＋全対戦結果の印刷**
- ファイル保存前に編集できる安全なファイル名
- 日本語 / 英語UI
- 実行時CDN、API、分析タグ、テレメトリ、外部出力サービスなし

## 出力

大会中、または全試合完了後の **出力** から利用できます。

### 対戦結果CSV

全試合を生成順で保存します。巡、試合順、参加者、未実施/完了、得点、結果、勝者を含みます。

UTF-8 BOM付きで保存します。参加者名などが表計算ソフトの数式として解釈されやすい文字から始まる場合は、CSVへ書き出す前に保護します。

### 順位CSV

画面と同じ順位計算結果を保存します。記録方式に応じて列を変え、得点方式では得点・失点・得失点差も含めます。

### 順位表PNG

ブラウザのCanvasだけで1200px幅の共有向け画像を生成します。大会名、記録方式、順位、参加者、成績、勝点を含み、得点方式では得失点差も表示します。

### 印刷

順位表と全巡の対戦結果を印刷専用シートへまとめます。通常のヘッダー、ボタン、ダイアログ、スマホ下部ナビゲーションは印刷しません。

## ファイル名

出力ダイアログでは大会名と日付からファイル名を提案します。保存前に編集できます。ファイル名として使いにくい文字はローカルで安全な文字へ置き換え、出力形式ごとの末尾と拡張子を自動で付けます。

## 保存とプライバシー

大会内容はブラウザ内へ自動保存し、JSONバックアップも利用できます。

大会データと生成する出力はブラウザ内で処理します。Content Security Policyで実行時通信を遮断しています。

## v0.7.0で未完了の項目

- 日英コピーの最終レビュー
- キーボード / Accessibilityの最終監査
- リリース候補向けスクリーンショット・広範なブラウザ / 実機回帰

残りの開発計画は `APP_SPEC.md` を参照してください。

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
