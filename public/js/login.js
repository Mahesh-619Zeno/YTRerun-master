document.addeventlistener('DOMContentLoaded', function () {
    console.log("DOM loaded");
});


function StartFirebase() {
    console.log("Startup...");

    const FirebaseConfig = {
        apiKey: "AIzaSyC6Cq8c5jprpZYin5iB_KSAdatFbRPicfk",
        authDomain: "ytbeam.firebaseapp.com",
        databaseURL: "https://ytbeam-default-rtdb.firebaseio.com",
        projectId: "ytbeam",
        storageBucket: "ytbeam.appspot.com",
        messagingSenderId: "161790539788",
        appId: "1:161790539788:web:08effd61c5fb7f58a39629"
      };

    if (!firebase.apps.length) {
        app = firebase.initializeApp(FirebaseConfig);
        console.log("startup initialized");
    }
}

function RedirectUser() {
    console.log("Redirecting...");
    let Tags = GetParams(window.location.href);
    console.log(Tags)
    if (Tags.v != undefined) {
        newurl = "/room.html" + '?v=' + Tags.v;
        window.location.href = newurl;
    }
    else if(Tags.page !== undefined){
        window.location.href = Tags.page;
    }
    else {
        newurl = "";
        window.location.replace(window.location.protocol + '//' + window.location.hostname + ':' + location.port + '/joinroom.html');
    }
}

function loginUser() {
    StartFirebase();

    firebase.auth().onAuthStateChanged((User) => {
        console.log("Auth changed");
        if (User) {
            RedirectUser();
        } else {
            console.log("No user. Expected on first load.");
        }
    });

    gauth = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(gauth);
}

function anonymousLogin() {
    StartFirebase();

    firebase.auth().signInAnonymously()
        .then(() => {
            RedirectUser();
        })
        .catch((e) => {
            var errorcode = e.code;
            var errormessage = e.message;
            console.log("Anon login error");
        });
}

function logoutNow() {
    StartFirebase();

    firebase.auth().signOut();
    console.log("Logged out");
    setTimeout(function(){
        window.location.href = "https://ytbeam-landing.webflow.io";
    }, 1000);
}

var GetParams = function (URL) {
	var Params = {};
	var parser = document.createElement('a');
	parser.href = URL;
	var query = parser.search.substring(1);
	var Vars = query.split('?').join(', ').split('&');
	for (var i = 0; i < Vars.length; i++) {
		var Pair = Vars[i].split('=');
		Params[Pair[0]] = decodeURIComponent(Pair[1]);
	}
	return Params;
};
