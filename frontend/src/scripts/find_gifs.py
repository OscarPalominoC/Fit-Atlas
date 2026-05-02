
import json

path = r'C:\Users\Oscar\AppData\Local\Temp\content.md' # I'll use the absolute path from the previous tool output
# Wait, the path was C:\Users\Oscar\.gemini\antigravity\brain\7a7a395b-0649-435a-9e21-5177c7dfad95\.system_generated\steps\1213\content.md
path = r'C:\Users\Oscar\.gemini\antigravity\brain\7a7a395b-0649-435a-9e21-5177c7dfad95\.system_generated\steps\1213\content.md'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
    # Remove the header "Source: ... ---"
    json_str = content.split('---')[-1].strip()
    data = json.loads(json_str)

targets = {
    "cable crossover": ["cable cross-over", "cable crossover"],
    "woodchopper": ["woodchopper", "wood chopper", "wood-chopper"],
    "bird dog": ["bird dog", "bird-dog"],
    "plank": ["plank"],
    "hollow hold": ["hollow hold", "hollow body"],
    "toes to bar": ["toes to bar", "toes-to-bar"],
    "ab wheel rollout": ["ab wheel", "rollout"],
    "snatch grip shrug": ["snatch grip shrug", "snatch shrug"],
    "hip thrust": ["hip thrust"],
    "cycling": ["cycling", "bicycle"],
    "hiking": ["hiking", "walking"],
    "diamond push-up": ["diamond push-up"]
}

results = {}
for item in data:
    name = item['name'].lower()
    for t, synonyms in targets.items():
        for syn in synonyms:
            if syn in name:
                if t not in results:
                    results[t] = []
                results[t].append({
                    "name": item['name'],
                    "gif": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/" + item['gif_url']
                })

print(json.dumps(results, indent=2))
