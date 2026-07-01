import psycopg2

conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/krono')
cursor = conn.cursor()
cursor.execute('UPDATE "ShopSettings" SET "value" = %s WHERE "key" = %s', ("Онлайн дэлгүүр", "shop_name"))
conn.commit()

cursor.execute('SELECT * FROM "ShopSettings" WHERE "key" = %s', ("shop_name",))
print(cursor.fetchall())
