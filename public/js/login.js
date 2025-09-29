document.addEventListener('DOMContentLoaded', () => {
  // Add any DOM-related initialization here if needed
});

function startFirebase() {
  console.log("Initializing Firebase...");

  const firebaseConfig = {
    apiKey: "AIzaSyC6Cq8c5jprpZYin5iB_KSAdatFbRPicfk",
    authDomain: "ytbeam.firebaseapp.com",
    databaseURL: "https://ytbeam-default-rtdb.firebaseio.com",
    projectId: "ytbeam",
    storageBucket: "ytbeam.appspot.com",
    messagingSenderId: "161790539788",
    appId: "1:161790539788:web:08effd61c5fb7f58a39629"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized.");
  }
}

function getParams(url) {
  const urlObj = new URL(url);
  const params = {};
  for (const [key, value] of urlObj.searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

function redirect() {
  console.log("Redirecting...");
  const params = getParams(window.location.href);

  if (params.v !== undefined) {
    window.location.href = `/room.html?v=${encodeURIComponent(params.v)}`;
  } else if (params.page !== undefined) {
    window.location.href = params.page;
  } else {
    const base = `${window.location.protocol}//${window.location.hostname}`;
    const port = window.location.port ? `:${window.location.port}` : '';
    window.location.replace(`${base}${port}/joinroom.html`);
  }
}

function login() {
  startFirebase();

  firebase.auth().onAuthStateChanged(user => {
    console.log("Auth state changed.");
    if (user) {
      redirect();
    } else {
      console.log("No user authenticated (expected on first login).");
    }
  });

  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
}

function anonLogin() {
  startFirebase();

  firebase.auth().signInAnonymously()
    .then(() => {
      redirect();
    })
    .catch(error => {
      console.error("Anonymous login failed:", error.code, error.message);
    });
}

function logout() {
  startFirebase();

  firebase.auth().signOut()
    .then(() => {
      console.log("Logged out successfully.");
      setTimeout(() => {
        window.location.href = "https://ytbeam-landing.webflow.io";
      }, 1000);
    })
    .catch(error => {
      console.error("Logout failed:", error.code, error.message);
    });
}
