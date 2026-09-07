import json
import os
import sys
import urllib.request
from datetime import datetime

API_URL = "https://paliatracker.com/api/v1/wants"

HEADERS = {
    "User-Agent": "PaliaCompanionGuide/1.0 (Automated Mobile Guide Worker)"
}

def sync_weekly_wants():
    print(f"[{datetime.utcnow().isoformat()}] Fetching fresh weekly wants from {API_URL}...")
    request = urllib.request.Request(API_URL, headers=HEADERS)

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            if response.status != 200:
                print(f"Error: Upstream server returned HTTP {response.status}", file=sys.stderr)
                return False

            raw_bytes = response.read()
            data = json.loads(raw_bytes.decode("utf-8"))

            villagers_list = []
            source = data.get("villagers", data if isinstance(data, list) else [])

            for v in source:
                name = v.get("name")
                if not name:
                    continue

                location = v.get("loc") or v.get("location") or "Kilima / Bahari"
                
                wants_raw = v.get("wants", [])
                formatted_wants = []
                for w in wants_raw:
                    item_name = w.get("name") or w.get("item") or "Unknown"
                    is_love = bool(w.get("love", False) or str(w.get("type", "")).lower() == "love")
                    formatted_wants.append({
                        "name": item_name,
                        "love": is_love
                    })

                villagers_list.append({
                    "name": name,
                    "loc": location,
                    "wants": formatted_wants
                })

            if len(villagers_list) < 10:
                print("Error: Incomplete villager payload received. Aborting commit to prevent data loss.", file=sys.stderr)
                return False

            payload = {
                "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                "villagers": villagers_list
            }

            output_file = "wants.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)

            print(f"Successfully formatted and wrote {len(villagers_list)} villagers to {output_file}.")
            return True

    except Exception as err:
        print(f"Exception encountered during execution: {err}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if not sync_weekly_wants():
        sys.exit(1)
