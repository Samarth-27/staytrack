const fs = require('fs');
const path = require('path');

function removeEmojis(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeEmojis(fullPath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const emojisToRemove = ["👑 ", "🚪 ", "📊 ", "🔴 ", "💰 ", "⏳ ", "📈 ", "👥 ", "🔑 ", "📚 ", "👤 ", "📌 ", "📄 "];
            for (const e of emojisToRemove) {
                content = content.split(e).join("");
            }
            content = content.replace(/<div className="stat-icon">[^<]+<\/div>/g, '<div className="stat-icon"></div>');
            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}
removeEmojis('c:/Users/Lenovo/Downloads/sanmati-Bhavan/frontend/src/components');
