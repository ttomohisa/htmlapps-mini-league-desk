# Mini League Desk / ミニリーグ運営

[English README](README.md)

Mini League Desk は、小規模な総当たり大会をブラウザで運営するためのローカル処理ツールです。最終的には、**「次は誰と誰？」「まだどの試合が残っている？」「今の順位は？」**を大会中にすぐ確認できることを中心にします。

現在の開発バージョン: **v0.1.0**

## 現在の機能

v0.1.0では大会作成の基礎部分を実装しています。

- 任意の大会名
- 参加者を1人ずつ追加
- 1行1人の複数行貼り付け
- 重複名や不正な一括入力の拒否
- 上下ボタンによる参加者順の変更
- シャッフル + Undo
- 参加者削除 + Undo
- 全リセット時の確認
- 3人以上で参加者を確定
- 確定後の参加者確認と編集への復帰
- 日本語 / 英語UI
- PC / スマートフォン対応のレスポンシブUI
- 実行時CDN、API、分析タグ、テレメトリなし

## 使い方

1. 必要なら大会名を入力します。
2. 参加者を1人ずつ、または複数行を貼り付けて3人以上追加します。
3. 必要に応じて順番を変更、またはシャッフルします。
4. **参加者を確定** を押します。
5. 確定内容を確認し、必要なら編集へ戻ります。

## プライバシー

大会名と参加者名はブラウザ内で処理します。Content Security Policyで実行時通信を遮断する構成で、入力した大会データをこのアプリからサーバーへ送信しません。

v0.1.0で端末へ保存するのは言語設定だけです。**大会内容の自動保存はまだありません。** ページを再読み込みしたりタブを閉じたりすると、現在の入力内容は消えます。大会データの端末内保存は v0.5.0 で実装予定です。

## v0.1.0で未実装の機能

この段階では、以下はまだ表示しません。

- 総当たり対戦表の生成
- 試合結果入力
- 順位計算
- 大会データの保存 / バックアップ
- CSV / 画像 / 印刷出力

以降の開発範囲は `APP_SPEC.md` に記載しています。

## 単一HTML / オフライン利用

ビルドでは以下を生成します。

- `dist/index.html`
- `dist/index.self-extract.html`
- リポジトリ直下の `mini-league-desk.html`

通常版HTMLは `file://` で直接開いて利用できる構成を維持します。

## 対応ブラウザ

主要対象:

- Chrome
- Edge

可能な範囲で対応:

- Firefox
- Safari
- Chrome for Android
- Safari on iPhone

## 開発

最初に以下を確認してください。

1. `AGENTS.md`
2. `APP_SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `docs/LLM_WORKFLOW.md`

編集対象のアプリソース:

```text
src/index.template.html
```

生成済みstandalone HTMLは直接編集しません。

## ビルド

Windows:

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