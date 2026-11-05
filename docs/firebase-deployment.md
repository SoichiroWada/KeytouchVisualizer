# GitHub ActionsからFirebase Hostingへ自動公開

## このプロジェクトの構成

| 項目 | 値 |
| --- | --- |
| GitHub | `SoichiroWada/KeytouchVisualizer` |
| 本番ブランチ | `master` |
| Firebase Project name | `Keytouch Visualizer` |
| Firebase Project ID | `keytouch-visualizer` |
| Firebase Project number | `32685089604` |
| Hosting公開ディレクトリ | `dist/` |
| Hostingチャンネル | `live` |
| 公開先 | https://keytouch-visualizer.web.app |
| GitHub Environment | `production` |
| GitHub Secret | `FIREBASE_SERVICE_ACCOUNT_KEYTOUCH_VISUALIZER` |

Firebase Hostingを使用します。Firebase App Hostingは使用しません。Workflowで指定するのはProject IDです。Project numberを代わりに指定する必要はありません。

公開の流れ:

```text
masterへのpush（PRのマージも含む）
  → Firebase Hosting Workflow
  → 再利用可能なCI Workflow
      ├─ npm ci → ESLint → TypeScript → Vitest → production build
      └─ npm ci → Chromiumのブラウザテスト
  → 両方が成功
  → Firebase認証設定を確認
  → npm ci
  → Firebase CLIのpredeployで同じコミットをbuild
  → keytouch-visualizer の Hosting / live に公開
```

PRや`feature/keyboard-hand-animation`へのpushはCIのみを実行します。テスト失敗時はdeploy jobを実行しません。公開は直列化し、実行中のデプロイを別のpushで中断しません。Ubuntu Serverを起動し続ける必要はありません。

## 1. Firebaseの公開用サービスアカウントを用意

