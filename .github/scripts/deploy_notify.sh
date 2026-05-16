#!/bin/bash
# Send deployment status notifications to Telegram
# Usage: bash .github/scripts/deploy_notify.sh <status>
# Statuses: stopping, building, success, failure

set -euo pipefail

STATUS="${1:-}"

if [[ -z "$STATUS" ]]; then
    echo "Usage: $0 <stopping|building|success|failure>"
    exit 1
fi

# Skip if Telegram credentials are not configured
if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
    echo "⚠️ Telegram credentials not configured, skipping notification"
    exit 0
fi

# Extract numeric part from topic ID if format is like "-1003019260070_3"
TOPIC_ID=""
if [[ -n "${TELEGRAM_TOPIC_ID:-}" ]]; then
    if [[ "$TELEGRAM_TOPIC_ID" =~ _([0-9]+)$ ]]; then
        TOPIC_ID="${BASH_REMATCH[1]}"
    else
        TOPIC_ID="$TELEGRAM_TOPIC_ID"
    fi
fi

# Telegram API URL
TELEGRAM_API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"

# Escape special characters for HTML
escape_html() {
    local text="$1"
    text="${text//&/&amp;}"
    text="${text//</&lt;}"
    text="${text//>/&gt;}"
    text="${text//\"/&quot;}"
    echo "$text"
}

# Send message to Telegram using form-urlencoded (no jq dependency)
send_telegram() {
    local message="$1"

    local params=(
        --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}"
        --data-urlencode "text=${message}"
        --data-urlencode "parse_mode=HTML"
        --data-urlencode "disable_web_page_preview=true"
    )

    if [[ -n "$TOPIC_ID" ]]; then
        params+=(--data-urlencode "message_thread_id=${TOPIC_ID}")
    fi

    local response
    response=$(curl -s -X POST "$TELEGRAM_API" "${params[@]}")

    if echo "$response" | grep -q '"ok":true'; then
        echo "✅ Telegram notification sent: $STATUS"
    else
        echo "⚠️ Failed to send Telegram notification: $response"
    fi
}

# Gather deploy info
REPO_NAME="${GITHUB_REPOSITORY##*/}"
COMMIT_SHORT="${GITHUB_SHA:0:7}"
COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null | head -1 | cut -c1-100 || echo "N/A")
COMMIT_MSG=$(escape_html "$COMMIT_MSG")
BRANCH="${GITHUB_REF_NAME:-main}"
ACTOR="${GITHUB_ACTOR:-unknown}"
COMMIT_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA}"
RUN_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"

case "$STATUS" in
    stopping)
        send_telegram "⚙️ <b>DEPLOY</b> › <code>${REPO_NAME}</code>
━━━━━━━━━━━━━━━━━━
🔄 Starting deployment...

<code>${BRANCH}</code> · ${ACTOR}
<code>${COMMIT_SHORT}</code> ${COMMIT_MSG}"
        ;;

    success)
        send_telegram "⚙️ <b>DEPLOY</b> › <code>${REPO_NAME}</code>
━━━━━━━━━━━━━━━━━━
✅ Deployment successful

<code>${BRANCH}</code> · ${ACTOR}
<code>${COMMIT_SHORT}</code> ${COMMIT_MSG}
<a href=\"${COMMIT_URL}\">View Commit</a>"
        ;;

    failure)
        send_telegram "⚙️ <b>DEPLOY</b> › <code>${REPO_NAME}</code>
━━━━━━━━━━━━━━━━━━
🔥 Deployment failed!

<code>${BRANCH}</code> · ${ACTOR}
<code>${COMMIT_SHORT}</code> ${COMMIT_MSG}
<a href=\"${RUN_URL}\">View Logs</a>"
        ;;

    *)
        echo "Unknown status: $STATUS"
        echo "Usage: $0 <stopping|building|success|failure>"
        exit 1
        ;;
esac
