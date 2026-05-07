import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-CQ6PEYCUip5McM5lPp07GK7vOGaamIc",

  authDomain: "navik-c4443.firebaseapp.com",

  projectId: "navik-c4443",

  storageBucket: "navik-c4443.firebasestorage.app",

  messagingSenderId: "394338096150",

  appId: "1:394338096150:web:2482d814ce430a7d371137",

  measurementId: "G-006YE7FHJZ",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);