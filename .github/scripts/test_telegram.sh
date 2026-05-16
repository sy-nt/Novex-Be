#!/bin/bash
# Test script to send a test message to Telegram

set -e

echo "🧪 Telegram Notification Test Script"
echo "======================================"

# Check if .env file exists
if [[ ! -f .env ]]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with:"
    echo "  TELEGRAM_BOT_TOKEN=your-bot-token"
    echo "  TELEGRAM_CHAT_ID=your-chat-id"
    echo "  TELEGRAM_TOPIC_ID=your-topic-id (optional)"
    exit 1
fi

# Load environment variables from .env
export $(grep -v '^#' .env | grep -E 'TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID|TELEGRAM_TOPIC_ID' | xargs)

# Check required variables
if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then
    echo "❌ Error: TELEGRAM_BOT_TOKEN is not set in .env"
    exit 1
fi

if [[ -z "$TELEGRAM_CHAT_ID" ]]; then
    echo "❌ Error: TELEGRAM_CHAT_ID is not set in .env"
    exit 1
fi

echo "✓ Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo "✓ Chat ID: $TELEGRAM_CHAT_ID"
if [[ -n "$TELEGRAM_TOPIC_ID" ]]; then
    # Extract numeric part if format is like "-1003019260070_3"
    if [[ "$TELEGRAM_TOPIC_ID" =~ _([0-9]+)$ ]]; then
        TELEGRAM_TOPIC_ID="${BASH_REMATCH[1]}"
        echo "✓ Topic ID: $TELEGRAM_TOPIC_ID (extracted from format)"
    else
        echo "✓ Topic ID: $TELEGRAM_TOPIC_ID"
    fi
fi
echo ""

# Build test message
MESSAGE=$(cat <<EOF
🧪 <b>Test Message from Telegram Bot</b>

This is a test notification to verify that your Telegram bot is working correctly.

✅ Bot token is configured
✅ Chat ID is configured
✅ Message formatting works

<i>Timestamp: $(date '+%Y-%m-%d %H:%M:%S')</i>
EOF
)

# Telegram API URL
TELEGRAM_API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"

# Build JSON payload using jq to properly escape
if [[ -n "$TELEGRAM_TOPIC_ID" ]]; then
    PAYLOAD=$(jq -n \
        --arg chat_id "$TELEGRAM_CHAT_ID" \
        --arg text "$MESSAGE" \
        --arg topic "$TELEGRAM_TOPIC_ID" \
        '{
            chat_id: $chat_id,
            text: $text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
            message_thread_id: ($topic | tonumber)
        }')
else
    PAYLOAD=$(jq -n \
        --arg chat_id "$TELEGRAM_CHAT_ID" \
        --arg text "$MESSAGE" \
        '{
            chat_id: $chat_id,
            text: $text,
            parse_mode: "HTML",
            disable_web_page_preview: true
        }')
fi

# Send request
echo "📤 Sending test message to Telegram..."
RESPONSE=$(curl -s -X POST "$TELEGRAM_API" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

# Check response
if echo "$RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    echo "✅ Message sent successfully!"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.'
elif echo "$RESPONSE" | jq -e '.error_code' > /dev/null 2>&1; then
    echo "❌ Failed to send message"
    echo ""
    echo "Error details:"
    echo "$RESPONSE" | jq '.'
    echo ""
    echo "Common issues:"
    echo "  - Bot token is invalid"
    echo "  - Bot is not added to the chat"
    echo "  - Chat ID is incorrect"
    echo "  - Bot doesn't have permission to post in the chat/topic"
    exit 1
else
    echo "❌ Unexpected response format"
    echo "$RESPONSE"
    exit 1
fi
