
//http://angular-ui.github.io/bootstrap/

window.mynamespace = window.mynamespace || {};
/*
* Tabs
*/

;(function($){
  $.fn.html5jTabs = function(options){
    return this.each(function(index, value){
      var obj = $(this),
      objFirst = obj.eq(index),
      objNotFirst = obj.not(objFirst);

      $("#" +  objNotFirst.attr("data-toggle")).hide();
      $(this).eq(index).addClass("active");

      obj.click(function(evt){

        toggler = "#" + obj.attr("data-toggle");
        togglerRest = $(toggler).parent().find("div");

        togglerRest.hide().removeClass("active");
        $(toggler).show().addClass("active");

        //toggle Active Class on tab buttons
        $(this).parent("div").find("a").removeClass("active");
        $(this).addClass("active");

        return false; //Stop event Bubbling and PreventDefault
      });
    });
  };
}(jQuery));

$(document).ready(function() {
  $(".tabs a").html5jTabs();
});

/*
* Gets user selfie
*/
//hardcoded because I don't know how to get userID
//also have to refresh page to get changes, why?
$('#selfie').attr('src', '../users/a3033004-5490-4df9-7fa7-4119773aaa73/1_sticker.png');


/*
* Background choosing
*/
$('.background').click(function(){
  $('#container').css('background-image', 'url(\'..' + $(this).attr('src') + '\')' );
});


/*
* The actual Kinetic Stage where users can move stickers around
* Also loads all the images dynamically
* And stores data about the images on the canvas into the stickers array
*/

//try to wrap this all in a function somehow? ScenarioCtrl is preventing that from happening
    var stickers = []; //will store information about stickers
    var stage = new Kinetic.Stage({
      container: 'container',
      width: parseInt($('#container').css('width')) ,
      height: parseInt($('#container').css('height'))
    });
    var layer = new Kinetic.Layer();
    stage.add(layer);
    var con = stage.getContainer();
    var dragSrcEl = null;

    function ScenarioCtrl($scope, $resource, $http){
      $http.get('test/stickers').success(function(data){
        angular.forEach(data,function(sticker){
           console.log(sticker)
           if(sticker.match('txt') == null)
              $("#tab1").append('<img class=\'sticker\' src="/' + sticker + '">');
        }); //forEach
        //image
        $('.sticker').bind('dragstart',function(e){  //!!!!!ALL STICKERS MUST HAVE CLASS 'sticker'
         dragSrcEl = this;
        });

    });//success
}
    con.addEventListener('dragover',function(e){
        e.preventDefault(); //@important
    });
    //insert image to stage
    con.addEventListener('drop',function(e){
        var image = new Kinetic.Image({
           draggable : true,
           width: 120,  //this makes the image lower quality for some reason
           height: 120,
           x: e.offsetX,  //TOFIX: drop it at mouse location, instead of top left corner
           y: e.offsetY
        });
        layer.add(image);
        imageObj = new Image();

        imageObj.src = dragSrcEl.src;
        imageObj.onload = function(){
            image.setImage(imageObj)
            layer.draw()
        };

     });

//layer.getChildren()[0].attrs.image.src
//layer.getChildren()[0].attrs.x
$(window).on('click', function(){
  $.each(layer.getChildren(), function(index, value){
    var sticker = {
      src: value.attrs.image.src,
      x: value.attrs.x,
      y: value.attrs.y
    }
    stickers.push(sticker);
  })
  console.log(stickers)
});



//for transformations, maybe use kinetic group to add circles on
//for rotations, i have three points: centre, some predetermined default, and wherever the user's mouse is moved to
//given that information, make two vectors from centre to both points, take a dot product to get the angle



//http://jsfiddle.net/projeqht/ttUd4/

//http://jsfiddle.net/hF36S/1/

//http://www.html5canvastutorials.com/labs/html5-canvas-drag-and-drop-resize-and-invert-images/

//http://stackoverflow.com/questions/8270612/get-element-moz-transformrotate-value-in-jquery (-webkit transform matrix to degree/rad)

//http://jqueryui.com/resizable/



//http://superdit.com/2011/12/04/jquery-plugin-for-rotating-image/

//NONE WORKING ROTATE
// ;(function( $ ) {
//     $.fn.myrotate = function() {
//         var img = this.find("img"); //wtf
//         var imgpos = img.position();
//         var x0, y0;

//         $(window).load(function() {
//             img.removeAttr("width");
//             img.removeAttr("height");

//             x0 = imgpos.left + (img.width() / 2);
//             y0 = imgpos.top + (img.height() / 2);
//         });

//         var x, y, x1, y1, drag = 0;

//         img.css({
//             "cursor": "pointer",
//             "position": "relative"
//         });

//         img.mousemove(function(e) {
//             x1 = e.pageX;
//             y1 = e.pageY;
//             x = x1 - x0;
//             y = y1 - y0;

//             r = 360 - ((180/Math.PI) * Math.atan2(y,x));

//             if (drag == 1) {
//                 img.css("transform","rotate(-"+r+"deg)");
//                 img.css("-moz-transform","rotate(-"+r+"deg)");
//                 img.css("-webkit-transform","rotate(-"+r+"deg)");
//                 img.css("-o-transform","rotate(-"+r+"deg)");
//             }
//         });

//         img.mousedown(function() {
//             if (drag == 0) {
//                 drag = 1;
//                 img.css("-webkit-box-shadow", "0 0 5px #999");
//                 img.css("-moz-box-shadow", "0 0 5px #999");
//                 img.css("box-shadow", "0 0 5px #999");
//             } else {
//                 drag = 0;
//                 img.css("-webkit-box-shadow", "0 0 2px #999");
//                 img.css("-moz-box-shadow", "0 0 2px #999");
//                 img.css("box-shadow", "0 0 2px #999");
//             }
//         });

//         img.mouseleave(function() {
//             drag = 0;
//         });
//     };
// })( jQuery );


// $('.sticker').myrotate();




//THIS IS NOW OBSOLETE
$(window).on('beforeunload', function(){

  var leftArr = []; //don't forget to clear array so that things aren't added more than once when beforeunload is called multiple times
  var topArr = [];
  var srcArr = [];
  var rotArr = [];

  $.each($('#edit .toolboxImage'), function(index, value){
    leftArr.push($(value).css('left'));
  })

  $.each($('#edit .toolboxImage'), function(index, value){
    topArr.push($(value).css('top'));
  })

  $.each($('#edit .toolboxImage'), function(index, value){
    rotArr.push($(value).css('-webkit-transform'));
  })

  $.each($('#edit .toolboxImage .itemImage'), function(index, value){
    srcArr.push($(value).attr('src'));
  })

  //eventually background will be refactored to simply be included with the rest of the images
  var background = $('#edit #diagram').css('background-image')

  var formData = new FormData();
  //var filename = $scope.pyuserid;
  //formData.append("name", name);

  formData.append("leftArr", leftArr);
  formData.append("topArr", topArr);
  formData.append("srcArr", srcArr);
  formData.append("rotArr", rotArr);
  formData.append("background", background);

  var xhr2 = new XMLHttpRequest();
  xhr2.open('POST', '/session');
  xhr2.send(formData);
});







