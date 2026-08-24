/* ============================================================
   VUL HIER JE EIGEN GEGEVENS IN
   Zie README.md voor de stap-voor-stap uitleg hoe je aan de
   Firebase-gegevens hieronder komt.
   ============================================================ */

window.APP_CONFIG = {
  // Pincode voor de bewerkmodus (mag je zelf veranderen, alleen cijfers)
  editPin: "2378",

  // Hoeveel weken vooruit getoond worden (2 weken per pagina)
  numWeeks: 10,

  // Firebase-configuratie — kopieer dit blokje vanuit je Firebase-project
  // (Project instellingen -> Algemeen -> "SDK setup and configuration" -> Config)
  firebase: {
  apiKey: "AIzaSyAZ9O5Jc35zNCOdog8MmbGRMSStjxYzRjQ",
  authDomain: "kalender-mees.firebaseapp.com",
  projectId: "kalender-mees",
  storageBucket: "kalender-mees.firebasestorage.app",
  messagingSenderId: "501878554276",
  appId: "1:501878554276:web:0707271517e56645993031"
  }
};
