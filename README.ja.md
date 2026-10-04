# Mini League Desk / ミニリーグ運営

[English README](README.md)

Mini League Desk は、小規模な総当たり大会をブラウザで運営するローカル処理ツールです。**「次は誰と誰？」「まだどの試合が残っている？」「今の順位は？」**を大会中にすぐ確認できることを中心にしています。

現在の開発バージョン: **v0.4.0**

## 現在の機能

v0.4.0では、大会中に使う **League Desk** の進行フローを追加しました。

- 大会設定と3種類の結果記録方式
- 総当たり対戦表の生成
- 結果の登録 / 修正 / 取消 + Undo
- リアルタイム順位と同順位処理
- **進行**: 完了数、未実施数、進行率、次の試合、その次の試合
- **対戦**: すべて / 未実施 / 完了フィルター
- 参加者を選んで、その人の未実施相手・完了相手を確認
- **順位**: 現在順位を確認
- 全試合完了時の自動完了状態
- 完了画面内の最終順位
- スマートフォンでは「進行 / 対戦 / 順位」の下部固定3タブ
- PCでは重要情報を同じページ上で見渡せるレイアウト
- 日本語 / 英語UI
- 実行時CDN、API、分析タグ、テレメトリなし

## 大会中の使い方

1. 大会名と結果の記録方法を決め、参加者を3人以上登録します。
2. 参加者を確定して総当たり表を生成します。
3. **進行** で次の試合を確認します。
4. 次の試合、または任意の対戦から結果を入力します。
5. **対戦** では未実施 / 完了を絞り込んだり、特定参加者の残り対戦を確認できます。
6. **順位** で現在の順位を確認します。
7. 未実施試合が0になると、自動的に大会完了状態となり最終順位を表示します。

「次の試合」は生成順で最初に残っている未実施試合です。強制順ではないため、別の未実施試合を先に行っても問題ありません。

## 結果・順位ルール

- 勝敗だけ: 勝ち1 / 負け0
- 勝ち・引き分け: 勝ち3 / 引き分け1 / 負け0
- 得点入力: 勝ち3 / 引き分け1 / 負け0。同点許可を切り替え可能

得点なしの方式は勝点で順位判定します。得点入力は **勝点 → 得失点差 → 得点**。有効な判定項目がすべて同じ場合は同順位です。

## プライバシー

大会名、参加者、対戦表、結果、進行状況、順位はブラウザ内で処理します。Content Security Policyで実行時通信を遮断し、大会データをこのアプリからサーバーへ送信しません。

v0.4.0で端末へ保存するのは言語設定だけです。**大会内容はまだ自動保存されません。** 再読み込みやタブを閉じると結果を含む大会内容は消えます。端末内保存は v0.5.0 で実装予定です。

## v0.4.0で未実装の機能

- 大会データの端末内保存
- JSONバックアップ / 復元
- CSV / 画像 / 印刷出力
- 正式リリース向けの最終Mobile / Accessibility仕上げ

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
