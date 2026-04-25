from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load the Models
MODELS_DIR = os.path.join(os.path.dirname(__file__), '../model_training/models/')
try:
    rf_model = joblib.load(os.path.join(MODELS_DIR, 'forecasting_model.pkl'))
    kmeans_model = joblib.load(os.path.join(MODELS_DIR, 'usage_cluster_model.pkl'))
    iso_model = joblib.load(os.path.join(MODELS_DIR, 'anomaly_model.pkl'))
    print("SUCCESS: All 3 ML Models Loaded Successfully!")
except Exception as e:
    print(f"FAILED: Failed to load models: {e}")
    rf_model, kmeans_model, iso_model = None, None, None

# Hardcoded LabelEncoder mapping from training
LOCATION_ENCODING = {
    'Main building': 0, 
    'New building': 1, 
    'SLIIT Basement Canteen': 2, 
    'SLIIT Main Gate': 3,
    'Auditorium': 4
}

@app.route('/predict', methods=['POST'])
def predict():
    if not rf_model:
        return jsonify({"error": "Model not loaded"}), 500
    try:
        data = request.json
        hour = data.get('hour', datetime.now().hour)
        day_of_week = data.get('day_of_week', datetime.now().weekday())
        location = data.get('location', 'Unknown')
        current_fill = data.get('current_fill', 0)
        prev_fill = data.get('prev_fill', current_fill)
        
        location_encoded = LOCATION_ENCODING.get(location, 0)
        features = [[hour, day_of_week, location_encoded, current_fill, prev_fill]]
        
        predicted_fill = rf_model.predict(features)[0]
        return jsonify({"predicted_fill": round(predicted_fill, 2)})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/cluster', methods=['POST'])
def cluster():
    if not kmeans_model:
        return jsonify({"error": "Model not loaded"}), 500
    try:
        data = request.json
        fill = data.get('fill_percentage', 0)
        moisture = data.get('moisture_percentage', 0)
        hour = data.get('hour', datetime.now().hour)
        
        # Feature array: ['fill_percentage', 'moisture_percentage', 'hour']
        features = [[fill, moisture, hour]]
        cluster_id = kmeans_model.predict(features)[0]
        
        return jsonify({"cluster_id": int(cluster_id)})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/anomaly', methods=['POST'])
def anomaly():
    if not iso_model:
        return jsonify({"error": "Model not loaded"}), 500
    try:
        data = request.json
        fill = data.get('fill_percentage', 0)
        pir_state = data.get('pir_state', 0)
        hour = data.get('hour', datetime.now().hour)
        
        # Feature array: ['fill_percentage', 'pir_state', 'hour']
        features = [[fill, pir_state, hour]]
        
        # Isolation forest returns -1 for anomaly, 1 for normal
        prediction = iso_model.predict(features)[0]
        is_anomaly = bool(prediction == -1)
        
        return jsonify({"is_anomaly": is_anomaly})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(port=5001, debug=True)
