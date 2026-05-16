# Telegram Notifications Setup

This guide explains how to set up automated Telegram notifications for GitHub events (push, PR opened, PR merged).

## Prerequisites

1. **Telegram Bot**: Create a bot using [@BotFather](https://t.me/BotFather)
2. **Telegram Group**: Create a group and add your bot
3. **GitHub Repository**: Admin access to configure secrets

## Step 1: Create Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow the prompts to name your bot
4. Copy the **bot token** (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Step 2: Get Chat ID

### For Regular Group:

1. Add your bot to the Telegram group
2. Send a test message in the group
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for `"chat":{"id":-1234567890}` in the response
5. Copy the negative number (e.g., `-1234567890`)

### For Topic/Forum Group:

1. Add your bot to the group with topics enabled
2. Send a message in the specific topic
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for:
   - `"chat":{"id":-1234567890}` (Chat ID)
   - `"message_thread_id":123` (Topic ID)

## Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

   | Secret Name | Value | Required |
   |------------|-------|----------|
   | `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather | ✅ Yes |
   | `TELEGRAM_CHAT_ID` | Your group chat ID (negative number) | ✅ Yes |
   | `TELEGRAM_TOPIC_ID` | Topic/thread ID (if using topics) | ❌ Optional |

## Step 4: Enable Workflow

The workflow is located at `.github/workflows/telegram-notify.yml` and will automatically:

- ✅ Send notifications on push to `main`, `master`, or `develop` branches
- ✅ Send notifications when PR is opened
- ✅ Send notifications when PR is merged

### Customizing Branches

Edit `.github/workflows/telegram-notify.yml` to change monitored branches:

```yaml
on:
  push:
    branches:
      - main
      - master
      - develop
      - your-custom-branch  # Add your branch here
```

## Testing

1. Make a commit and push to one of the monitored branches
2. Check your Telegram group for a notification
3. If no notification appears:
   - Verify the bot is added to the group
   - Check GitHub Actions logs: **Actions** tab → **Telegram Notifications** workflow
   - Ensure secrets are correctly configured

## Notification Examples

### Push Notification
```
🚀 New Push to owner/repo

👤 Pusher: username
🌿 Branch: main
📝 Commit: abc1234
💬 Message: Add new feature

View Commit | Repository
```

### PR Opened Notification
```
🔔 New Pull Request in owner/repo

📋 PR #42: Add authentication feature
👤 Author: username
🌿 Branch: feature-branch → main

Description:
This PR adds JWT authentication...

View Pull Request
```

### PR Merged Notification
```
✅ Pull Request Merged in owner/repo

📋 PR #42: Add authentication feature
👤 Author: username
🔀 Merged by: maintainer
🌿 Branch: feature-branch → main

View Pull Request
```

## Troubleshooting

### Bot doesn't send messages

- Ensure bot has permission to post in the group
- For topic groups, make sure bot can post in the specific topic
- Check if bot token is correct

### Messages not appearing in correct topic

- Verify `TELEGRAM_TOPIC_ID` is set correctly
- Topic ID can be found in the `message_thread_id` field from getUpdates API

### GitHub Action fails

- Check **Actions** tab in GitHub repository
- Review error logs for the failed workflow
- Verify all required secrets are configured

## Additional Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Telegram BotFather](https://t.me/BotFather)
