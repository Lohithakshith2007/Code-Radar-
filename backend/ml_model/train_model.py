"""
Training script for the Code Complexity ML model.
Generates synthetic training data, trains a RandomForest classifier,
and saves the model + scaler to disk.

Run once: python ml_model/train_model.py
"""
import os
import random
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Ensure reproducibility
random.seed(42)
np.random.seed(42)

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "complexity_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

# Feature order must match CodeFeatureExtractor.FEATURE_NAMES
FEATURE_NAMES = [
    "lines_of_code",
    "source_lines",
    "blank_lines",
    "comment_lines",
    "num_functions",
    "num_classes",
    "num_imports",
    "num_if_statements",
    "num_loops",
    "num_try_except",
    "max_nesting_depth",
    "avg_function_length",
]

LABELS = ["Low", "Medium", "High"]


def generate_sample(complexity: str) -> list:
    """Generate a single synthetic training sample for given complexity level."""
    if complexity == "Low":
        loc = random.randint(5, 40)
        sloc = int(loc * random.uniform(0.7, 0.9))
        blank = loc - sloc
        comments = random.randint(0, max(1, loc // 5))
        funcs = random.randint(1, 3)
        classes = random.randint(0, 1)
        imports = random.randint(1, 4)
        ifs = random.randint(0, 3)
        loops = random.randint(0, 2)
        trys = random.randint(0, 1)
        depth = random.randint(1, 2)
        avg_len = round(random.uniform(3, 10), 1)

    elif complexity == "Medium":
        loc = random.randint(30, 120)
        sloc = int(loc * random.uniform(0.65, 0.85))
        blank = loc - sloc
        comments = random.randint(0, max(1, loc // 8))
        funcs = random.randint(2, 8)
        classes = random.randint(0, 3)
        imports = random.randint(2, 8)
        ifs = random.randint(3, 10)
        loops = random.randint(2, 6)
        trys = random.randint(0, 3)
        depth = random.randint(2, 4)
        avg_len = round(random.uniform(8, 25), 1)

    else:  # High
        loc = random.randint(80, 500)
        sloc = int(loc * random.uniform(0.6, 0.85))
        blank = loc - sloc
        comments = random.randint(0, max(1, loc // 10))
        funcs = random.randint(4, 20)
        classes = random.randint(0, 6)
        imports = random.randint(3, 15)
        ifs = random.randint(8, 30)
        loops = random.randint(4, 15)
        trys = random.randint(1, 8)
        depth = random.randint(3, 7)
        avg_len = round(random.uniform(15, 60), 1)

    return [loc, sloc, blank, comments, funcs, classes, imports,
            ifs, loops, trys, depth, avg_len]


def generate_dataset(n_samples=600):
    """Generate balanced synthetic dataset."""
    X = []
    y = []
    samples_per_class = n_samples // 3

    for label in LABELS:
        for _ in range(samples_per_class):
            X.append(generate_sample(label))
            y.append(label)

    return np.array(X), np.array(y)


def train():
    """Train the RandomForest model and save it."""
    print("=" * 50)
    print("Code Radar — ML Model Training")
    print("=" * 50)

    # Generate dataset
    print("\n[1/4] Generating synthetic training data...")
    X, y = generate_dataset(600)
    print(f"  Dataset: {len(X)} samples, {len(FEATURE_NAMES)} features")
    print(f"  Classes: {', '.join(LABELS)}")

    # Split
    print("\n[2/4] Splitting data (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  Train: {len(X_train)} | Test: {len(X_test)}")

    # Scale features
    print("\n[3/4] Training RandomForest classifier...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    accuracy = (y_pred == y_test).mean()
    print(f"  Accuracy: {accuracy:.2%}")
    print(f"\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=LABELS))

    # Feature importance
    print("  Feature Importance:")
    importances = sorted(
        zip(FEATURE_NAMES, model.feature_importances_),
        key=lambda x: x[1],
        reverse=True,
    )
    for name, imp in importances:
        bar = "█" * int(imp * 50)
        print(f"    {name:25s} {imp:.4f} {bar}")

    # Save
    print(f"\n[4/4] Saving model...")
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"  Model: {MODEL_PATH}")
    print(f"  Scaler: {SCALER_PATH}")
    print(f"\n{'=' * 50}")
    print("Training complete!")
    print(f"{'=' * 50}")

    return model, scaler


if __name__ == "__main__":
    train()
