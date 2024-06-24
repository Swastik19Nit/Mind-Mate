import cv2
import numpy as np
from keras.preprocessing.image import img_to_array,load_img
from keras.models import Model, load_model

model = load_model("best_model.h5")

emotion_labels = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'neutral', 5: 'sad', 6: 'surprise'}

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

videoCap = cv2.VideoCapture(0)

while True:
    ret, frame = videoCap.read()
    grey = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        grey,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30,30)
    )

    for (x,y,w,h) in faces:
        face_roi = frame[y:y+h, x:x+w]

        face_img = cv2.resize(face_roi, (224,224))
        face_img_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        face_img_rgb = img_to_array(face_img)/255.0
        face_img_rgb = np.expand_dims(face_img, axis=0)

        pred = np.argmax(model.predict(face_img_rgb))
        emotion_label = emotion_labels[pred]
        cv2.putText(frame, emotion_label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        cv2.rectangle(frame, (x,y), (x+w, y+h), (0,255,0), 2)

    cv2.imshow('Emotion Detection', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

videoCap.release()
cv2.destroyAllWindows()
