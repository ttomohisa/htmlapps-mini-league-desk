# Mini League Desk / ミニリーグ運営

[English README](README.md)

Mini League Desk は、小規模な総当たり大会をブラウザで運営するローカル処理ツールです。**「次は誰と誰？」「まだどの試合が残っている？」「今の順位は？」**を大会中にすぐ確認できることを中心にしています。

現在の開発バージョン: **v0.6.0**

## 現在の機能

v0.6.0では、既存のLeague Deskと端末内保存を維持しながら、スマートフォン操作を重点的に仕上げました。

- 大会設定と3種類の結果記録方式
- 総当たり対戦表
- 結果の登録 / 修正 / 取消 + Undo
- 進行 / 対戦 / 順位
- 参加者別の未実施 / 完了相手
- 全試合完了時の最終順位
- 大会内容の端末内自動保存
- JSONバックアップ / 復元
- スマホの「進行 / 対戦 / 順位」下部固定タブ
- 狭い画面では参加者名を優先して2段表示する対戦カード
- スマホで大きくした結果選択ボタン・得点入力欄
- 完了済み試合を修正するときの「現在の結果」表示
- 勝者 / 引き分けの現在選択を強調表示
- 得点修正時、入力欄を選ぶと既存値を全選択
- Toastを下部固定タブの上へ表示
- JSONバックアップダイアログをスマホではボトムシート表示
- 空の対戦フィルターから「すべての試合を表示」で復帰
- 日本語 / 英語UI
- 実行時CDN、API、分析タグ、テレメトリなし

## スマートフォンでの使い方

大会開始後は下部の3タブを使います。

- **進行** — 次の試合、その次の試合、完了数、未実施数、大会完了
- **対戦** — フィルター、参加者別の残り対戦、結果入力
- **順位** — 現在順位

下部ナビゲーションはsafe areaを考慮し、Toastや到達可能なコンテンツが隠れないようにしています。

特に狭い画面では、対戦カードの1段目に2人の参加者名、2段目に結果・状態を置き、長い名前を無理に圧縮しない構成にしました。

## 結果の修正

完了済みの試合を開くと、現在登録されている結果を表示します。「勝敗だけ」「勝ち・引き分け」では現在の選択肢を強調します。得点入力では現在の得点を表示し、入力欄へフォーカスすると既存値を全選択してすぐ上書きできます。

## 保存とプライバシー

大会内容はブラウザ内へ自動保存します。移行・バックアップ用にJSON保存 / 読込も利用できます。

大会名、参加者、対戦表、結果、進行状況、順位、バックアップはブラウザ内で処理します。Content Security Policyで実行時通信を遮断しています。

## v0.6.0で未実装の機能

- CSV出力
- 順位表画像
- 印刷
- 正式リリース向けの最終i18n / Accessibility監査
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
