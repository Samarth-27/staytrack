const fs = require('fs');
const path = require('path');

function removeEmojisAndStyles(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            removeEmojisAndStyles(fullPath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Fix inline background styles that ruin dark mode
            content = content.replace(/background:\s*'(#[a-fA-F0-9]{3,6}|white|#fff|#eee|#f5f5f5|#f8f9fa|#f9f9f9|#fdf3e7)'/g, "background: 'var(--bg-surface)'");
            content = content.replace(/background:\s*message\.includes[^,]+,/g, "");
            content = content.replace(/color:\s*message\.includes[^,]+,/g, "");

            // Fix color in StudentNotices
            content = content.replace(/border:\s*'1px solid #f39c12'/g, "border: '1px solid var(--border-dim)'");
            content = content.replace(/borderLeft:\s*'4px solid #3498db'/g, "borderLeft: '4px solid var(--accent)'");
            
            // Remove specific emojis from headers and buttons
            const emojisToRemove = ["👑 ", "🚪 ", "📊 ", "🔴 ", "💰 ", "⏳ ", "📈 ", "👥 ", "🔑 ", "📚 ", "👤 ", "📌 ", "📄 "];
            for (const e of emojisToRemove) {
                // global replace
                content = content.split(e).join("");
            }
            
            // Also remove emojis from stat icons
            content = content.replace(/<div className="stat-icon">[^<]+<\/div>/g, '<div className="stat-icon"></div>');

            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}

removeEmojisAndStyles('c:/Users/Lenovo/Downloads/sanmati-Bhavan/frontend/src/components');
console.log("Cleanup complete!");
