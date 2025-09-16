let gauth = undefined;
let roomref = undefined;
let mesref = undefined;
var db = null;
let auth = undefined;
let roomid = undefined;
let uid = undefined;
let createtime = 0;
let player = undefined;

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

document.addEventListener('DOMContentLoaded', function () {
    console.log("startup...");
    roomid = getParams(window.location.href).v;

    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

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
    if (!firebase.apps.length) {
        var app = firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    gauth = new firebase.auth.GoogleAuthProvider();

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            uid = user.uid;
            photoURL = user.photoURL;
            console.log(uid);
            firebase.analytics();
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
            const { uid, photoURL } = auth.currentUser;

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
    dbok = true;
    console.log("create: " + createtime);
    onPlayerReady();

    mesref.on('child_added', (mresult) => {
        newmessage(mresult);
    });

    mesref.on('child_removed', (mresult => {
        let room = mresult.val();
        console.log('button[key="' + mresult.key + '"]');
        $('div[key="' + mresult.key + '"]').remove();
    }));
}

function newmessage(mresult) {
    console.log("new message");
    let message = mresult.val();
    console.log(message.text);

    let color = "white";
    if (message.sender == "anonymous") {
        console.log("ano");
        Math.seedrandom(message.uid);
        color = Math.random() * 360;
    }

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

function sendmessage(message) {
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

var messagei = document.getElementById("messagei");
document.getElementById("messagei").addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        console.log(messagei.value);
        sendmessage(messagei.value);
        messagei.value = "";
    }
});

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: "100%",
        width: "100%",
        videoId: roomid,
        events: {
            'onReady': function () {
                ytok = true;
                onPlayerReady();
            },
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    if (ytok && dbok) {
        synchronise();
    }
}

let playing = false;
let prevplaystate = false;

function onPlayerStateChange(event) {
    if (event === 0) {
        console.log("vid ended");
    }

    if (event.data == YT.PlayerState.PLAYING) {
        playing = true;
    } else if (event.data == YT.PlayerState.PAUSED) {
        playing = false;
    } else if (event.data == YT.PlayerState.ENDED) {
        console.log("vid ended");
        playNextVideo();
    }

    if (playing == true && prevplaystate == false) {
        synchronise();
    }

    prevplaystate = playing;

    function playNextVideo() {
        roomref.once('value', (result) => {
            let room = result.val();
            if (room && room.playlist && room.playlist.length > 0) {
                let playlist = room.playlist;
                let currentVideoId = player.getVideoData().video_id;
                let currentVideoIndex = playlist.indexOf(currentVideoId);
                let nextVideoIndex = currentVideoIndex + 1;
                if (nextVideoIndex < playlist.length) {
                    let nextVideoId = playlist[nextVideoIndex];
                    player.loadVideoById(nextVideoId);
                } else {
                    player.loadVideoById(playlist[0]);
                }
            }
        });
    }
}

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

function copyLink() {
    copyTextToClipboard(window.location.href, function () {
        document.getElementById("copytext").innerHTML = "Link copied!";
        setTimeout(function () {
            document.getElementById("copytext").innerHTML = "Copy room link";
        }, 2400);
    });
}

function login() {
    firebase.auth().signInWithPopup(gauth);
}

function logout() {
    firebase.auth().signOut();
}

function copyTextToClipboard(text, callback) {
    var textArea = document.createElement("textarea");
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = 0;
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    textArea.value = text;

    document.body.append
}
