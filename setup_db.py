import sqlite3
import datetime
import os

def create_and_populate_db():
    db_path = r'd:\Học\Học AI\Second-Brain-AI\brain.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    tables = {
        'knowledge': 'lưu bài học, insight',
        'business': 'lưu sản phẩm, khách hàng',
        'brand_voice': 'lưu giọng văn, tone, style'
    }

    for table in tables:
        cursor.execute(f'''
            CREATE TABLE IF NOT EXISTS {table} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    
    samples = {
        'knowledge': [
            ('Bài học 1: Liên tục tiến lên', 'Không ngừng học hỏi và phát triển mỗi ngày.', datetime.datetime.now().isoformat()),
            ('Insight: Hành vi khách hàng', 'Khách hàng thích sự chân thành và tử tế.', datetime.datetime.now().isoformat())
        ],
        'business': [
            ('Sản phẩm: Template Second Brain', 'Hệ thống quản lý kiến thức trên Notion.', datetime.datetime.now().isoformat()),
            ('Khách hàng: Anh A', 'Quan tâm đến giải pháp quản lý thời gian.', datetime.datetime.now().isoformat())
        ],
        'brand_voice': [
            ('Tone: Tâm sự', 'Văn nói nhẹ nhàng, như một người bạn tâm sự bên ly cafe.', datetime.datetime.now().isoformat()),
            ('Từ khoá: Nhân duyên', 'Sử dụng các từ khoá như nhân duyên, hữu duyên, trọn vẹn.', datetime.datetime.now().isoformat())
        ]
    }

    for table, data in samples.items():
        cursor.execute(f'DELETE FROM {table}')
        for row in data:
            cursor.execute(f'''
                INSERT INTO {table} (title, content, created_at)
                VALUES (?, ?, ?)
            ''', row)

    conn.commit()
    conn.close()
    print("Database created successfully!")

if __name__ == '__main__':
    create_and_populate_db()
