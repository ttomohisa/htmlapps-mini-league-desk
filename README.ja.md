# Mini League Desk / ミニリーグ運営

[English README](README.md)

Mini League Desk は、小規模な総当たり大会をブラウザで運営するローカル処理ツールです。最終的には、**「次は誰と誰？」「まだどの試合が残っている？」「今の順位は？」**を大会中にすぐ確認できることを中心にします。

現在の開発バージョン: **v0.3.0**

## 現在の機能

v0.3.0では、大会作成・総当たり対戦表に加えて、結果入力と順位計算に対応しました。

- 任意の大会名
- 参加者の追加 / 並べ替え / シャッフル / 削除
- 全組み合わせを1回ずつ生成する総当たり表
- ラウンド分けと奇数人数の「休み」
- 3種類の結果記録方式
  - 勝敗だけ: 勝ち1 / 負け0
  - 勝ち・引き分け: 勝ち3 / 引き分け1 / 負け0
  - 得点入力: 勝ち3 / 引き分け1 / 負け0。同点を認めるか選択可能
- 任意の対戦から結果を入力・修正
- 結果を取り消して未実施へ戻す
- 結果の登録 / 修正 / 取消にUndo
- 結果入力のたびに順位を自動再計算
- 得点入力では 勝点 → 得失点差 → 得点 の順で順位判定
- 判定項目が完全に同じ場合は同順位
- 日本語 / 英語UI
- PC / スマートフォン対応
- 実行時CDN、API、分析タグ、テレメトリなし

## 使い方

1. 大会名と結果の記録方法を選びます。
2. 参加者を3人以上追加します。
3. **参加者を確定** して対戦表を生成します。
4. 任意の対戦を選びます。
5. 記録方式に応じて勝者・引き分け・得点を入力します。
6. 自動更新される順位を確認します。
7. 完了した対戦を開けば、結果の修正や取り消しもできます。

## 順位ルール

「勝敗だけ」「勝ち・引き分け」は勝点のみで順位を判定します。

「得点入力」は次の順です。

1. 勝点
2. 得失点差
3. 得点

有効な判定項目がすべて同じ場合は同順位です。表示を安定させるため参加者登録順が使われる場合がありますが、それによって順位差は付けません。

## プライバシー

大会名、参加者、対戦表、結果、順位はブラウザ内で処理します。Content Security Policyで実行時通信を遮断し、大会データをこのアプリからサーバーへ送信しません。

v0.3.0で端末へ保存するのは言語設定だけです。**大会内容はまだ自動保存されません。** 再読み込みやタブを閉じると結果を含む大会内容は消えます。端末内保存は v0.5.0 で実装予定です。

## v0.3.0で未実装の機能

- 進行 / 対戦 / 順位の専用ナビゲーション
- 次の対戦 / 未実施試合
- 大会完了画面
- 大会データ保存 / JSONバックアップ
- CSV / 画像 / 印刷出力

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
