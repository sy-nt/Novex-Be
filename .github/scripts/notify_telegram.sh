#!/bin/bash
# Send GitHub event notifications to Telegram

set -e

# Check required environment variables
if [[ -z "$TELEGRAM_BOT_TOKEN" || -z "$TELEGRAM_CHAT_ID" ]]; then
    echo "❌ Missing required environment variables: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID"
    exit 1
fi

# Extract numeric part from topic ID if format is like "-1003019260070_3"
if [[ -n "$TELEGRAM_TOPIC_ID" ]]; then
    if [[ "$TELEGRAM_TOPIC_ID" =~ _([0-9]+)$ ]]; then
        TELEGRAM_TOPIC_ID="${BASH_REMATCH[1]}"
    fi
fi

# Telegram API URL
TELEGRAM_API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"

# Function to send message to Telegram
send_telegram_message() {
    local message="$1"

    # Build JSON payload using jq to properly escape
    local payload
    if [[ -n "$TELEGRAM_TOPIC_ID" ]]; then
        payload=$(jq -n \
            --arg chat_id "$TELEGRAM_CHAT_ID" \
            --arg text "$message" \
            --arg topic "$TELEGRAM_TOPIC_ID" \
            '{
                chat_id: $chat_id,
                text: $text,
                parse_mode: "HTML",
                disable_web_page_preview: false,
                message_thread_id: ($topic | tonumber)
            }')
    else
        payload=$(jq -n \
            --arg chat_id "$TELEGRAM_CHAT_ID" \
            --arg text "$message" \
            '{
                chat_id: $chat_id,
                text: $text,
                parse_mode: "HTML",
                disable_web_page_preview: false
            }')
    fi

    # Send request
    response=$(curl -s -X POST "$TELEGRAM_API" \
        -H "Content-Type: application/json" \
        -d "$payload")

    # Check response
    if echo "$response" | jq -e '.ok' > /dev/null; then
        echo "✅ Message sent successfully"
    else
        echo "❌ Failed to send message:"
        echo "$response" | jq '.'
        exit 1
    fi
}

# Escape special characters for HTML
escape_html() {
    echo "$1" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g'
}

# Format push notification
format_push_notification() {
    local repo="$GITHUB_REPOSITORY"
    local ref="$GITHUB_REF"
    local branch="${ref#refs/heads/}"
    local actor="$GITHUB_ACTOR"
    local sha="${GITHUB_SHA:0:7}"
    local commit_msg=$(escape_html "$COMMIT_MESSAGE")
    local repo_url="https://github.com/${repo}"
    local commit_url="${repo_url}/commit/${GITHUB_SHA}"

    # Truncate commit message if too long
    if [[ ${#commit_msg} -gt 100 ]]; then
        commit_msg="${commit_msg:0:100}..."
    fi

    cat <<EOF
🚀 <b>New Push to ${repo}</b>

👤 <b>Pusher:</b> ${actor}
🌿 <b>Branch:</b> <code>${branch}</code>
📝 <b>Commit:</b> <code>${sha}</code>
💬 <b>Message:</b> ${commit_msg}

<a href="${commit_url}">View Commit</a> | <a href="${repo_url}">Repository</a>
EOF
}

# Format pull request notification
format_pr_notification() {
    local repo="$GITHUB_REPOSITORY"
    local action="$PR_ACTION"
    local pr_number="$PR_NUMBER"
    local pr_title=$(escape_html "$PR_TITLE")
    local pr_url="$PR_URL"
    local pr_author="$PR_AUTHOR"
    local base_branch="$PR_BASE_BRANCH"
    local head_branch="$PR_HEAD_BRANCH"

    if [[ "$action" == "opened" ]]; then
        local emoji="🔔"
        local action_text="New Pull Request"
        local pr_body=$(escape_html "$PR_BODY")

        # Truncate body if too long
        if [[ ${#pr_body} -gt 150 ]]; then
            pr_body="${pr_body:0:150}..."
        fi

        local body_section=""
        if [[ -n "$pr_body" ]]; then
            body_section="<b>Description:</b>
${pr_body}

"
        fi

        cat <<EOF
${emoji} <b>${action_text} in ${repo}</b>

📋 <b>PR #${pr_number}:</b> ${pr_title}
👤 <b>Author:</b> ${pr_author}
🌿 <b>Branch:</b> <code>${head_branch}</code> → <code>${base_branch}</code>

${body_section}<a href="${pr_url}">View Pull Request</a>
EOF

    elif [[ "$action" == "closed" && "$PR_MERGED" == "true" ]]; then
        local emoji="✅"
        local action_text="Pull Request Merged"
        local merged_by="$PR_MERGED_BY"

        cat <<EOF
${emoji} <b>${action_text} in ${repo}</b>

📋 <b>PR #${pr_number}:</b> ${pr_title}
👤 <b>Author:</b> ${pr_author}
🔀 <b>Merged by:</b> ${merged_by}
🌿 <b>Branch:</b> <code>${head_branch}</code> → <code>${base_branch}</code>

<a href="${pr_url}">View Pull Request</a>
EOF
    else
        echo ""
    fi
}

# Main logic
case "$GITHUB_EVENT_NAME" in
    push)
        echo "📤 Sending push notification to Telegram..."
        MESSAGE=$(format_push_notification)
        send_telegram_message "$MESSAGE"
        ;;

    pull_request)
        MESSAGE=$(format_pr_notification)
        if [[ -n "$MESSAGE" ]]; then
            echo "📤 Sending pull request notification to Telegram..."
            send_telegram_message "$MESSAGE"
        else
            echo "ℹ️  Skipping non-relevant PR action: $PR_ACTION"
        fi
        ;;

    *)
        echo "ℹ️  Unsupported event type: $GITHUB_EVENT_NAME"
        ;;
esac
