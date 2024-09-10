import React, { useState, useEffect, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import { Chart, CategoryScale, LinearScale, BarElement, LineController, LineElement, PointElement, Title } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './App.css';

// Registrar las escalas y componentes necesarios en Chart.js
Chart.register(CategoryScale, LinearScale, BarElement, LineController, LineElement, PointElement, Title);

const ENDPOINT = "http://localhost:5000";

function App() {
  const [quotes, setQuotes] = useState([]);
  const [cashFlowPrediction, setCashFlowPrediction] = useState({ labels: [], data: [] });
  const [quoteReasons, setQuoteReasons] = useState({ labels: [], data: [] });
  const chartRef = useRef(null);

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    // Obtener cotizaciones
    socket.emit('get_quotes');
    socket.on('quotes_data', (data) => {
      setQuotes(data);

      // Contar razones de rechazo de cotizaciones
      const reasonsCount = data.reduce((acc, quote) => {
        acc[quote.reason] = (acc[quote.reason] || 0) + 1;
        return acc;
      }, {});

      setQuoteReasons({
        labels: Object.keys(reasonsCount),
        data: Object.values(reasonsCount),
      });
    });

    // Obtener predicción de flujo de caja
    socket.on('cash_flow_prediction', (data) => {
      setCashFlowPrediction({
        labels: data.dates,
        data: data.predicted_cash_flow,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCashFlowPrediction = () => {
    const socket = socketIOClient(ENDPOINT);
    socket.emit('predict_cash_flow');
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src="http://movidatci.com/wp-content/uploads/2020/08/Logo-Blanco-Movida-TCI.png" alt="Logo" className="App-logo" />
        <h1>Monitoreo y Predicción de Cotizaciones</h1>
      </header>

      {/* Texto explicativo sobre la tabla */}
      <p className="table-explanation">
        A continuación, se muestra un resumen de las cotizaciones realizadas por el equipo de ventas. Estas cotizaciones están clasificadas por su estado (aceptadas o rechazadas), el monto correspondiente, la fecha de creación, y la razón por la cual no fueron aceptadas, si corresponde.
      </p>

      {/* Tabla con scroll para mostrar todas las cotizaciones */}
      <div className="table-container">
        <table className="quote-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Estado</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Razón</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote, index) => (
              <tr key={index}>
                <td>{quote.quote_id}</td>
                <td>{quote.status}</td>
                <td>{quote.amount}</td>
                <td>{new Date(quote.date).toLocaleDateString()}</td> {/* Convertir fecha a formato legible */}
                <td>{quote.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mejorado texto explicativo sobre el gráfico */}
      <div className="chart-intro">
        <h2 className="chart-intro-title">Aumenta tu rentabilidad con nuestras predicciones avanzadas</h2>
        <p className="chart-intro-description">
          Optimiza tu flujo de caja basándote en datos reales de las cotizaciones aceptadas. Anticipa las semanas clave y toma decisiones inteligentes para hacer crecer tu negocio de forma sostenible y eficiente.
        </p>
      </div>

      {/* Título y gráfico de predicción */}
      <h3>Predicción del Flujo de Caja (MXN)</h3>
      <div className="chart-container">
        <Line
          ref={chartRef}
          data={{
            labels: cashFlowPrediction.labels.length > 0 ? cashFlowPrediction.labels : ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
            datasets: [
              {
                label: 'Flujo de Caja (MXN)',
                data: cashFlowPrediction.data.length > 0 ? cashFlowPrediction.data : [1000, 2000, 1500, 3000],
                fill: false,
                borderColor: 'rgba(75,192,192,1)',
                tension: 0.1,
              },
            ],
          }}
          options={{
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Semanas',
                  font: {
                    weight: 'bold',
                  },
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Monto (MXN)',
                  font: {
                    weight: 'bold',
                  },
                },
                ticks: {
                  callback: function(value) {
                    return new Intl.NumberFormat('es-MX').format(value);
                  },
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  font: {
                    weight: 'bold',
                  },
                },
              },
            },
          }}
        />
      </div>

      {/* Gráfico de barras: Cotizaciones rechazadas y razones */}
      <h3>Razones por las que las cotizaciones no fueron aceptadas</h3>
      <div className="chart-container">
        <Bar
          data={{
            labels: quoteReasons.labels,
            datasets: [
              {
                label: 'Número de Cotizaciones',
                data: quoteReasons.data,
                backgroundColor: ['#007bff', '#6c757d', '#ff7f0e'],
              },
            ],
          }}
          options={{
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Razones de Rechazo',
                  font: {
                    weight: 'bold',
                  },
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Cantidad de Cotizaciones',
                  font: {
                    weight: 'bold',
                  },
                },
                ticks: {
                  callback: function(value) {
                    return new Intl.NumberFormat('es-MX').format(value);
                  },
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  font: {
                    weight: 'bold',
                  },
                },
              },
            },
            responsive: true,
            maintainAspectRatio: false,
          }}
        />
      </div>

      {/* Texto explicativo de los gráficos */}
      <div className="chart-intro">
        <h2 className="chart-intro-title">¿Cómo te ayudan estos gráficos?</h2>
        <p className="chart-intro-description">
          Estos gráficos te permiten visualizar de forma clara y directa cómo están funcionando tus cotizaciones y cuáles son los factores que afectan su aceptación. El gráfico de predicción de flujo de caja te proporciona información crítica sobre el futuro de tus finanzas, mientras que el gráfico de razones de rechazo te muestra los motivos detrás de cada oportunidad perdida, ayudándote a tomar acciones correctivas para mejorar la tasa de éxito.
        </p>
      </div>

      {/* Título y CTA */}
      <h2>Descubre más sobre cómo mejorar tu flujo de caja</h2>
      <a href="https://movidatci.com" className="cta-button">Visita movidatci.com</a>
    </div>
  );
}

export default App;
