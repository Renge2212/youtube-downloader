import os

CONFIG = {
    'MAX_LOG_MESSAGES': 100,
    'TEMP_FILE_CLEANUP_INTERVAL': 3600,  # 1 hour
    'ALLOWED_DOMAINS': ['youtube.com', 'youtu.be', 'www.youtube.com'],
    'MAX_URL_LENGTH': 500
}

log_messages = []

def add_log(message):
    """Add a log message with timestamp."""
    import time
    timestamp = time.strftime("%H:%M:%S")
    log_message = f"[{timestamp}] {message}"
    log_messages.append(log_message)
    # Remove older messages exceeding the max limit
    if len(log_messages) > CONFIG['MAX_LOG_MESSAGES']:
        log_messages.pop(0)
    print(log_message)  # Also output to console

def get_logs():
    return log_messages
