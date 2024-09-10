from flask import Flask
from flask_socketio import SocketIO, emit
import pandas as pd
import random
from sklearn.linear_model import LinearRegression
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Habilitar CORS
socketio = SocketIO(app, cors_allowed_origins="*")

# Generar una base de datos de 100 cotizaciones ficticias
data = pd.DataFrame({
    'quote_id': range(1, 101),
    'status': [random.choice(['accepted', 'rejected']) for _ in range(100)],
    'amount': [random.randint(1000, 5000) for _ in range(100)],
    'date': pd.date_range(start='2023-01-01', periods=100, freq='D'),
    'reason': [random.choice(['price', 'timing', 'competition', 'service']) for _ in range(100)]
})

# Convertir los valores de fecha a strings para ser serializables
data['date'] = data['date'].dt.strftime('%Y-%m-%d')

# Enviar las 100 cotizaciones al frontend
@socketio.on('get_quotes')
def handle_get_quotes():
    quotes_list = data.to_dict(orient='records')
    emit('quotes_data', quotes_list)

# Predicción de flujo de caja basado en cotizaciones aceptadas
@socketio.on('predict_cash_flow')
def handle_predict_cash_flow():
    accepted_quotes = data[data['status'] == 'accepted']
    X = np.array((accepted_quotes['date'] - accepted_quotes['date'].min()).dt.days).reshape(-1, 1)
    y = accepted_quotes['amount']
    model = LinearRegression()
    model.fit(X, y)
    future_dates = pd.date_range(start=accepted_quotes['date'].max(), periods=10, freq='W')
    future_X = np.array((future_dates - accepted_quotes['date'].min()).days).reshape(-1, 1)
    predictions = model.predict(future_X)
    
    result = {
        'dates': future_dates.strftime('%Y-%m-%d').tolist(),
        'predicted_cash_flow': predictions.tolist()
    }
    emit('cash_flow_prediction', result)

if __name__ == '__main__':
    socketio.run(app, debug=True)
