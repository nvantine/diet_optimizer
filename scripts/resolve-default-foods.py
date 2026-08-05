from __future__ import annotations

import json
import re
import urllib.request
import zipfile
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NUTRIENT_MAP = ROOT / 'src/lib/nutrientMap.js'
OUT = ROOT / 'src/lib/defaultFoods.js'
BASE = 'https://fdc.nal.usda.gov'
DATASETS = [
    ('Foundation', '/fdc-datasets/FoodData_Central_foundation_food_json_2026-04-30.zip', 'FoundationFoods'),
    ('SR Legacy', '/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip', 'SRLegacyFoods'),
]

COSTS = {
    'Chicken breast': 0.92, 'Salmon': 1.75, 'Eggs': 0.37,
    'Greek yogurt': 0.40, 'Cottage cheese': 0.75, 'Oats': 0.30,
    'Brown rice': 0.30, 'Quinoa': 1.00, 'Sweet potato': 0.22,
    'Whole wheat bread': 0.45, 'Black beans': 0.25, 'Lentils': 0.25,
    'Spinach': 0.90, 'Broccoli': 0.33, 'Banana': 0.13,
    'Apple': 0.33, 'Blueberries': 1.50, 'Avocado': 0.60,
    'Almonds': 1.10, 'Olive oil': 1.50, 'Whey protein powder': 3.80,
    'High-fiber granola bar': 2.20,
}

MAX_SERVINGS = {
    'Chicken breast': 2.5, 'Eggs': 3.0, 'Salmon': 2.0,
    'Greek yogurt': 3.0, 'Cottage cheese': 2.5, 'Oats': 1.5,
    'Brown rice': 2.0, 'Quinoa': 1.5, 'Sweet potato': 3.0,
    'Whole wheat bread': 2.0, 'Black beans': 2.5, 'Lentils': 2.5,
    'Spinach': 3.0, 'Broccoli': 3.0, 'Banana': 3.0,
    'Apple': 3.0, 'Blueberries': 2.0, 'Avocado': 2.0,
    'Almonds': 0.75, 'Olive oil': 0.6, 'Whey protein powder': 0.75,
    'High-fiber granola bar': 0.5,
}

TARGETS = [
    {'name': 'Chicken breast', 'fdcId': 2646170, 'category': 'protein'},
    {'name': 'Eggs', 'fdcId': 171287, 'category': 'protein'},
    {'name': 'Salmon', 'fdcId': 2684441, 'category': 'protein'},
    {'name': 'Greek yogurt', 'fdcId': 330137, 'category': 'protein'},
    {'name': 'Cottage cheese', 'fdcId': 328841, 'category': 'protein'},
    {'name': 'Oats', 'fdcId': 2346396, 'category': 'carb'},
    {'name': 'Brown rice', 'fdcId': 169704, 'category': 'carb'},
    {'name': 'Quinoa', 'fdcId': 168917, 'category': 'carb'},
    {'name': 'Sweet potato', 'fdcId': 168483, 'category': 'carb'},
    {'name': 'Whole wheat bread', 'fdcId': 172688, 'category': 'carb'},
    {'name': 'Black beans', 'fdcId': 173735, 'category': 'protein/carb'},
    {'name': 'Lentils', 'fdcId': 172421, 'category': 'protein/carb'},
    {'name': 'Spinach', 'fdcId': 168462, 'category': 'vegetable'},
    {'name': 'Broccoli', 'fdcId': 747447, 'category': 'vegetable'},
    {'name': 'Banana', 'fdcId': 1105314, 'category': 'fruit'},
    {'name': 'Apple', 'fdcId': 1750341, 'category': 'fruit'},
    {'name': 'Blueberries', 'fdcId': 2346411, 'category': 'fruit'},
    {'name': 'Avocado', 'fdcId': 2710824, 'category': 'fat'},
    {'name': 'Almonds', 'fdcId': 2346393, 'category': 'fat'},
    {'name': 'Olive oil', 'fdcId': 171413, 'category': 'fat'},
    {'name': 'Whey protein powder', 'fdcId': 173177, 'category': 'protein'},
    {'name': 'High-fiber granola bar', 'fdcId': 167954, 'category': 'protein/fiber'},
]


def parse_nutrient_ids() -> dict[str, str]:
    text = NUTRIENT_MAP.read_text()
    pairs: dict[str, str] = {}
    for match in re.finditer(r"key: '([^']+)'.*?usdaNutrientIds: \[([^\]]*)\]", text):
        key, ids_text = match.groups()
        for raw_id in re.findall(r'\d+', ids_text):
            pairs[raw_id] = key
    return pairs


def load_foods() -> dict[int, dict]:
    foods: dict[int, dict] = {}
    for source, path, key in DATASETS:
        blob = urllib.request.urlopen(BASE + path, timeout=90).read()
        with zipfile.ZipFile(BytesIO(blob)) as archive:
            data = json.loads(archive.read(archive.namelist()[0]))
        for food in data[key]:
            if not food:
                continue
            food['resolvedDataType'] = food.get('dataType') or source
            foods[int(food['fdcId'])] = food
    return foods


def nutrient_amounts(food: dict, id_to_key: dict[str, str]) -> dict[str, float | None]:
    all_keys = sorted(set(id_to_key.values()))
    nutrients: dict[str, float | None] = {key: None for key in all_keys}
    for item in food.get('foodNutrients', []):
        nutrient = item.get('nutrient') or {}
        nutrient_id = item.get('nutrientId') or nutrient.get('id') or item.get('id')
        key = id_to_key.get(str(nutrient_id))
        if not key:
            continue
        amount = item.get('value', item.get('amount'))
        if amount is not None:
            nutrients[key] = float(amount)
    return nutrients


def main() -> None:
    id_to_key = parse_nutrient_ids()
    foods_by_id = load_foods()
    defaults = []
    for target in TARGETS:
        food = foods_by_id[target['fdcId']]
        nutrients = nutrient_amounts(food, id_to_key)
        calories = nutrients.get('calories')
        assert calories is not None and calories > 0, target
        defaults.append({
            'id': f"whole-food-{food['fdcId']}",
            'name': target['name'],
            'fdcId': food['fdcId'],
            'description': food['description'],
            'category': target['category'],
            'brand': '',
            'dataType': food['resolvedDataType'],
            'unit': 'per 100g',
            'cost': COSTS[target['name']],
            'servingBounds': {'min': 0, 'max': MAX_SERVINGS[target['name']]},
            'nutrients': nutrients,
        })
        print(f"{target['name']}: {food['fdcId']} {food['resolvedDataType']} — {food['description']}")
    content = "// Generated by scripts/resolve-default-foods.py from live USDA FoodData Central downloadable datasets.\n"
    content += "// Foundation foods were preferred; SR Legacy was used as fallback where Foundation had no close staple.\n"
    content += "// The preset is opt-in and editable; it intentionally excludes ultra-palatable snack/dessert defaults.\n"
    content += "// Serving caps use 100g units: vegetables/leafy greens are generous, calorie-dense fats/oils/nuts are tight, and protein sources sit in the middle for realistic high-protein-diet intakes.\n"
    content += "export const WHOLE_FOODS_PRESET = " + json.dumps(defaults, indent=2) + ";\n"
    OUT.write_text(content)
    print(f"Wrote {OUT} with {len(defaults)} foods")


if __name__ == '__main__':
    main()
