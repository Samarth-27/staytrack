import os
import glob
for file_path in glob.glob('frontend/src/**/*.js', recursive=True):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'http://localhost:5000/api' in content:
        new_content = content.replace("'http://localhost:5000/api'", "(process.env.REACT_APP_API_URL || 'http://localhost:5000/api')")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Updated', file_path)
