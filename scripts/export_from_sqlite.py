import sqlite3
import json

CDN_BASE_URL = "https://sipreibgzwmeirmhhbit.supabase.co/storage/v1/object/public/product-media/products/"

def remap_url(url):
    if not url:
        return url
    if url.startswith("/uploads/products/"):
        filename = url.replace("/uploads/products/", "")
        return f"{CDN_BASE_URL}{filename}"
    return url

def remap_images_json(images_str):
    if not images_str:
        return "[]"
    try:
        data = json.loads(images_str)
        if isinstance(data, list):
            remapped = [remap_url(u) for u in data]
            return json.dumps(remapped)
    except Exception:
        pass
    return images_str

conn = sqlite3.connect("prisma/dev.db")
conn.row_factory = sqlite3.Row
cur = conn.cursor()

def fetch_all(table):
    cur.execute(f'SELECT * FROM "{table}"')
    return [dict(row) for row in cur.fetchall()]

stores = fetch_all("Store")
discounts = fetch_all("Discount")
products = fetch_all("Product")
variants = fetch_all("ProductVariant")
orders = fetch_all("Order")
order_items = fetch_all("OrderItem")

# Remap product images
for p in products:
    p["featuredImage"] = remap_url(p.get("featuredImage"))
    p["images"] = remap_images_json(p.get("images"))

for item in order_items:
    item["image"] = remap_url(item.get("image"))

for s in stores:
    s["heroImageUrl"] = remap_url(s.get("heroImageUrl"))

data = {
    "stores": stores,
    "discounts": discounts,
    "products": products,
    "variants": variants,
    "orders": orders,
    "order_items": order_items,
}

with open("scripts/exported_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print(f"Exported: {len(stores)} stores, {len(discounts)} discounts, {len(products)} products, {len(variants)} variants, {len(orders)} orders, {len(order_items)} order items.")
