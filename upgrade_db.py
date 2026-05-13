import sqlite3
import os

db_path = r'd:\Học\Học AI\Second-Brain-AI\brain.db'

def upgrade_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create leads table (The CRM)
    print("Creating leads table...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database upgraded successfully!")

if __name__ == '__main__':
    upgrade_db()
