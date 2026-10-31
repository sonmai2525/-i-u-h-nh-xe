
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: "AIzaSyAbwaghICBP_ESRYjmYHKNUMqT610lrPHo",
  authDomain: "dieu-hanh-xe-3.firebaseapp.com",
  projectId: "dieu-hanh-xe-3",
  storageBucket: "dieu-hanh-xe-3.firebasestorage.app",
  messagingSenderId: "749731528824",
  appId: "1:749731528824:web:d2b388b45ff72df1d16d8d"
});

const messaging = firebase.messaging();
