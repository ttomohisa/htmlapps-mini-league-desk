# Mini League Desk / ミニリーグ運営

[English README](README.md)

Mini League Desk は、小規模な総当たり大会をブラウザで運営するためのローカル処理ツールです。最終的には、**「次は誰と誰？」「まだどの試合が残っている？」「今の順位は？」**を大会中にすぐ確認できることを中心にします。

現在の開発バージョン: **v0.2.0**

## 現在の機能

v0.2.0では、大会設定から総当たりの対戦表を生成できるようになりました。

- 任意の大会名
- 参加者を1人ずつ追加、または複数行でまとめて追加
- 重複名や不正な一括入力の拒否
- 上下ボタンによる並べ替え
- シャッフル + Undo
- 参加者削除 + Undo
- 3人以上で総当たり対戦表を生成
- サークル方式によるラウンド分け
- すべての組み合わせを1回ずつ生成
- 奇数人数では各巡に1人の「休み」を自動設定
- 参加者数 / 総試合数 / 巡数の表示
- 参加者編集へ戻って再生成
- 日本語 / 英語UI
- PC / スマートフォン対応のレスポンシブUI
- 実行時CDN、API、分析タグ、テレメトリなし

## 使い方

1. 必要なら大会名を入力します。
2. 参加者を1人ずつ、または複数行を貼り付けて3人以上追加します。
3. 必要に応じて順番を変更、またはシャッフルします。
4. **参加者を確定** を押します。
5. ラウンド別に生成された対戦表を確認します。
6. 変更したい場合は **参加者を編集** へ戻り、再度確定します。

## 対戦表のルール

参加者数を `n` とすると、`n × (n - 1) / 2` 試合を生成します。すべての参加者ペアがちょうど1回だけ登場します。偶数人数では `n - 1` 巡、奇数人数では `n` 巡となり、各巡に1人ずつ「休み」が入ります。

リポジトリの回帰テストでは3〜64人の全人数について、試合数、重複、自己対戦、同一巡での二重出場、休みの割り当てを検証します。

## プライバシー

大会名、参加者名、生成した対戦表はブラウザ内で処理します。Content Security Policyで実行時通信を遮断する構成で、大会データをこのアプリからサーバーへ送信しません。

v0.2.0で端末へ保存するのは言語設定だけです。**大会内容の自動保存はまだありません。** ページを再読み込みしたりタブを閉じたりすると現在の大会内容は消えます。大会データの端末内保存は v0.5.0 で実装予定です。

## v0.2.0で未実装の機能

この段階では、以下はまだありません。

- 試合結果入力
- 順位計算
- 進行 / 次の対戦表示
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
