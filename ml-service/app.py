import os
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')

# Load models and artifacts
failure_clf = None
failure_type_clf = None
probability_reg = None
encoders = None
scaler = None
failure_encoder = None

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
    'touchscreen_failure': 'Поломка тачскрину',
}


def load_models():
    global failure_clf, failure_type_clf, probability_reg, encoders, scaler, failure_encoder
    try:
        failure_clf = joblib.load(os.path.join(MODEL_DIR, 'failure_classifier.pkl'))
        failure_type_clf = joblib.load(os.path.join(MODEL_DIR, 'failure_type_classifier.pkl'))
        probability_reg = joblib.load(os.path.join(MODEL_DIR, 'probability_regressor.pkl'))
        encoders = joblib.load(os.path.join(MODEL_DIR, 'encoders.pkl'))
        scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
        failure_encoder = joblib.load(os.path.join(MODEL_DIR, 'failure_encoder.pkl'))
        print('Models loaded successfully')
    except Exception as e:
        print(f'Warning: Could not load models: {e}')
        print('Run training first: cd training && python train_model.py')


def prepare_input(data):
    """Prepare a single device input for prediction."""
    from training.feature_engineering import prepare_single_device
    normalized = dict(data)
    season_map = {
        'winter': 1,
        'spring': 2,
        'summer': 3,
        'autumn': 4,
    }
    season = normalized.get('season')
    if isinstance(season, str):
        normalized['season'] = season_map.get(season.lower(), 1)
    return prepare_single_device(normalized, encoders, scaler)


@app.route('/health', methods=['GET'])
def health():
    models_loaded = all([failure_clf, failure_type_clf, probability_reg])
    return jsonify({
        'status': 'ok',
        'models_loaded': models_loaded,
    })


@app.route('/predict', methods=['POST'])
def predict():
    if not all([failure_clf, failure_type_clf, probability_reg]):
        return jsonify({'error': 'Models not loaded. Run training first.'}), 503

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required = ['device_type', 'brand', 'age_months', 'total_repairs',
                 'months_since_last_repair', 'total_cost', 'last_repair_type', 'season']
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    try:
        X = prepare_input(data)

        # Predict failure (yes/no)
        will_fail = int(failure_clf.predict(X)[0])
        fail_proba = float(failure_clf.predict_proba(X)[0][1])

        # Predict failure type
        ft_pred = failure_type_clf.predict(X)[0]
        ft_proba = failure_type_clf.predict_proba(X)[0]
        failure_type = failure_encoder.inverse_transform([ft_pred])[0]

        # Top-3 probable failure types
        top_indices = np.argsort(ft_proba)[::-1][:3]
        top_failures = []
        for idx in top_indices:
            ft_name = failure_encoder.inverse_transform([idx])[0]
            top_failures.append({
                'type': ft_name,
                'label': FAILURE_LABELS_UA.get(ft_name, ft_name),
                'probability': round(float(ft_proba[idx]), 3),
            })

        # Predict probability
        prob = float(probability_reg.predict(X)[0])
        prob = max(0.0, min(1.0, prob))

        # Risk level
        if prob > 0.7:
            risk_level = 'high'
        elif prob > 0.4:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        # Recommendations
        recommendations = generate_recommendations(data, failure_type, prob, risk_level)

        return jsonify({
            'prediction': {
                'willFailSoon': bool(will_fail),
                'failureProbability': round(prob, 3),
                'riskLevel': risk_level,
                'predictedFailureType': failure_type,
                'predictedFailureLabel': FAILURE_LABELS_UA.get(failure_type, failure_type),
                'topFailures': top_failures,
                'recommendations': recommendations,
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def generate_recommendations(data, failure_type, prob, risk_level):
    recs = []

    age = data.get('age_months', 0)
    total_repairs = data.get('total_repairs', 0)

    if risk_level == 'high':
        recs.append('Рекомендується профілактичний огляд якнайшвидше')

    if failure_type == 'battery_degradation':
        recs.append('Рекомендується перевірка стану батареї та можлива заміна')
    elif failure_type == 'screen_damage':
        recs.append('Рекомендується використовувати захисне скло та чохол')
    elif failure_type == 'overheating':
        recs.append('Рекомендується очищення системи охолодження')
    elif failure_type == 'charging_port':
        recs.append('Рекомендується перевірка роз\'єму зарядки та використання оригінального зарядного пристрою')
    elif failure_type == 'keyboard_failure':
        recs.append('Рекомендується перевірка клавіатури та захист від потрапляння рідини')
    elif failure_type == 'water_damage':
        recs.append('Рекомендується використання водонепроникного чохла')
    elif failure_type == 'motherboard_failure':
        recs.append('Рекомендується повна діагностика пристрою')

    if age > 36:
        recs.append(f'Пристрою {age} місяців — розгляньте оновлення або заміну')
    if total_repairs >= 3:
        recs.append(f'Пристрій ремонтувався {total_repairs} разів — підвищений ризик нових поломок')

    if risk_level == 'low':
        recs.append('Поточний стан пристрою задовільний, продовжуйте регулярне обслуговування')

    return recs


@app.route('/model-info', methods=['GET'])
def model_info():
    if not failure_clf:
        return jsonify({'error': 'Models not loaded'}), 503

    return jsonify({
        'models': {
            'failureClassifier': {
                'type': 'RandomForestClassifier',
                'n_estimators': failure_clf.n_estimators,
                'max_depth': failure_clf.max_depth,
            },
            'failureTypeClassifier': {
                'type': 'RandomForestClassifier',
                'n_estimators': failure_type_clf.n_estimators,
                'max_depth': failure_type_clf.max_depth,
            },
            'probabilityRegressor': {
                'type': 'RandomForestRegressor',
                'n_estimators': probability_reg.n_estimators,
                'max_depth': probability_reg.max_depth,
            },
        },
        'failureTypes': list(failure_encoder.classes_) if failure_encoder else [],
        'features': [
            'device_type', 'brand', 'last_repair_type',
            'age_months', 'total_repairs', 'months_since_last_repair',
            'total_cost', 'season'
        ],
    })


if __name__ == '__main__':
    load_models()
    port = int(os.environ.get('ML_SERVICE_PORT', 5001))
    print(f'ML Service running on port {port}')
    app.run(host='0.0.0.0', port=port, debug=True)
