//import liraries
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  NativeModules,
  FlatList,
  SafeAreaView,
  PermissionsAndroid,
  TouchableHighlight,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import CheckBox from '@react-native-community/checkbox';
const {MLManager} = NativeModules;

// map = {
//   confidenceScore: [
//     0.00007378337613772601, 0.000035501012462191284, 0.000014160801583784632,
//     0.00016799289733171463, 0.01617846079170704, 0.0006088731461204588,
//     0.00011310553236398846, 0.000022681830159854144, 0.00002523266084608622,
//     0.0000468533398816362, 0.0009593436843715608, 0.005772787611931562,
//     0.0021021973807364702, 0.9738134145736694, 0.00006563774513779208,
//   ],
//   maxScore: '0.9738134',
//   maxScoreIndex: '13',
// };

const initState = {
  confidenceScore: [],
  maxScore: '',
  maxScoreIndex: '',
};

// create a component
const App = () => {
  const [uri, setUri] = useState(null);
  const [response, setResponse] = useState(initState);
  const [isSelected, setSelection] = useState(false);
  const labels = {
    0: 'Biryani',
    1: 'Chole-Bhature',
    2: 'Jalebi',
    3: 'Kofta',
    4: 'Naan',
    5: 'Paneer',
    6: 'Pani-Puri',
    7: 'Pav-Bhaji',
    8: 'Vadapav',
    9: 'Dabeli',
    10: 'Dal',
    11: 'Dhokla',
    12: 'Dosa',
    13: 'Kathi',
    14: 'Pakora',
  };

  // useEffect(() => {
  //   const permission = () => {
  //     PermissionsAndroid.request(
  //       PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  //     );
  //   };
  //   permission();
  // }, []);

  const renderFlatList = () => {
    return (
      <FlatList
        style={styles.flatlist}
        data={response.confidenceScore}
        renderItem={({item, index}) => (
          <TouchableHighlight key={index} style={{marginBottom: 5}}>
            <View>
              <Text>{`${labels[index]}: ${item}`}</Text>
            </View>
          </TouchableHighlight>
        )}
        keyExtractor={item => item}
      />
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <Text style={{fontSize: 21, fontWeight: '500'}}>Image Classifier</Text>
      <View
        style={{
          width: 300,
          height: 200,
          justifyContent: 'center',
          alignItems: 'center',
          borderColor: 'black',
          borderWidth: 2,
        }}>
        {uri && <Image style={styles.img} source={{uri: uri}} />}
      </View>
      <View
        style={{
          minHeight: 150,
          maxHeight: 200,
          width: '80%',
          marginTop: 10,
          justifyContent: 'center',
          alignItems: 'center',
          borderColor: 'black',
          borderWidth: 2,
          backgroundColor: '#fff',
        }}>
        <Text>Result</Text>
        <Text>MaxScore: {response.maxScore}</Text>
        {/* <Text>maxScoreIndex: {response.maxScoreIndex}</Text> */}

        <Text style={{fontWeight: 'bold'}}>
          Predicted: {labels[parseInt(response?.maxScoreIndex)]}
        </Text>
        {renderFlatList()}
      </View>
      <View style={styles.checkboxContainer}>
        <CheckBox
          value={isSelected}
          onValueChange={setSelection}
          style={styles.checkbox}
        />
        <Text style={styles.label} onPress={() => setSelection(!isSelected)}>
          To save images to gallery, click here.
        </Text>
      </View>
      <View style={{flexDirection: 'row'}}>
        <View style={{marginHorizontal: 10}}>
          <Button
            title="Take a picture"
            onPress={async () => {
              let options = {
                mediaType: 'photo',
                includeBase64: false,
                saveToPhotos: isSelected,
              };
              if (isSelected) {
                const check = await PermissionsAndroid.check(
                  PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                );
                if (!check) {
                  const grant = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                  );
                  if (!grant) {
                    return;
                  }
                }
              }
              launchCamera(options, result => {
                // console.log(result);
                if (result.assets) {
                  setUri(result?.assets[0]?.uri);
                }
              });
            }}
          />
        </View>
        <View style={{marginHorizontal: 10}}>
          <Button
            title="Select a picture"
            onPress={() => {
              const options = {
                selectionLimit: 0,
                mediaType: 'photo',
                includeBase64: false,
              };

              launchImageLibrary(options, result => {
                console.log(result);
                if (result.assets) {
                  setUri(result?.assets[0]?.uri);
                }
              });
            }}
          />
        </View>
      </View>
      <View style={{margin: 20}}>
        <Button
          title="Predict"
          onPress={() => {
            if (uri == null) {
              console.log('no uri');
              return;
            }

            // console.log(uri);
            MLManager.runModelOnImage(uri, res => {
              if (res.success) {
                setResponse({
                  confidenceScore: res.confidenceScore,
                  maxScore: res.maxScore,
                  maxScoreIndex: res.maxScoreIndex,
                });
                // console.log(res);
                console.log([
                  ...res.confidenceScore,
                  res.maxScore,
                  res.maxScoreIndex,
                ]);
              } else {
                console.log(res.error);
              }
            });
            console.log('predict');
          }}
        />
      </View>
      <View>
        <Button
          title="Clear"
          onPress={() => {
            setResponse(initState);
            setUri(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

// define your styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  flatlist: {
    backgroundColor: 'pink',
    width: '100%',
    paddingVertical: 5,
    paddingHorizontal: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
  },
  checkbox: {
    alignSelf: 'center',
  },
  label: {
    // margin: 8,
    alignSelf: 'center',
  },
});

//make this component available to the app
export default App;
