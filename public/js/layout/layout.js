// Hamburger drop-down
$(document).ready(function () {
    var click = false;
    var visible = false;
    document.getElementById("dropdown").style.width = (document.getElementById("hamburger").width - parseInt(document.getElementById("dropdown").style.left)).toString + 'px';

    $("#hamburger").hover( function(){
            $('#dropdown').toggle();
    });
});

function LayoutCtrl($scope){
    //Currently unused, but required because LayoutCtrl is defined in the erb
}

LayoutCtrl.$inject = ['$scope'];  //for minifying angular
