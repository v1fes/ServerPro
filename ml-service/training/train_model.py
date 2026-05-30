import os
import sys
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, mean_absolute_error, mean_squared_error
)

from generate_synthetic_data import generate_synthetic_data
from feature_engineering import prepare_training_data, save_artifacts


def train_models(csv_path=None, model_dir='../model'):
    # Generate data if no csv given
    if csv_path is None:
        print('Generating synthetic data...')
        df = generate_synthetic_data(800)
        csv_path = 'synthetic_repair_data.csv'
        df.to_csv(csv_path, index=False)
        print(f'Saved {len(df)} records to {csv_path}')

    print('Preparing features...')
    X, y_class, y_failure_type, y_prob, encoders, scaler, failure_encoder = prepare_training_data(csv_path)

    # Split data
    X_train, X_test, y_class_train, y_class_test = train_test_split(X, y_class, test_size=0.2, random_state=42)
    _, _, y_ft_train, y_ft_test = train_test_split(X, y_failure_type, test_size=0.2, random_state=42)
    _, _, y_prob_train, y_prob_test = train_test_split(X, y_prob, test_size=0.2, random_state=42)

    # 1. Failure classifier (will it fail soon?)
    print('\n--- Training Failure Classifier ---')
    clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    clf.fit(X_train, y_class_train)
    y_pred_class = clf.predict(X_test)
    print(f'Accuracy:  {accuracy_score(y_class_test, y_pred_class):.4f}')
    print(f'Precision: {precision_score(y_class_test, y_pred_class, zero_division=0):.4f}')
    print(f'Recall:    {recall_score(y_class_test, y_pred_class, zero_division=0):.4f}')
    print(f'F1:        {f1_score(y_class_test, y_pred_class, zero_division=0):.4f}')

    cv_scores = cross_val_score(clf, X, y_class, cv=5)
    print(f'CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})')

    # 2. Failure type classifier
    print('\n--- Training Failure Type Classifier ---')
    ft_clf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    ft_clf.fit(X_train, y_ft_train)
    y_pred_ft = ft_clf.predict(X_test)
    print(f'Accuracy: {accuracy_score(y_ft_test, y_pred_ft):.4f}')
    print('\nClassification Report:')
    target_names = failure_encoder.classes_
    print(classification_report(y_ft_test, y_pred_ft, target_names=target_names, zero_division=0))

    # 3. Probability regressor
    print('\n--- Training Probability Regressor ---')
    reg = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    reg.fit(X_train, y_prob_train)
    y_pred_prob = reg.predict(X_test)
    print(f'MAE:  {mean_absolute_error(y_prob_test, y_pred_prob):.4f}')
    print(f'RMSE: {np.sqrt(mean_squared_error(y_prob_test, y_pred_prob)):.4f}')

    # Feature importances
    feature_names = [
        'device_type', 'brand', 'last_repair_type',
        'age_months', 'total_repairs', 'months_since_last_repair',
        'total_cost', 'season'
    ]
    print('\n--- Feature Importances (Failure Classifier) ---')
    for name, imp in sorted(zip(feature_names, clf.feature_importances_), key=lambda x: -x[1]):
        print(f'  {name}: {imp:.4f}')

    # Save models
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(clf, os.path.join(model_dir, 'failure_classifier.pkl'))
    joblib.dump(ft_clf, os.path.join(model_dir, 'failure_type_classifier.pkl'))
    joblib.dump(reg, os.path.join(model_dir, 'probability_regressor.pkl'))
    save_artifacts(encoders, scaler, failure_encoder, model_dir)

    print(f'\nModels saved to {model_dir}/')
    return clf, ft_clf, reg


if __name__ == '__main__':
    csv = sys.argv[1] if len(sys.argv) > 1 else None
    train_models(csv)
