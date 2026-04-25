import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

os.makedirs('../models', exist_ok=True)

print("Loading Data...")
df = pd.read_csv('../data/sensor_dataset_clean.csv')
df['received_at_iso'] = pd.to_datetime(df['received_at_iso'])
df['hour'] = df['received_at_iso'].dt.hour
df['day_of_week'] = df['received_at_iso'].dt.dayofweek

LOCATION_ENCODING = {
    'Main building': 0, 
    'New building': 1, 
    'SLIIT Basement Canteen': 2, 
    'SLIIT Main Gate': 3,
    'Auditorium': 4
}
# Fallback to 0 if location not in encoding
df['location_encoded'] = df['location'].map(LOCATION_ENCODING).fillna(0).astype(int)

# Previous fill is the fill percentage of the previous row (bfill handles the first row)
df['prev_fill'] = df['fill_percentage'].shift(1).bfill()

# 1. Forecasting Model (Random Forest)
X_reg = df[['hour', 'day_of_week', 'location_encoded', 'fill_percentage', 'prev_fill']].values
y_reg = df['fill_percentage'].shift(-1).bfill().ffill().values

rf_model = RandomForestRegressor(n_estimators=50, random_state=42)
rf_model.fit(X_reg, y_reg)
joblib.dump(rf_model, '../models/forecasting_model.pkl')
print(f"Forecasting Model Trained (Random Forest). R^2 Score: {rf_model.score(X_reg, y_reg):.4f}")

# 2. KMeans Cluster Model
X_cluster = df[['fill_percentage', 'moisture_percentage', 'hour']].values
kmeans_model = KMeans(n_clusters=3, random_state=42, n_init=10)
kmeans_model.fit(X_cluster)
joblib.dump(kmeans_model, '../models/usage_cluster_model.pkl')
print("K-Means Behavior Clustering complete.")

# 3. Anomaly Detection
X_anomaly = df[['fill_percentage', 'pir_state', 'hour']].values
iso_model = IsolationForest(contamination=0.05, random_state=42)
iso_model.fit(X_anomaly)
joblib.dump(iso_model, '../models/anomaly_model.pkl')
print("Isolation Forest Anomaly model saved.")

print("\n✅ All 3 ML Models successfully trained and saved into model_training/models/ folder!")
