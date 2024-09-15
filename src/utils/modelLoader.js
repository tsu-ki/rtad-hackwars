import * as tf from '@tensorflow/tfjs';

let model;
const HAND_SIGNS = ['thumbs_up', 'peace_sign', 'deaf', 'girl', 'hard of hearing', 'hearing', 'help', 'how', 'know', 'me', 'meet'];
const CONFIDENCE_THRESHOLD = 0.3;
const SEQUENCE_LENGTH = 20;

let sequenceBuffer = [];

export async function loadModel() {
  try {
    console.log('Loading TensorFlow.js model...');
    model = await tf.loadLayersModel('/model/model.json');
    console.log('TensorFlow.js model loaded successfully');
    console.log('Model input shape:', model.inputs[0].shape);
    console.log('Model output shape:', model.outputs[0].shape);
    
    // Warmup prediction
    const dummyInput = tf.zeros([1, SEQUENCE_LENGTH, 300]);
    console.log('Dummy input shape:', dummyInput.shape);
    const warmupResult = await model.predict(dummyInput);
    console.log('Warmup prediction result shape:', warmupResult.shape);
    warmupResult.dispose();
    dummyInput.dispose();
    console.log('Warmup prediction completed');

    return model;
  } catch (error) {
    console.error('Error loading TensorFlow.js model:', error);
    throw error;
  }
}

export function predictHandSign(landmarkData) {
  if (!model) {
    console.error('TensorFlow.js model not loaded');
    return null;
  }

  // Flatten the landmark data
  const flattenedData = landmarkData.flat();

  // Ensure we have exactly 300 values (21 landmarks * 3 coordinates)
  if (flattenedData.length !== 300) {
    console.error('Unexpected landmark data length:', flattenedData.length);
    return null;
  }

  // Add the flattened landmark data to the sequence buffer
  sequenceBuffer.push(flattenedData);

  // Keep only the last SEQUENCE_LENGTH frames
  if (sequenceBuffer.length > SEQUENCE_LENGTH) {
    sequenceBuffer = sequenceBuffer.slice(-SEQUENCE_LENGTH);
  }

  console.log('Current sequence buffer length:', sequenceBuffer.length);
  
  // Only predict when we have a full sequence
  if (sequenceBuffer.length < SEQUENCE_LENGTH) {
    return null;
  }

  try {
    const inputTensor = tf.tidy(() => {
      const tensor = tf.tensor3d([sequenceBuffer], [1, SEQUENCE_LENGTH, 300]);
      console.log('Input tensor shape:', tensor.shape);
      return tensor;
    });

    const startTime = performance.now();
    const prediction = model.predict(inputTensor);
    const endTime = performance.now();
    console.log(`Prediction time: ${endTime - startTime} ms`);

    const result = prediction.dataSync();
    console.log('Raw prediction:', result);

    inputTensor.dispose();
    prediction.dispose();

    const maxProbability = Math.max(...result);
    const maxIndex = result.indexOf(maxProbability);

    console.log(`Max probability: ${maxProbability}, Index: ${maxIndex}`);

    if (maxProbability > CONFIDENCE_THRESHOLD) {
      const predictedSign = HAND_SIGNS[maxIndex];
      console.log('Predicted hand sign:', predictedSign, 'with confidence:', maxProbability);
      return predictedSign;
    } else {
      console.log('No confident prediction');
      return null;
    }
  } catch (error) {
    console.error('Error predicting hand sign:', error);
    return null;
  }
}
