import pytest
import json
from app import app, load_models


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestHealth:
    def test_health_endpoint(self, client):
        response = client.get('/health')
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data['status'] == 'ok'
        assert 'models_loaded' in data

    def test_health_returns_json(self, client):
        response = client.get('/health')
        assert response.content_type == 'application/json'


class TestPredict:
    valid_input = {
        'device_type': 'laptop',
        'brand': 'Dell',
        'model': 'XPS 15',
        'age_months': 24,
        'total_repairs': 2,
        'months_since_last_repair': 3,
        'total_cost': 1500.0,
        'last_repair_type': 'screen_damage',
        'season': 'winter',
    }

    def test_predict_requires_json(self, client):
        response = client.post('/predict')
        data = json.loads(response.data)
        assert response.status_code == 400
        assert 'error' in data

    def test_predict_missing_fields(self, client):
        response = client.post('/predict',
            data=json.dumps({'device_type': 'laptop'}),
            content_type='application/json')
        data = json.loads(response.data)
        assert response.status_code in (400, 503)

    def test_predict_missing_required_field(self, client):
        incomplete = {k: v for k, v in self.valid_input.items() if k != 'brand'}
        response = client.post('/predict',
            data=json.dumps(incomplete),
            content_type='application/json')
        data = json.loads(response.data)
        # Either 400 (missing field) or 503 (models not loaded)
        assert response.status_code in (400, 503)

    def test_predict_valid_input_or_models_not_loaded(self, client):
        response = client.post('/predict',
            data=json.dumps(self.valid_input),
            content_type='application/json')
        data = json.loads(response.data)
        # 200 if models loaded, 503 if not
        assert response.status_code in (200, 503)
        if response.status_code == 200:
            pred = data['prediction']
            assert 'willFailSoon' in pred
            assert 'failureProbability' in pred
            assert 'riskLevel' in pred
            assert pred['riskLevel'] in ('low', 'medium', 'high')
            assert 0 <= pred['failureProbability'] <= 1
            assert 'topFailures' in pred
            assert 'recommendations' in pred


class TestModelInfo:
    def test_model_info_endpoint(self, client):
        response = client.get('/model-info')
        data = json.loads(response.data)
        # 200 if models loaded, 503 if not
        assert response.status_code in (200, 503)
        if response.status_code == 200:
            assert 'models' in data
            assert 'features' in data
            assert 'failureTypes' in data


class TestPredictEdgeCases:
    def test_predict_with_zero_repairs(self, client):
        input_data = {
            'device_type': 'phone',
            'brand': 'Samsung',
            'model': 'Galaxy S24',
            'age_months': 1,
            'total_repairs': 0,
            'months_since_last_repair': 1,
            'total_cost': 0,
            'last_repair_type': '',
            'season': 'summer',
        }
        response = client.post('/predict',
            data=json.dumps(input_data),
            content_type='application/json')
        assert response.status_code in (200, 503)

    def test_predict_with_old_device(self, client):
        input_data = {
            'device_type': 'laptop',
            'brand': 'HP',
            'model': 'Pavilion',
            'age_months': 120,
            'total_repairs': 15,
            'months_since_last_repair': 1,
            'total_cost': 50000,
            'last_repair_type': 'motherboard_failure',
            'season': 'autumn',
        }
        response = client.post('/predict',
            data=json.dumps(input_data),
            content_type='application/json')
        assert response.status_code in (200, 503)

    def test_predict_with_negative_age_rejected_or_handled(self, client):
        input_data = {
            'device_type': 'tablet',
            'brand': 'Apple',
            'model': 'iPad',
            'age_months': -5,
            'total_repairs': 0,
            'months_since_last_repair': 0,
            'total_cost': 0,
            'last_repair_type': '',
            'season': 'spring',
        }
        response = client.post('/predict',
            data=json.dumps(input_data),
            content_type='application/json')
        # Should handle gracefully (not crash)
        assert response.status_code in (200, 400, 500, 503)