[Google Cloudのサービスアカウント画面](https://console.cloud.google.com/iam-admin/serviceaccounts?project=keytouch-visualizer)を開き、対象プロジェクトが **`keytouch-visualizer`** であることを確認します。

1. 「サービスアカウントを作成」を選択
2. 名前を、たとえば`github-hosting-deploy`として作成
3. この静的サイトの本番Hosting公開に使うロールを付与
   - **Firebase Hosting Admin**: `roles/firebasehosting.admin`
   - **API Keys Viewer**: `roles/serviceusage.apiKeysViewer`
   - **Service Usage Viewer**: `roles/serviceusage.serviceUsageViewer`（CLIがHosting APIの有効状態を確認するため）
4. 作成したサービスアカウントを開く
5. 「キー」→「鍵を追加」→「新しい鍵を作成」→ **JSON** を選択し、ダウンロード

PRのプレビューURLをFirebase Authenticationに登録する構成ではないため、この構成ではAuth管理用のロールを付与しません。Cloud Run / Functionsへのrewriteもありません。

ロールの根拠は[Firebase Hosting Action公式のサービスアカウント手順](https://github.com/FirebaseExtended/action-hosting-deploy/blob/main/docs/service-account.md)と[Service Usageの公式ロール一覧](https://docs.cloud.google.com/iam/docs/roles-permissions/serviceusage)を参照してください。`API Keys Viewer`には`serviceusage.services.get`が含まれないため、`Service Usage Viewer`も必要です。JSON鍵に含まれる`project_id`が`keytouch-visualizer`であることを確認してください。

JSON鍵はプロジェクトディレクトリの外で管理してください。Gitへ追加したり、チャットへ貼り付けたりしないでください。

## 2. GitHub SecretへJSON全体を登録

[GitHubのActions Secrets設定](https://github.com/SoichiroWada/KeytouchVisualizer/settings/secrets/actions)を開きます。

1. **New repository secret** を選択
2. Nameへ次を正確に入力

   ```text
   FIREBASE_SERVICE_ACCOUNT_KEYTOUCH_VISUALIZER
   ```

3. SecretへダウンロードしたJSONファイルの**内容全体**を貼り付け
4. **Add secret** を選択

ファイル名やパス、FirebaseのWeb用apiKey、GitHubのPATはこのSecretの値として使えません。サービスアカウントのJSON全体が必要です。

すでに同名のSecretが`production` Environmentに登録されている場合は、それを利用できます。同名が両方にある場合はEnvironment側の値が優先されるため、対象プロジェクトを確認してください。

## 3. GitHub Environmentを確認

[Environment設定](https://github.com/SoichiroWada/KeytouchVisualizer/settings/environments)で`production`を確認・作成します。

- 毎回の手動承認なしで自動デプロイする場合、**Required reviewers**と**Wait timer**は設定しません
- 公開対象ブランチをEnvironmentでも制限する場合は、`master`を許可します
- すでに承認待ちになる保護ルールがある場合は、そのルールに従って公開前に承認が必要になります

旧Workflow用の`ENABLE_FIREBASE_PRODUCTION_DEPLOY`変数と`confirm_project`入力は、新しい構成では使用しません。

## 4. Workflowをmasterへ反映

Ubuntu Serverで実行します。

```bash
cd /mnt/disk3/REACT/KeytouchVisualizer
git status
git add .github/workflows/ci.yml .github/workflows/firebase-hosting.yml README.md docs/firebase-deployment.md
git commit -m "ci: deploy Firebase Hosting automatically from master"
export GPG_TTY="$(tty)"
git push origin master
```

現在のブランチが`master`であることを確認してください。今回作成したWorkflowの反映前は旧来の手動公開設定が動作します。Secret登録とWorkflowのpushが完了すると、以降は`master`へのpush・PRマージで自動公開されます。

## 5. 結果の確認・再実行

[GitHub Actions](https://github.com/SoichiroWada/KeytouchVisualizer/actions)の **Firebase Hosting** を開きます。

- `validation / checks`: ESLint、型チェック、Vitest、production build
- `validation / browser`: Chromiumテスト
- `deploy`: Firebaseの認証確認、依存取得、本番公開

すべて成功したら[本番サイト](https://keytouch-visualizer.web.app)を開いて確認します。

手動で再公開する場合は **Run workflow** で **master** を選択します。手動実行でも同じCIを通過してから公開します。ほかのブランチを選ぶとdeploy jobはスキップします。

## エラーが出る場合

| 表示・状態 | 確認する項目 |
| --- | --- |
| Firebase Secret is missing | Secret名、Repository / production Environmentの登録先 |
| complete service-account JSON | JSONファイルの全文を登録したか |
| key for project keytouch-visualizer | JSONのproject_idとサービスアカウントの所属プロジェクト |
| Permission denied / HTTP 403 | サービスアカウントのロール、プロジェクトのアクセス権、鍵の有効性 |
| serviceusage.services.get / AUTH_PERMISSION_DENIED | Google CloudのプロジェクトIAMで公開用サービスアカウントにService Usage Viewerを追加。反映に数分待ってからRe-run failed jobs。JSON鍵の再発行やSecret再登録は不要 |
| deployがWaiting | production Environmentの承認・待機ルール |
| validationが失敗 | checks / browserの失敗ステップを修正して再push |
| Workflowが起動しない | masterへWorkflowをpushしたか、Actionsが有効か |
| Push protectionで拒否 | コミット履歴にログや鍵が含まれていないか。ログをignoreするだけでは過去のコミットから消えません |

## 参考

- [Firebase公式GitHub連携](https://firebase.google.com/docs/hosting/github-integration)
- [Firebase Hosting Actionのサービスアカウント設定](https://github.com/FirebaseExtended/action-hosting-deploy/blob/main/docs/service-account.md)
- [GitHubの再利用可能Workflow](https://docs.github.com/en/actions/sharing-automations/reusing-workflows)
