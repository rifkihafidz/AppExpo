import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';
import * as Permissions from 'expo-permissions';
import { Base64Binary } from './Base64Binary';

export default function App() {
  const BITMAP_DIMENSION = 200;
  const TENSORFLOW_CHANNEL = 3;
  const cameraRef = useRef();
  const [tfReady, setTfReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [status, setStatus] = useState("Preparing Model...")
  const [isLoading, setIsLoading] = useState(true)
  const [presentedShape, setPresentedShape] = useState('');
  const [prediction, setPrediction] = useState({
    "label": "No Results",
    "confidence": {}
  })
  const classList = [
    {
      id: 0,
      name: "Alpukat"
    },
    {
      id: 1,
      name: "Apel"
    },
    {
      id: 2,
      name: "Buah Naga"
    },
    {
      id: 3,
      name: "Jeruk"
    },
    {
      id: 4,
      name: "Lemon"
    },
    {
      id: 5,
      name: "Nanas"
    },
    {
      id: 6,
      name: "Pir"
    },
    {
      id: 7,
      name: "Pisang"
    },
    {
      id: 8,
      name: "Semangka"
    },
    {
      id: 9,
      name: "Tomat"
    },
  ]
  const RESULT_MAPPING = ["Apel", "Buah Naga", "Jeruk", "Lemon", "Nanas", "Pir", "Pisang", "Semangka", "Tomat"];

  useEffect(() => {
    async function startUp() {
      if (!tfReady) {
        console.log("[+] Waiting Tensorflow and Model Ready...")
        setStatus("Load Tensorflow and Model...")
        setIsLoading(true)
        // let { status } = await Permissions.askAsync(Permissions.CAMERA, Permissions.MEDIA_LIBRARY);
        // setHasPermission(status === "granted");
        // console.log("[+] Permission granted.")
        await tf.ready();
        setTfReady(true);
        const modelJSON = require("./model.json");
        const modelWeights = require("./group1-shard.bin");
        global.kerasModel = await tf.loadLayersModel(bundleResourceIO(modelJSON, modelWeights));
        setModelReady(true);
        setIsLoading(false)
        console.log("Tensorflow and Model is Ready.")
      }
      setIsLoading(false)
    }
    startUp();
  }, [tfReady]);

  const getPredictions = async () => {
    console.log("[+] Analysing Photo")
    setStatus("Analysing Photo...")
    setIsLoading(true)
    try {
      if (cameraRef.current) {
        const options = { base64: true, skipProcessing: true };
        let photo = await cameraRef.current.takePictureAsync(options);
        // Resize Image
        let image = await resizeImage(photo.uri, 200, 200);
        console.log("Success Resizing Image.");
        let imageTensor = base64ImageToTensor(image.base64);
        console.log("Success.");
        const prediction = await kerasModel.predict(imageTensor);
        const highestPrediction = prediction.toString().indexOf(
          Math.max.apply(null, prediction),
        );
        setPresentedShape(RESULT_MAPPING[highestPrediction]);
        console.log(RESULT_MAPPING[highestPrediction]);
      }
    } catch (e) {
      console.log("[-] No Camera.", e)
      setIsLoading(false)
    }
    setIsLoading(false)
    console.log("[+] Photo Analysed.")
  }

  async function resizeImage(imageUrl, width, height) {
    const actions = [{
      resize: {
        width,
        height
      },
    }];
    const saveOptions = {
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    };
    const res = await ImageManipulator.manipulateAsync(imageUrl, actions, saveOptions);
    return res;
  }

  function base64ImageToTensor(base64) {
    try {
      const uIntArray = Base64Binary.decode(base64);
      const decodedImage = decodeJpeg(uIntArray, 3);
      return decodedImage.reshape([
        1,
        BITMAP_DIMENSION,
        BITMAP_DIMENSION,
        TENSORFLOW_CHANNEL,
      ]);
    } catch (error) {
      console.log('Could not convert base64 string to tesor', error);
    }
    // const rawImageData = tf.util.encodeString(base64, 'base64');
    // const TO_UINT8ARRAY = true;
    // const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY);
    // const buffer = new Uint8Array(width * height * 3);
    // let offset = 0;
    // for (let i = 0; i < buffer.length; i += 3) {
    //   buffer[i] = data[offset];
    //   buffer[i + 1] = data[offset + 1];
    //   buffer[i + 2] = data[offset + 2];
    //   offset += 4;
    // }
    // const result = tf.tensor3d(buffer, [height, width, 3]);
    // console.log(result);
    // return result;
  }

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ textAlign: 'center' }}>Tensorflow Status: {tfReady ? <Text>Ready</Text> : <Text>Not Ready</Text>}</Text>
        <Text style={{ textAlign: 'center' }}>Model Status: {modelReady ? <Text>Ready</Text> : <Text>Not Ready</Text>}</Text>
      </View>
      <View style={{ width: 300, height: 300 }}>
        <Camera
          style={{ flex: 1 }}
          type={Camera.Constants.Type.back}
          ref={cameraRef}>
        </Camera>
      </View>
      <View style={{ flexDirection: 'row', padding: 5 }}>
        <View style={{ flex: 1, padding: 5 }}>
          <TouchableOpacity onPress={() => { getPredictions() }} style={{ backgroundColor: 'yellow' }}>
            <Text style={{ textAlign: 'center' }}>Predict</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, padding: 5 }}>
          <Text style={{ textAlign: 'center', backgroundColor: 'green' }}>
            <Text>Label</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginTop: 30,
    padding: 10
  },
});
