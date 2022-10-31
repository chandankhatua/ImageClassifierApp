package com.imageclassifier;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.imageclassifier.ml.Mymodel;

import org.tensorflow.lite.DataType;
import org.tensorflow.lite.Tensor;
import org.tensorflow.lite.support.common.ops.NormalizeOp;
import org.tensorflow.lite.support.common.ops.QuantizeOp;
import org.tensorflow.lite.support.image.ImageProcessor;
import org.tensorflow.lite.support.image.TensorImage;
import org.tensorflow.lite.support.image.ops.ResizeOp;
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.util.Arrays;

public class MLModule extends ReactContextBaseJavaModule {
    private static final String TAG = "MyTag";

    private ReactApplicationContext reactContext;
    private ByteBuffer byteBuffer;
    MLModule(ReactApplicationContext context) throws IOException {
        super(context);
        reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "MLManager";
    }

    @ReactMethod
    public void run() {
        Log.d(TAG, "run: Callable");
    }

    @ReactMethod
    public void runModelOnImage(final String path, final Callback callback) throws IOException {
        TensorBuffer inputFeature0 = TensorBuffer.createFixedSize(new int[]{1, 224, 224, 3}, DataType.FLOAT32);
        int inputSize = inputFeature0.getShape()[1];
//        int inputSize = 224;
        int inputChannels = inputFeature0.getShape()[3];
        int bytePerChannel = 4;

        InputStream inputStream = new FileInputStream(path.replace("file://", ""));
        Bitmap bitmap = BitmapFactory.decodeStream(inputStream);

        ByteBuffer imgData = ByteBuffer.allocateDirect(1 * inputSize * inputSize * inputChannels * bytePerChannel);
        imgData.order(ByteOrder.nativeOrder());


        int pixel = 0;
        for (int i = 0; i < inputSize; ++i) {
            for (int j = 0; j < inputSize; ++j) {
                int pixelValue = intValues[pixel++];
                if (inputFeature0.getDataType() == DataType.FLOAT32) {
                    imgData.putFloat((((pixelValue >> 16) & 0xFF)  / 127.5F)-1);
                    imgData.putFloat((((pixelValue >> 8) & 0xFF) / 127.5F)-1);
                    imgData.putFloat(((pixelValue & 0xFF) / 127.5F)-1);
                }
            }
        }























        ImageProcessor imageProcessor = new ImageProcessor.Builder()
                .add(new ResizeOp(224, 224, ResizeOp.ResizeMethod.BILINEAR))
//                .add(new NormalizeOp(0, 127.5F))
                .add(new QuantizeOp(-1, 127.5F))
                .build();
//        bitmap = Bitmap.createScaledBitmap(bitmap,224,224,true);
//        Log.d(TAG,"height:" + bitmap.getHeight());
//        Log.d(TAG,"width:" + bitmap.getWidth());

        TensorImage tensorImage = new TensorImage(DataType.FLOAT32);
        tensorImage.load(bitmap);

//        byteBuffer = tensorImage.getBuffer();

        TensorImage tensorProcessImage = imageProcessor.process(tensorImage);
        byteBuffer = tensorProcessImage.getBuffer();
//        int capacity = byteBuffer.capacity();
//        for (int i = 1; i <= capacity / 4; i++) {
//            System.out.print(byteBuffer.getFloat() + " ");
//            Log.d(TAG, String.valueOf(byteBuffer.getFloat()));
//        }
//        byte[] arrr = new byte[byteBuffer.remaining()];
//        byteBuffer.get(arrr);

//        Log.d(TAG,"bytebuffer:" + Arrays.toString(new float[]{byteBuffer.getFloat()}));
//        Log.d(TAG,"width:" + tensorProcessImage.getWidth());

        WritableMap map = Arguments.createMap();
        try {
            Mymodel model = Mymodel.newInstance(reactContext);
            // Creates inputs for reference.
            TensorBuffer inputFeature0 = TensorBuffer.createFixedSize(new int[]{1, 224, 224, 3}, DataType.FLOAT32);
            inputFeature0.loadBuffer(byteBuffer);


            // Runs model inference and gets result.
            Mymodel.Outputs outputs = model.process(inputFeature0);
            TensorBuffer outputFeature0 = outputs.getOutputFeature0AsTensorBuffer();


            WritableArray writableArray = new WritableNativeArray();
            float[] arr = outputFeature0.getFloatArray();
            float max = 0.0f;
            int index = 0;
            for (int i=0; i<arr.length;i++)
            {
                if (arr[i] > max)
                {
                    max = arr[i];
                    index = i;
                }
                writableArray.pushDouble(arr[i]);
            }

            map.putArray("confidenceScore", writableArray);
            map.putString("maxScore", String.valueOf(max));
            map.putString("maxScoreIndex", String.valueOf(index));
            map.putBoolean("success", true);
            // Communicate the result to JS side
            callback.invoke(map);

            // Releases model resources if no longer used.
            model.close();
        } catch (IOException e) {
            // TODO Handle the exception
            map.putString("error", String.valueOf(e));
            map.putBoolean("success", false);
            callback.invoke(map);
            Log.d(TAG, "runModelOnImage: error::"+e);
        }

    }

}
