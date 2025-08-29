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

if(getParams(window.location.href).v != undefined){
    gotoroom(getParams(window.location.href).v);
}else if(window.location.pathname != "/" && window.location.pathname != ""){
	gotoroom(window.location.pathname.replace('/', ''));
}
else{
	window.location.replace("https://ytrerun.webflow.io");
}

function gotoroom(name){
    let newurl = 'https://ytrerun.web.app/room.html?v=' + name;
    window.location.href = newurl;
}

