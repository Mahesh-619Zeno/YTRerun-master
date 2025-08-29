//global variables, these are defined later in the startup function
let gauth = undefined; //google auth service
let roomref = undefined; //reference to the room in the database
let mesref = undefined; //reference to the room's chatroom in the database
var db = null; //database object
let auth = undefined; //authentication object
let roomid = undefined; //the id of the room also found in the url
let uid = undefined; //the client's firebase uid

let createtime = 0; //epoch time of when the room was created

let player = undefined; //youtube player object

//helper variables
let dbok = false;
let ytok = false;

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

//this is the startup function which starts all procedures
document.addEventListener('DOMContentLoaded', function () {
    console.log("startup...");
    roomid = getParams(window.location.href).v;

    // This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

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
    //initialize all the things...
    auth = firebase.auth();
    gauth = new firebase.auth.GoogleAuthProvider();

    //get user info if logged in, otherwise redirect to login page
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            uid = user.uid;
            photoURL = user.photoURL;
            console.log(uid);
            firebase.analytics(); //This is to estimate billing and i'm not blind on how much the site is being used.
        } else {
            console.log("no user, redirecting to login page...");
            window.location.href = '/login.html?v=' + roomid;
        }
    });

    db = firebase.database();

    roomref = db.ref('rooms/' + roomid);
    mesref = db.ref('messages/' + roomid);
    roomref.once('value', (result) => {
        let room = result.val();
        if (!(result.val() !== null)) {
            console.log("room does not exist");
            //when the room does not exist, create a record and a chatroom for it
            const {
                uid,
                photoURL
            } = auth.currentUser;

            db.ref('rooms/' + roomid).set({
                name: roomid,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                uid: uid,
                photo: photoURL
            });

            let sendername = "anonymous";
            if (!auth.currentUser.isAnonymous) {
                sendername = auth.currentUser.displayName;
            }
            db.ref('messages/' + roomid).push().set({
                uid: uid,
                sender: sendername,
                text: "room created!",
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

            //once the room has been created
            roomref.once('value', (roomresult) => {
                let lroom = roomresult.val();
                attachmethods(lroom);
            });

        } else {
            attachmethods(room);
        }
    });
});

function attachmethods(theroom) {
    console.log("reading room");

    createtime = theroom.createdAt;
    dbok = true; // signal database as ook
    console.log("create: " + createtime);
    onPlayerReady(); //sync the player (if everything is alright)

    mesref.on('child_added', (mresult) => {
        newmessage(mresult);
    });

    mesref.on('child_removed', (mresult => {
        let room = mresult.val();
        console.log('button[key="' + mresult.key + '"]');
        $('div[key="' + mresult.key + '"]').remove();
    }));
}

//when a new message is received, can also be from the client himself
function newmessage(mresult) {
    console.log("new message");
    let message = mresult.val();
    console.log(message.text);

    //random coloring based on uid to differentiate anonymous users
    let color = "white";
    if (message.sender == "anonymous") {
        console.log("ano");
        Math.seedrandom(message.uid);
        color = Math.random() * 360;
    }

    //for appropriate date format
    let date = new Date(message.createdAt);
    let now = new Date();
    let datetime = date.getHours() + ':' + date.getMinutes();
    let dateday = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDay();
    let thisdateday = now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDay();
    console.log(dateday);
    let messagedata = {
        key: mresult.key,
        sender: message.sender,
        text: message.text,
        sendercolor: color
    };
    if (dateday == thisdateday) {
        messagedata.time = datetime;
    } else {
        messagedata.time = dateday + ' ' + datetime;
    }
    if (uid == message.uid) {
        $("#messages").append(temp("dmessagestencil", messagedata));
    } else {
        $("#messages").append(temp("fmessagestencil", messagedata));
    }
}

//to send a new message from the client
function sendmessage(message) {
    //TODO: change security rules for anonymous usernames
    let sendername = "anonymous";
    if (!auth.currentUser.isAnonymous) {
        sendername = auth.currentUser.displayName;
    }

    mesref.push().set({
        uid: uid,
        sender: sendername,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        text: message,
        photo: photoURL
    });
}

//message input logic
var messagei = document.getElementById("messagei");
document.getElementById("messagei").addEventListener("keyup", function (event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        console.log(messagei.value);
        sendmessage(messagei.value);
        messagei.value = "";
    }
});

//setup for the youtube player
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: "100%",
        width: "100%",
        videoId: roomid, // commonroom: n9JCPzNKm7Q  synctest: ucZl6vQ_8Uo   triggers: H0T6a5KKnd4
        events: {
            'onReady': function () {
                ytok = true;
                onPlayerReady();
            },
            'onStateChange': onPlayerStateChange
        }
    });
}

//when everything is initialized, synchonise
function onPlayerReady(event) {
    if (ytok && dbok) {
        //TODO: better sync by waiting for a whole second after room creation
        synchronise();
    }
}


//synchronise and restart when needed (video ending, afer pause by client)
let playing = false;
let prevplaystate = false;
//TODO: better syncing by correcting every 60 seconds or so, requires testing
function onPlayerStateChange(event) {
    if (event === 0) {
        console.log("vid ended");
    }

    if (event.data == YT.PlayerState.PLAYING) {
        playing = true;
    } else if (event.data == YT.PlayerState.PAUSED) {
        playing = false;
    } else if (event.data == YT.PlayerState.ENDED) {
        console.log("restarting...");
        player.playVideo();
        synchronise();
    }

    if (playing == true && prevplaystate == false) {
        synchronise();
    }

    prevplaystate = playing;
}

//synchronisation logic
function synchronise() {
    console.log("duration: " + player.getDuration());
    console.log("duration mils: " + player.getDuration() * 1000);
    let joindelta = new Date().getTime() - createtime;
    console.log("delta: " + joindelta);
    let seektime = joindelta % (player.getDuration() * 1000);
    seektime /= 1000;
    console.log("seek: " + seektime * 60);
    player.seekTo(seektime);
}

//copy the room url to the clipboard
function copyLink() {
    copyTextToClipboard(window.location.href, function () {
        document.getElementById("copytext").innerHTML = "Link copied!";
        setTimeout(function () {
            document.getElementById("copytext").innerHTML = "Copy room link";
        }, 2400);
    });

}

function login() {
    // using the object we will authenticate the user.
    firebase.auth().signInWithPopup(gauth);
}

function logout() {
    firebase.auth().signOut();
}


//thank you stackoverflow
//https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
function copyTextToClipboard(text, callback) {
    var textArea = document.createElement("textarea");

    //
    // *** This styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if the element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a
    // flash, so some of these are just precautions. However in
    // Internet Explorer the element is visible whilst the popup
    // box asking the user for permission for the web page to
    // copy to the clipboard.
    //

    // Place in the top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of the white box if rendered for any reason.
    textArea.style.background = 'transparent';


    textArea.value = text;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
        callback();
    } catch (err) {
        console.log('Oops, unable to copy');
        alert("copying failed, you can copy the link in the address bar. Sorry!")
    }

    document.body.removeChild(textArea);
}
/*
{
    "uid": "b0369780-92f0-405e-beb1-8d8c9a727b82",
    "sender": "anonymous",
    "createdAt": 123456,
    "text": "letest",
    "photo": "https://google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
}

*/