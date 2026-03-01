import sqlite3
import re
import yaml
import uuid

def parse_customers(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    yaml_blocks = re.findall(r'\*\*客户\d+ - (.*?)\*\*\s+```yaml\s+(.*?)\s+```', content, re.DOTALL)
    
    customers = []
    for name_header, block in yaml_blocks:
        try:
            data = yaml.safe_load(block)
            base = data.get('基础信息', {})
            lifestyle = data.get('生活方式', {})
            lang = data.get('语言风格', {})
            lingzhi = data.get('灵芝水铺关联', {})
            details = data.get('个人细节', {})
            
            name = base.get('昵称', name_header)
            gender = base.get('性别', '')
            age = base.get('年龄', 0)
            occupation = base.get('职业', '')
            city = base.get('城市', '')
            
            pain_points = details.get('健康困扰', '')
            needs = lingzhi.get('购买动机', '')
            scenes = lingzhi.get('饮用场景', '')
            language = f"口头禅: {lang.get('口头禅', [])}, 句式: {lang.get('句式', '')}"
            lifestyle_str = f"作息: {lifestyle.get('作息', '')}, 消费: {lifestyle.get('消费', '')}"
            
            customers.append({
                'name': name,
                'gender': gender,
                'age': age,
                'occupation': occupation,
                'city': city,
                'painPoints': pain_points,
                'needs': needs,
                'scenes': scenes,
                'language': language,
                'lifestyle': lifestyle_str,
                'status': 'active',
                'wechatAccount': f"wx_{uuid.uuid4().hex[:8]}" # 生成模拟微信号
            })
        except Exception as e:
            print(f"Error parsing block for {name_header}: {e}")
            
    return customers

customers = parse_customers('/home/ubuntu/upload/客户背景（50人）.txt')
print(f"Parsed {len(customers)} customers.")

conn = sqlite3.connect('prisma/dev.db')
cursor = conn.cursor()

for c in customers:
    cursor.execute("SELECT id FROM Customer WHERE name = ?", (c['name'],))
    row = cursor.fetchone()
    
    if row:
        cursor.execute("""
            UPDATE Customer SET
                gender=?, age=?, occupation=?, city=?, painPoints=?, needs=?, scenes=?, language=?, lifestyle=?, status='active', wechatAccount=?, updatedAt=CURRENT_TIMESTAMP
            WHERE name=?
        """, (
            c['gender'], c['age'], c['occupation'], c['city'],
            c['painPoints'], c['needs'], c['scenes'], c['language'], c['lifestyle'], c['wechatAccount'], c['name']
        ))
    else:
        cid = f"c_{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO Customer (id, name, gender, age, occupation, city, painPoints, needs, scenes, language, lifestyle, status, wechatAccount, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (
            cid, c['name'], c['gender'], c['age'], c['occupation'], c['city'],
            c['painPoints'], c['needs'], c['scenes'], c['language'], c['lifestyle'], 'active', c['wechatAccount']
        ))

conn.commit()
conn.close()
print("Import completed.")
