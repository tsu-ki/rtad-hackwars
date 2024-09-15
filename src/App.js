import React, { useState, useEffect, useCallback } from 'react';
import VideoCapture from './components/VideoCapture';
import HumanModel from './components/HumanModel';
import { loadModel, predictHandSign } from './utils/modelLoader';

function App() {
  const [handSign, setHandSign] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    loadModel()
      .then(() => {
        console.log('TensorFlow model loaded in App.js');
        setIsModelLoaded(true);
      })
      .catch(error => console.error('Error loading TensorFlow model:', error));
  }, []);

  const handleFrame = useCallback((landmarkData) => {
    if (isModelLoaded) {
      const prediction = predictHandSign(landmarkData);
      if (prediction) {
        setHandSign(prediction);
      }
    }
  }, [isModelLoaded]);

  return (
    <div className="App">
      <div style={{ display: 'flex' }}>
        <div style={{ width: '50%' }}>
          <h2>Video Feed</h2>
          <VideoCapture onFrame={handleFrame} />
        </div>
        <div style={{ width: '50%' }}>
          <h2>3D Human Model</h2>
          <HumanModel handSign={handSign} />
        </div>
      </div>
      <div>
        <h3>Detected Hand Sign: {handSign || 'None'}</h3>
      </div>
    </div>
  );
}

export default App;