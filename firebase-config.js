const firebaseConfig = {
  apiKey: "AIzaSyDNTFfVPwVSr5PS9DpkcbwMaEEywGh6WIM",
  authDomain: "dihaadi-app.firebaseapp.com",
  projectId: "dihaadi-app",
  storageBucket: "dihaadi-app.firebasestorage.app",
  messagingSenderId: "1045700852467",
  appId: "1:1045700852467:web:1d9bd9925d20277d5f9586"
};


if (firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY") {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.firestore();
  console.log("Firebase connected — using live Firestore backend.");
} else {
  window.db = null;
  console.log("Firebase not configured yet — running in local demo mode. See firebase-config.js");
}
