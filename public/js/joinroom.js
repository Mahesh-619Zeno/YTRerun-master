//go to login page if not logged in




document.addEventListener('DOMContentLoaded', function () {
    console.log("startup...");

    //start the firebase project
    const firebaseConfig = {
        apiKey: "AIzaSyC6Cq8c5jprpZYin5iB_KSAdatFbRPicfk",
        authDomain: "ytbeam.firebaseapp.com",
        databaseURL: "https://ytbeam-default-rtdb.firebaseio.com",
        projectId: "ytbeam",
        storageBucket: "ytbeam.appspot.com",
        messagingSenderId: "161790539788",
        appId: "1:161790539788:web:08effd61c5fb7f58a39629",
        measurementId: "G-KH2TMMZW9Q"
      };
    //if firebase project has not been initialized
    if (!firebase.apps.length) {
        var app = firebase.initializeApp(firebaseConfig);
    }

    //get user info if logged in, otherwise redirect to login page
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            uid = user.uid;
            console.log(uid);
            firebase.analytics(); //This is to estimate billing and i'm not blind on how much the site is being used.
        } else {
            console.log("no user, redirecting to login page...");
            window.location.href = '/login.html?page=joinroom.html';
        }
    });

    var linkinput = document.getElementById("linkinput");
    document.getElementById("linkinput").addEventListener("keyup", function (event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            console.log("enter pressed")
            // Cancel the default action, if needed
            event.preventDefault();
            joinroom();
        }
    });
});

function logout(){
    firebase.auth().signOut();
    window.location.href = "/login.html";
}

function joinroom() {
    let tags = getParams(linkinput.value);
    if (tags.v != undefined) {
        gotoroom(tags.v);
    } else {
        $("#wronglink").css("display", "block");
    }
}

function gotoroom(name) {
    let newurl = '/room.html?v=' + name;
    window.location.href = newurl;
}


var getParams = function (url) {
    var params = {};
    var parser = document.createElement('a');
    parser.href = url;
    var query = parser.search.substring(1);
    var vars = query.split('?').join(', ').split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
};