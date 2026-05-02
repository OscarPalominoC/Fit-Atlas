import json

path = r'C:\Users\Oscar\.gemini\antigravity\brain\7a7a395b-0649-435a-9e21-5177c7dfad95\.system_generated\steps\1213\content.md'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
    json_str = content.split('---')[-1].strip()
    data = json.loads(json_str)

# Build a lookup by name
by_name = {}
for item in data:
    by_name[item['name'].lower()] = "https://github.com/hasaneyldrm/exercises-dataset/raw/main/" + item['gif_url']

# Search for specific exercises
targets = {
    "woodchopper": ["wood chop", "woodchop", "cable wood", "cable chop"],
    "bird dog": ["bird dog", "bird-dog"],
    "toes to bar": ["toes to bar", "toes-to-bar"],
    "plank": ["front plank", "plank hold"],
    "hollow hold": ["hollow hold", "hollow body hold"],
    "ab wheel rollout": ["ab wheel", "wheel rollout", "ab roller"],
    "snatch grip shrug": ["snatch grip", "snatch shrug"],
    "hip thrust": ["hip thrust", "barbell hip thrust"],
    "cycling": ["stationary bike", "stationary bicycle", "cycling"],
    "hiking": ["hiking", "uphill walking", "treadmill walking"],
    "cable crossover": ["cable crossover", "cable cross", "cable fly"],
    "diamond push-up": ["diamond push", "close grip push"],
}

results = {}
for canonical, search_terms in targets.items():
    for term in search_terms:
        for name, url in by_name.items():
            if term in name:
                if canonical not in results:
                    results[canonical] = {"name": name, "url": url}
                break
        if canonical in results:
            break

print(json.dumps(results, indent=2))
