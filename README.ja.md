# Mini League Desk / ミニリーグ運営

[English README](README.md)

Mini League Desk は、小規模な総当たり大会をブラウザで運営するローカル処理ツールです。**「次は誰と誰？」「まだどの試合が残っている？」「今の順位は？」**を大会中にすぐ確認できることを中心にしています。

現在の開発バージョン: **v0.5.0**

## 現在の機能

v0.5.0では、League Deskに端末内保存とJSONバックアップを追加しました。

- 大会設定と3種類の結果記録方式
- 総当たり対戦表
- 結果の登録 / 修正 / 取消 + Undo
- 進行 / 対戦 / 順位
- 参加者別の未実施 / 完了相手
- 全試合完了時の最終順位
- **大会内容の端末内自動保存**
- 再読み込み後に同じ大会を再開
- schemaVersion付きデータ形式
- event ID / 作成日時 / 更新日時
- **JSONバックアップ保存**
- 保存前にファイル名を編集可能
- **JSONバックアップ読込**
- 読込前にデータ形式・対戦・結果を検証
- 現在の大会を置き換える場合は確認
- 読込による置換後は元の大会へUndo可能
- 日本語 / 英語UI
- 実行時CDN、API、分析タグ、テレメトリなし

## 端末内保存

大会名、参加者、設定、対戦表、結果、進行状態、対戦フィルター、参加者選択、スマホの表示タブをブラウザのローカルストレージへ保存します。

保存データが壊れている、または対応していないschemaVersionの場合はアプリ状態へ適用しません。

ブラウザやOSの操作でサイトデータが消える可能性はあるため、大切な大会ではJSONバックアップも利用してください。

## JSONバックアップ

**JSONバックアップ** を押すと、ファイル名を確認・編集して保存できます。

バックアップには少なくとも以下を含みます。

- schemaVersion
- event ID
- 大会名
- 結果設定
- 参加者と順番
- ラウンド・対戦・結果
- League DeskのUI状態
- 作成日時 / 更新日時

読込時は現在の大会を変更する前に内容を検証します。不正ファイルや非対応schemaVersionは拒否し、現在の有効な大会を壊しません。

## プライバシー

大会名、参加者、対戦表、結果、進行状況、順位、JSONバックアップはブラウザ内で処理します。Content Security Policyで実行時通信を遮断し、大会データをこのアプリからサーバーへ送信しません。

## v0.5.0で未実装の機能

- CSV出力
- 順位表画像
- 印刷
- 正式リリース向けの最終Mobile / Accessibility仕上げ
- リリース候補向けスクリーンショット・広範な実機回帰

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
