import time

import cv2
import mediapipe as mp
import numpy as np
from tensorflow.keras.models import load_model
import os
import tensorflowjs as tfjs

mp_body=mp.solutions.holistic
mp_hands=mp.solutions.hands
mp_draw=mp.solutions.drawing_utils
mp_drawstyle=mp.solutions.drawing_styles

body=mp_body.Holistic(min_detection_confidence=0.8,min_tracking_confidence=0.8)
hands=mp_hands.Hands(max_num_hands=10,min_detection_confidence=0.8,min_tracking_confidence=0.8)

cap=cv2.VideoCapture(0)
drawspecs=mp_draw.DrawingSpec(thickness=1,circle_radius=2,color=[255, 0,0])

# 'biscuits','current'
actions=[

    'again','boy','deaf',
'girl','hard of hearing','hearing','help','how','know','me','meet'

    ]

no_sequence=20

videos=20


while  True:

    for i in actions:
        starttime=time.time()
        v=0
        for j in range(videos):
            seq=[]
            for k in range(no_sequence):

                ret, frame = cap.read()
                framer = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result_pose = body.process(framer)
                framer = cv2.cvtColor(framer, cv2.COLOR_RGB2BGR)
                # cv2.waitKey(3000)
                pose = np.zeros((33,4))
                if result_pose.pose_landmarks:
                    mp_draw.draw_landmarks(framer, result_pose.pose_landmarks, mp_body.POSE_CONNECTIONS, drawspecs,drawspecs)
                    pose = np.array([[l.x, l.y, l.z, l.visibility] for l in result_pose.pose_landmarks.landmark])

                left = np.zeros((21,4))
                if result_pose.left_hand_landmarks:
                    mp_draw.draw_landmarks(framer, result_pose.left_hand_landmarks, mp_body.HAND_CONNECTIONS, drawspecs, drawspecs)
                    left = np.array([[l.x, l.y, l.z, l.visibility] for l in result_pose.left_hand_landmarks.landmark])
                # print(left)

                right = np.zeros((21,4))
                if result_pose.right_hand_landmarks:
                    mp_draw.draw_landmarks(framer, result_pose.right_hand_landmarks, mp_body.HAND_CONNECTIONS, drawspecs, drawspecs)
                    right = np.array([[l.x, l.y, l.z, l.visibility] for l in result_pose.right_hand_landmarks.landmark])
                # print(right)

                if k==0:
                  cv2.putText(framer, f'collecting {i}', org=(10, 30), fontFace=cv2.FONT_HERSHEY_SIMPLEX, fontScale=1,
                            color=(255, 255, 255), thickness=1)
                  cv2.waitKey(2000)
                else :
                    cv2.putText(framer, f'collecting {i} and video no. {j}', org=(10, 30), fontFace=cv2.FONT_HERSHEY_SIMPLEX, fontScale=1,
                                color=(255, 255, 255), thickness=1)

                if not os.path.exists(f"E:/pycharm/venv/data/{i}/{j}"):
                    os.makedirs(f"E:/pycharm/venv/data/{i}/{j}")
                    x = os.path.join(f"E:/pycharm/venv/data/{i}/{j}/{k}.npy")
                    np.save(x, np.concatenate([left, right, pose]))
                else:
                    x = os.path.join(f"E:/pycharm/venv/data/{i}/{j}/{k}.npy")
                    np.save(x, np.concatenate([left, right, pose]))


                cv2.imshow('frame', framer)

                if cv2.waitKey(2) == ord('r'):
                    break

        if starttime-time.time()> 20:
           break

cap.release()
cv2.destroyAllWindows()

