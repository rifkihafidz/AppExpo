import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native'

export default function App() {
  const [tfReady, setTfReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    async function startUp() {
      await tf.ready();
      setTfReady(true);
      const modelJSON = require('./model.json');
      const modelWeights = require('./group1-shard.bin');
      await tf.loadLayersModel(bundleResourceIO(modelJSON, modelWeights));
      setModelReady(true);
      console.log('Tensorflow and Model is Ready.')
    }
    startUp();
  })

  return (
    <View style={styles.container}>
      <Text style={{ textAlign: 'center' }}>Tensorflow Status: {tfReady ? <Text>Ready</Text> : <Text>Not Ready</Text>}</Text>
      <Text style={{ textAlign: 'center' }}>Model Status: {modelReady ? <Text>Ready</Text> : <Text>Not Ready</Text>}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
