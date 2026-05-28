import numpy as np
import pandas as pd
import random
from datetime import datetime, timedelta

random.seed(42)
np.random.seed(42)

DEVICE_TYPES = ['phone', 'laptop', 'tablet']
BRANDS = {
    'phone': ['Apple', 'Samsung', 'Xiaomi'],
    'laptop': ['Apple', 'Lenovo', 'HP', 'Dell', 'ASUS'],
    'tablet': ['Apple', 'Samsung', 'Lenovo'],
}
MODELS = {
    'Apple_phone': ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15'],
    'Samsung_phone': ['Galaxy S21', 'Galaxy S22', 'Galaxy S23', 'Galaxy A34', 'Galaxy A54'],
    'Xiaomi_phone': ['Redmi Note 11', 'Redmi Note 12', 'Poco X5', 'Poco F5', 'Mi 13'],
    'Apple_laptop': ['MacBook Air M1', 'MacBook Air M2', 'MacBook Pro 14'],
    'Lenovo_laptop': ['ThinkPad X1 Carbon', 'IdeaPad 5', 'Legion 5'],
    'HP_laptop': ['Pavilion 15', 'EliteBook 840', 'Omen 16'],
    'Dell_laptop': ['XPS 13', 'Inspiron 15', 'Latitude 5530'],
    'ASUS_laptop': ['ZenBook 14', 'ROG Strix G15', 'VivoBook 15'],
    'Apple_tablet': ['iPad Air 5', 'iPad Pro 11', 'iPad 10'],
    'Samsung_tablet': ['Galaxy Tab S9', 'Galaxy Tab A8', 'Galaxy Tab S8'],
    'Lenovo_tablet': ['Tab P11', 'Tab M10'],
}

FAILURE_TYPES = [
    'screen_damage', 'battery_degradation', 'charging_port',
    'motherboard_failure', 'camera_failure', 'keyboard_failure',
    'overheating', 'speaker_failure', 'data_recovery',
    'water_damage', 'software_issue', 'touchscreen_failure',
]

FAILURE_LABELS_UA = {
    'screen_damage': 'Пошкодження екрану',
    'battery_degradation': 'Деградація батареї',
    'charging_port': 'Проблеми з роз\'ємом зарядки',
    'motherboard_failure': 'Поломка материнської плати',
    'camera_failure': 'Поломка камери',
    'keyboard_failure': 'Поломка клавіатури',
    'overheating': 'Перегрів',
    'speaker_failure': 'Несправність динаміка',
    'data_recovery': 'Втрата даних',
    'water_damage': 'Пошкодження рідиною',
    'software_issue': 'Програмна проблема',
    'touchscreen_failure': 'Poломка тачскрину',
}

# Failure probabilities based on device type
FAILURE_WEIGHTS = {
    'phone': {
        'screen_damage': 0.25, 'battery_degradation': 0.20, 'charging_port': 0.15,
        'water_damage': 0.10, 'camera_failure': 0.08, 'speaker_failure': 0.07,
        'software_issue': 0.05, 'touchscreen_failure': 0.05, 'motherboard_failure': 0.03,
        'overheating': 0.02,
    },
    'laptop': {
        'battery_degradation': 0.18, 'overheating': 0.16, 'keyboard_failure': 0.14,
        'screen_damage': 0.12, 'motherboard_failure': 0.10, 'data_recovery': 0.08,
        'charging_port': 0.07, 'software_issue': 0.06, 'speaker_failure': 0.05,
        'water_damage': 0.04,
    },
    'tablet': {
        'screen_damage': 0.22, 'battery_degradation': 0.20, 'charging_port': 0.15,
        'touchscreen_failure': 0.12, 'software_issue': 0.10, 'speaker_failure': 0.08,
        'camera_failure': 0.05, 'water_damage': 0.05, 'overheating': 0.03,
    },
}


def generate_synthetic_data(n_records=800):
    records = []

    for _ in range(n_records):
        device_type = random.choice(DEVICE_TYPES)
        brand = random.choice(BRANDS[device_type])
        model_key = f'{brand}_{device_type}'
        model = random.choice(MODELS.get(model_key, ['Unknown']))

        age_months = random.randint(1, 72)
        total_repairs = max(0, int(np.random.poisson(age_months / 18)))
        months_since_last_repair = random.randint(0, min(age_months, 36)) if total_repairs > 0 else age_months
        total_cost = round(random.uniform(0, total_repairs * 2500), 2) if total_repairs > 0 else 0

        # Determine failure type based on weights
        weights = FAILURE_WEIGHTS.get(device_type, FAILURE_WEIGHTS['phone'])
        failure_types = list(weights.keys())
        failure_probs = list(weights.values())
        # Normalize
        total_prob = sum(failure_probs)
        failure_probs = [p / total_prob for p in failure_probs]

        last_repair_type = np.random.choice(failure_types, p=failure_probs) if total_repairs > 0 else 'none'

        # Next failure probability (higher with age, more repairs, less time since last)
        base_prob = 0.1
        age_factor = min(age_months / 60, 1.0) * 0.3
        repair_factor = min(total_repairs / 5, 1.0) * 0.25
        recency_factor = max(0, 1 - months_since_last_repair / 24) * 0.2 if total_repairs > 0 else 0
        brand_factor = 0.05 if brand in ['Xiaomi'] else -0.05 if brand in ['Apple'] else 0

        prob = min(max(base_prob + age_factor + repair_factor + recency_factor + brand_factor + random.uniform(-0.1, 0.1), 0.02), 0.98)

        # Next failure type
        next_failure = np.random.choice(failure_types, p=failure_probs)

        # Season
        season = random.choice([1, 2, 3, 4])

        records.append({
            'device_type': device_type,
            'brand': brand,
            'model': model,
            'age_months': age_months,
            'total_repairs': total_repairs,
            'months_since_last_repair': months_since_last_repair,
            'total_cost': total_cost,
            'last_repair_type': last_repair_type,
            'season': season,
            'next_failure_type': next_failure,
            'failure_probability': round(prob, 3),
            'will_fail_soon': 1 if prob > 0.45 else 0,
        })

    return pd.DataFrame(records)


if __name__ == '__main__':
    df = generate_synthetic_data(800)
    df.to_csv('synthetic_repair_data.csv', index=False)
    print(f'Generated {len(df)} records')
    print(f'\nFailure distribution:')
    print(df['next_failure_type'].value_counts())
    print(f'\nWill fail soon: {df["will_fail_soon"].mean():.2%}')
    print(f'\nSample:')
    print(df.head(10))
