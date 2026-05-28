import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os

CATEGORICAL_COLS = ['device_type', 'brand', 'last_repair_type']
NUMERIC_COLS = ['age_months', 'total_repairs', 'months_since_last_repair', 'total_cost', 'season']


def create_encoders(df):
    encoders = {}
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        le.fit(df[col].astype(str))
        encoders[col] = le
    return encoders


def encode_features(df, encoders):
    df_encoded = df.copy()
    for col in CATEGORICAL_COLS:
        le = encoders[col]
        df_encoded[col + '_encoded'] = le.transform(df_encoded[col].astype(str))
    return df_encoded


def get_feature_columns():
    encoded_cols = [col + '_encoded' for col in CATEGORICAL_COLS]
    return encoded_cols + NUMERIC_COLS


def prepare_features(df, encoders, scaler=None, fit_scaler=False):
    df_encoded = encode_features(df, encoders)
    feature_cols = get_feature_columns()
    X = df_encoded[feature_cols].values

    if fit_scaler:
        scaler = StandardScaler()
        X = scaler.fit_transform(X)
    elif scaler is not None:
        X = scaler.transform(X)

    return X, scaler


def prepare_training_data(csv_path):
    df = pd.read_csv(csv_path)

    encoders = create_encoders(df)
    X, scaler = prepare_features(df, encoders, fit_scaler=True)

    # Target for classification: will device fail soon
    y_class = df['will_fail_soon'].values

    # Target for failure type prediction
    failure_encoder = LabelEncoder()
    y_failure_type = failure_encoder.fit_transform(df['next_failure_type'])

    # Target for probability regression
    y_prob = df['failure_probability'].values

    return X, y_class, y_failure_type, y_prob, encoders, scaler, failure_encoder


def save_artifacts(encoders, scaler, failure_encoder, model_dir='../model'):
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(encoders, os.path.join(model_dir, 'encoders.pkl'))
    joblib.dump(scaler, os.path.join(model_dir, 'scaler.pkl'))
    joblib.dump(failure_encoder, os.path.join(model_dir, 'failure_encoder.pkl'))


def load_artifacts(model_dir='../model'):
    encoders = joblib.load(os.path.join(model_dir, 'encoders.pkl'))
    scaler = joblib.load(os.path.join(model_dir, 'scaler.pkl'))
    failure_encoder = joblib.load(os.path.join(model_dir, 'failure_encoder.pkl'))
    return encoders, scaler, failure_encoder


def prepare_single_device(device_data, encoders, scaler):
    """Prepare a single device record for prediction."""
    df = pd.DataFrame([device_data])

    # Handle unknown categories
    for col in CATEGORICAL_COLS:
        le = encoders[col]
        val = str(df[col].iloc[0])
        if val not in le.classes_:
            # Use the most common class as fallback
            df[col] = le.classes_[0]

    X, _ = prepare_features(df, encoders, scaler=scaler)
    return X
