//console.log("startup");
var templates = [];
let shouldstart = false;
$("#stencils").load("html/templates.html", function () {
    $("#stencils").children().each(function () {
        let name = $(this).attr('id');
        let html = Handlebars.compile($(this)[0].outerHTML);
        templates.push({
            name: name,
            html: html
        });
    });
    shouldstart = true;
});

function temp(inname, data) {
     var ctemp = templates.filter(obj => {
        return obj.name === inname
    });
    return ctemp[0].html(data);
}