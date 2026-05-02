import json

path = r'C:\Users\Oscar\.gemini\antigravity\brain\7a7a395b-0649-435a-9e21-5177c7dfad95\.system_generated\steps\1213\content.md'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
    json_str = content.split('---')[-1].strip()
    data = json.loads(json_str)

BASE = "https://github.com/hasaneyldrm/exercises-dataset/raw/main/"

# Print ALL exercise names to find what's available
for item in data:
    name = item['name'].lower()
    if any(t in name for t in ["wood", "bird", "hollow", "toes", "bar", "shrug", "snatch", "plank", "ab roller", "rollout", "hip thrust"]):
        print(f"{item['name']:60s} -> {item['gif_url']}")
