import json

path = r'C:\Users\Oscar\.gemini\antigravity\brain\7a7a395b-0649-435a-9e21-5177c7dfad95\.system_generated\steps\1213\content.md'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
    json_str = content.split('---')[-1].strip()
    data = json.loads(json_str)

BASE = "https://github.com/hasaneyldrm/exercises-dataset/raw/main/"

# Build lookup
by_name = {item['name'].lower(): BASE + item['gif_url'] for item in data}

searches = {
    # All the broken fitnessprogramer/omercotkd URLs need replacement
    "woodchopper": ["cable wood chop", "wood chop", "woodchop", "kneeling wood"],
    "bird dog": ["bird dog", "bird-dog"],
    "toes to bar": ["toes to bar", "toes-to-bar"],
    "plank": ["front plank"],
    "hollow hold": ["hollow hold", "hollow body"],
    "ab wheel rollout": ["ab wheel", "ab roller", "rollout"],
    "snatch grip shrug": ["snatch grip", "snatch shrug"],
    "hip thrust": ["barbell hip thrust", "hip thrust"],
    "cycling": ["stationary bike run", "cycling"],
    "hiking": ["treadmill walk", "hiking", "walking on incline"],
    "cable crossover": ["cable crossover", "cable cross-over"],
    "diamond push-up": ["diamond push-up", "diamond push"],
    "bench press": ["barbell bench press", "bench press"],
    "incline bench press": ["incline barbell", "incline bench"],
    "lateral raise": ["lateral raise", "side lateral"],
    "front raise": ["front raise"],
    "barbell curl": ["barbell curl"],
    "hammer curl": ["hammer curl"],
    "concentration curl": ["concentration curl"],
    "triceps pushdown": ["triceps pushdown", "cable pushdown"],
    "skull crushers": ["skull crush", "ez bar lying"],
    "bench dips": ["bench dip", "tricep dip"],
    "lat pulldown": ["lat pulldown", "latissimus"],
    "dumbbell row": ["dumbbell row", "one arm row"],
    "deadlift": ["barbell deadlift"],
    "superman": ["superman exercise", "superman back"],
    "good morning": ["good morning"],
    "romanian deadlift": ["romanian deadlift"],
    "crunch": ["crunch"],
    "sit-up": ["sit up", "sit-up"],
    "mountain climbers": ["mountain climber"],
    "russian twist": ["russian twist"],
    "bicycle crunch": ["bicycle crunch"],
    "side bend": ["side bend"],
    "heel touches": ["heel touch"],
    "glute bridge": ["glute bridge"],
    "step up": ["step up"],
    "sumo squat": ["sumo squat"],
    "walking lunges": ["walking lunge"],
    "front squat": ["front squat"],
    "goblet squat": ["goblet squat"],
    "hack squat": ["hack squat"],
    "pistol squat": ["pistol squat"],
    "cossack squat": ["cossack squat"],
    "sumo deadlift": ["sumo deadlift"],
    "nordic curl": ["nordic curl", "nordic hamstring"],
    "standing calf raise": ["standing calf raise"],
    "seated calf raise": ["seated calf raise"],
    "single leg calf raise": ["single leg calf"],
    "burpees": ["burpee"],
    "bear crawl": ["bear crawl"],
    "battle ropes": ["battle rope"],
    "running": ["running", "jogging"],
    "jump rope": ["jump rope", "skipping"],
    "high knees": ["high knee"],
    "jumping jacks": ["jumping jack"],
    "box jumps": ["box jump"],
    "medicine ball slams": ["medicine ball slam", "ball slam"],
}

results = {}
for canonical, terms in searches.items():
    for term in terms:
        for name, url in by_name.items():
            if term in name:
                results[canonical] = {"name": name, "url": url}
                break
        if canonical in results:
            break

for k, v in sorted(results.items()):
    print(f'  "{k}": "{v["url"]}",  // {v["name"]}')
