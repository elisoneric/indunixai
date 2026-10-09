import sqlite3

conn = sqlite3.connect('axion.db')
cursor = conn.cursor()
cursor.execute("DELETE FROM enterprise_contracts WHERE organization_name LIKE '%TrustBricks%'")
print(f"Deleted {cursor.rowcount} legacy contracts.")
cursor.execute("DELETE FROM users WHERE company_name LIKE '%TrustBricks%'")
print(f"Deleted {cursor.rowcount} legacy users.")
conn.commit()
conn.close()
print("Database cleanup complete.")
