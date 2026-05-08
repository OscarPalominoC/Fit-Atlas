import json
import os
from stretches_data import stretches_data

def export_stretches():
    # Convert list to dict for frontend optimization
    stretches_dict = { s["name"].lower().replace(" ", "_"): s for s in stretches_data }
    
    # Add an ID to each stretch if not present
    for key, s in stretches_dict.items():
        s["id"] = key
        
    ts_content = f"export const stretches: any = {json.dumps(stretches_dict, indent=2, ensure_ascii=False)};"
    
    target_path = os.path.join("..", "frontend", "src", "data", "stretches.ts")
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(ts_content)
    
    print(f"Successfully exported {len(stretches_data)} stretches to {target_path}")

if __name__ == "__main__":
    export_stretches()
