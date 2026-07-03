import os
import re

def remove_emojis_and_styles(directory):
    emoji_pattern = re.compile(
        r'[\U00010000-\U0010ffff]|'
        r'[\u2600-\u27bf]|'
        r'[\u2b50]|'
        r'[\u200d]|'
        r'[\u2328]|'
        r'[\u23e9-\u23f3]|'
        r'[\u23f8-\u23fa]'
    )
    
    # We want to keep '✓' because it's used in logic (e.g. message.includes('✓'))
    # \u2713 is ✓, which might be caught by \u2600-\u27bf. Let's explicitly restore it if needed, or just not strip it.
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.js'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Fix inline background styles that ruin dark mode
                content = re.sub(r"background:\s*'(#[a-fA-F0-9]{3,6}|white|#fff|#eee|#f5f5f5|#f8f9fa|#f9f9f9|#fdf3e7)'", "background: 'var(--bg-surface)'", content)
                content = re.sub(r"background:\s*message\.includes[^,]+,", "", content)
                content = re.sub(r"color:\s*message\.includes[^,]+,", "", content)

                # Fix color in StudentNotices
                content = re.sub(r"border:\s*'1px solid #f39c12'", "border: '1px solid var(--border-dim)'", content)
                content = re.sub(r"borderLeft:\s*'4px solid #3498db'", "borderLeft: '4px solid var(--accent)'", content)
                
                # We specifically want to remove emojis from tabs, headers, and stat-icons.
                # Let's just remove specific emojis that were added.
                emojis_to_remove = ["👑 ", "🚪 ", "📊 ", "🔴 ", "💰 ", "⏳ ", "📈 ", "👥 ", "🔑 ", "📚 ", "👤 ", "📌 ", "📄 "]
                for e in emojis_to_remove:
                    content = content.replace(e, "")
                
                # Also remove emojis from stat icons but leave the div
                content = re.sub(r'<div className="stat-icon">[^<]+</div>', '<div className="stat-icon"></div>', content)

                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)

if __name__ == '__main__':
    remove_emojis_and_styles('c:/Users/Lenovo/Downloads/sanmati-Bhavan/frontend/src/components')
