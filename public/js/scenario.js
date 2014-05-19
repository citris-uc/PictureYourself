//http://angular-ui.github.io/bootstrap/

//COLOR PICKER - https://github.com/tkrotoff/jquery-simplecolorpicker

//This flag is used to determine if you want console output or not.
//Don't use console.log, instead use debug("some thing you want to send to console")
var debug_flag = false;
var default_background = '/images/stickers/0-backgrounds/Asproul.png';

$(document).ready(function() {
    /*
    * Gets user selfie
    */
    //also have to refresh page to get changes, why?
    //set pyuserid as global variable to easily access it

    $('#selfie').attr('src', '../users/'+getCookie('pyuserid')+'/1_sticker.png'); //users/ed39cd11-86cd-4faf-7b12-2cd9df6fc706/

    $("#toolicon li").on("click", function(){
        $(this).parent().children().removeClass("active");
        $(this).addClass("active");
    });

    //fixes positioning issue with kineticJS canvas
    $(".kineticjs-content").css('position',''); 
    
    $("#modal").hide();

    // Cavas were color changing occurs. Should always be hidden
    $("#color_change_canvas").hide();
});


/*
* The actual Kinetic Stage where users can move stickers around
* Also loads all the images dynamically
* And stores data about the images on the canvas into the stickers array
*/

function ScenarioCtrl($scope, $resource, $http, $compile, Sticker){
    var stage_width = 800;
    var stage_height = 550;
    
    // flags
    $scope.loading = false;
    $scope.chroma_green = false;

    $scope.image_sources = {};
    $scope.selected_image = null;

    // KineticJS Setup ///////////////////////////////////////////////////////////////

    var stage = new Kinetic.Stage({
        container: 'container',
        width: stage_width,
        height: stage_height
    });

    var layer = new Kinetic.Layer();
    stage.add(layer);

    var con = stage.getContainer();
    var dragSrcEl = null;

    $scope.image_download = 'test.jpg';
    var stickers = []; //will store information about stickers

    $('select[name="colorpicker"]').simplecolorpicker({picker:true}).
        on('change', function(){
            change_color($('select[name="colorpicker"]').val());    
        });



    // Background ///////////////////////////////////////////////////////////////
    
    $scope.backgroundObj = new Image();
    
    var background = new Kinetic.Image({
        image:$scope.backgroundObj,
        x:0,
        y:0,
        width:stage_width,
        height:stage_height
    });

    $scope.backgroundObj.src = default_background;


    $scope.backgroundObj.onload = function(){
        debug("Bacground onload");
        
        layer.add(background);
        background.setZIndex(1);

        layer.draw();
    };

    // Remove sticker tools when background is clicked
    background.on('click', function(){
        debug('background click');
        closeTools();
    });

    // Called when user selects a background
    $scope.background_update = function(e){
        $scope.backgroundObj.src = e.target.src;
    };

    // Grab stickers from server
    $http.get('/stickers/backgrounds').success(
        function(data)
        {
            angular.forEach(data,
                function(source,name)
                {
                    html = "<img src='/" +  source + "' class='background' ng-click=\"background_update($event)\" alt='"+name+"'>";
                    compiledElement = $compile(html)($scope);
                    $("#backgrounds_tab").append(compiledElement);
                });

        }) ;


    // Frames ///////////////////////////////////////////////////////////////

    $scope.frameObj = new Image();

    var frame = new Kinetic.Image({
        image:$scope.frameObj,
        x:0,
        y:0,
        width:stage_width,//$('#container').width(),
        height:stage_height,//$('#container').height()
    });

    layer.add(frame);

    $scope.frameObj.onload = function(){
        debug('frame onload');

        layer.add(frame);
        layer.draw();
    };

    $scope.frame_update = function(e){
        debug('frame update');
        $scope.frameObj.src = e.target.src;
    };


    //TEMPORARY SO WE CAN HAVE IT SAY COMING SOON FOR FRAMES!!!!!!
    
    // $http.get('/stickers/frames').success(
    //     function(data)
    //     {
    //         angular.forEach(data,
    //             function(source,name)
    //             {
    //                 html = "<img src='/" +  source + "' class='frames' ng-click=\"frame_update($event)\" alt='"+name+"'>"
    //                 compiledElement = $compile(html)($scope);
    //                 $("#frames_tab").append(compiledElement)
    //             })

    // }) //success

    $scope.remove_frame = function(){
        debug('remove frame');

        $scope.frameObj.src = "";
        layer.draw();
    };





    // Stickers ///////////////////////////////////////////////////////////////

    var default_category = "shoes_and_pants";
    
    // Grab stickers from server and append them to category
    $http.get('/stickers').success(
        function(data){
            data = angular.fromJson(data);
            $scope.visible = {};
            $scope.stickers = data['stickers'];
            $scope.categories = data['categories'];

            angular.forEach($scope.stickers,

                function(stickers,category){

                    // Category is open on page load if it's the default category
                    $scope.visible[category] = (category == default_category);

                    //create the dynamic html
                    html= "<div id="+category+"_subtab class='subtab_title' "+
                        "ng-click=\"toggle('"+category+"')\">"+$scope.categories[category]+"</div>"+
                        "<div ng-show='visible."+category+"' id='"+category+"_content' class='subtab_content'></div>";
                    
                    //compile it with angular so functions work
                    compiledElement = $compile(html)($scope);
                    $("#sticker_tab").append(compiledElement);
                    
                    //add stickers
                    angular.forEach(stickers,
                        function(sticker){
                            $("#"+category+"_content").
                            append('<img class=\'sticker ' + category + 
                                '\' src="/' + sticker.source + '" name="' + sticker.name +
                                 '" data-chroma_green="' + sticker.chroma_green.toString() +'"/>');


                            if(sticker.chroma_green){
                                $scope.image_sources[sticker.name] = {'fore':sticker.fore_source,
                                                                     'back': sticker.back_source};
                            };

                    });
                });

            $('.sticker').bind('dragstart',function(e){  //!!!!!ALL STICKERS MUST HAVE CLASS 'sticker'
                $scope.dragSrcEl = this;

                // Flag so color change tool is added to sticker
                debug($(this).data('chroma_green'));
                if($(this).data('chroma_green') == true){
                    $scope.chroma_green = true;
                }
                else
                    $scope.chroma_green = false;
            });

    });

    // Toggle sticker category
    $scope.toggle = function(category){
        $scope.visible[category] = !$scope.visible[category];
    };


    // Drag and drop stickers start
    con.addEventListener('dragover',function(e){
        e.preventDefault(); //@important
    });


    // Used to close tools for all stickers
    var closeTools = function(){
        a = $(stage.find('.y, .x, .delete, .rotate'));

        a.each(function(index){
            a[index].setVisible(false);
        });

        $("#modal").hide();

        layer.draw();
    };

    // STAGE ///////////////////////////////////////////////////////////////

    // Add sticker to stage via drop action
    con.addEventListener('drop',function(e){

        //stop Firefox from opening image
        e.preventDefault();

        //this removes the tool circles around all existing stickers when a new one is dropped
        closeTools();

        // Assign a local variable with chroma green flag value
        var has_chroma_green = $scope.chroma_green;

        imageObj = new Image();
        imageObj.src = $scope.dragSrcEl.src;
        
        var imageObjBack = null;

        // If chroma green set background object and foreground object appropriately 
        if (has_chroma_green){
            var sources = $scope.image_sources[$scope.dragSrcEl.name];

            imageObjBack = new Image();
            imageObjBack.src = sources['back'];

            imageObj.src = sources['fore'];

            $scope.selected_background = imageObjBack;
        }

        //get position relative to the container and page
        x = e.pageX - $('#container').offset().left;
        y = e.pageY - $('#container').offset().top;

        // Start size for dropped images. Used in code to set sizes
        var start_size = {"width":120,"height":120};

        // Sticker.new(Image, {'x':,'y':}, {'width':,'height':'}, Kinetic.Layer, Image)
        // Creates a new sticker object from factory in factories.js
        // Returns a dictionary with sticker objects and needed functions.

        var sticker = Sticker.new(imageObj, {'x':x,'y':y}, start_size, layer, imageObjBack);

        $scope.selected_sticker = sticker;
        // ---- TODO ---------------------------------------------------------------
        // Move finished events into factory. 

        sticker.delete_icon.on('click', function(){
            debug('DELETE');

            sticker.group.destroy();
            $scope.selected_background = null;
            $scope.selected_sticker = null;
            $('#modal').hide();

            layer.draw();
         });


        // set horizontal height of image
        sticker.scalerX.on('dragmove touchmove',function(){
            
            var diff = this.getAbsolutePosition().x - sticker.image.getAbsolutePosition().x - sticker.image.getWidth();
            
            sticker.image.setWidth(sticker.image.getWidth() + diff * 2);
            sticker.image.setAbsolutePosition(sticker.image.getAbsolutePosition().x - diff/2, sticker.image.getAbsolutePosition().y);
            
            if(has_chroma_green)
            {
                sticker.imageBack.setWidth(sticker.image.getWidth());
                sticker.imageBack.setAbsolutePosition(sticker.image.getAbsolutePosition().x, sticker.image.getAbsolutePosition().y);
            }

            sticker.reposition();
            layer.draw();
        });


        //set vertical height of image
        sticker.scalerY.on('dragmove touchmove',function(){
            
            var diff = this.getAbsolutePosition().y - sticker.image.getAbsolutePosition().y - sticker.image.getHeight();
            
            sticker.image.setHeight(sticker.image.getHeight() + diff * 2);
            sticker.image.setAbsolutePosition(sticker.image.getAbsolutePosition().x, sticker.image.getAbsolutePosition().y - diff/2);
            
            if(has_chroma_green)
            {
                sticker.imageBack.setHeight(sticker.image.getHeight());
                sticker.imageBack.setAbsolutePosition(sticker.image.getAbsolutePosition().x, sticker.image.getAbsolutePosition().y);
            }

            sticker.reposition();   
            layer.draw();

        });
        
        // ▼▼ BROKEN ROTATE ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

        // var canvasOffset = $("#container").offset();
        // var offsetX = canvasOffset.left;
        // var offsetY = canvasOffset.top;
        // var startX;
        // var startY;

        // sticker.rotate.on('mouseenter', function(e){
        //     startX = parseInt(e.clientX - offsetX);
        //     startY = parseInt(e.clientY - offsetY);
        // });

        // sticker.rotate.on('dragmove touchmove', function(e){ //dragmove
        //     start_position = {"x":sticker.image.getAbsolutePosition().x, "y": sticker.image.getAbsolutePosition().y};
        //     rotate_position = {"x":sticker.image.getAbsolutePosition().x + start_size.width/2,"y": sticker.image.getAbsolutePosition().y + start_size.height/2};

        //     var dx = startX - parseInt(e.clientX - offsetX);
        //     var dy = startY - parseInt(e.clientY - offsetY);
        //     var angle = Math.atan2(dy, dx);
        //     sticker.image.setRotation(angle);

        //     if(has_chroma_green)
        //         sticker.imageBack.setRotation(angle);

        //     layer.draw();
        // });
        
        // ▲▲ BROKEN ROTATE ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


        //---- Color Picker------------------------------------------------------------------------------

        // Used to move color picker with drag
        sticker.group.on('dragmove', function(){
            if(sticker.scalerX.isVisible() && has_chroma_green)
                sticker.move_color();   
        });


        //hide and show resize and scaler
        sticker.image.on('click',function(e){
            if(sticker.scalerX.isVisible()){  //this should be enough to determine if all the other buttons are visible as well
                closeTools();
                $scope.selected_background = null;
                $scope.selected_sticker = null;
            } else{
                closeTools(); //refactor? this is done because this removes all buttons, but the existance of the button is necessary 
                
                $scope.selected_sticker = sticker;  

                if($scope.selected_sticker.previous_color != null)
                    $('select[name="colorpicker"]').simplecolorpicker('selectColor', $scope.selected_sticker.previous_color);   

                if(has_chroma_green){
                    sticker.move_color();
                    $scope.selected_background = imageObjBack;
                }
                sticker.scalerX.setVisible(true);
                sticker.scalerY.setVisible(true);
                sticker.delete_icon.setVisible(true);
                // ▼▼ UNCOMMENT WHEN ROTATE IS COMPELTED ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
                // sticker.rotate.setVisible(true);
                // ▲▲ UNCOMMENT WHEN ROTATE IS COMPELTED ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
            }
            layer.draw();
        });



    }); // End of drop listener


   // TODO do we need to have these in Scenario?

    function email(pyuserid, emails, data){
      var formData = {"pyuserid":pyuserid, "data":data};
      $.ajax({
        url: '/email',
        type: 'POST',
        data: formData,
        success: function(){        
          send_email(pyuserid, emails);
        }
      });
    }

    function send_email(pyuserid, emails){
        
        $scope.loading = true;
        $scope.$apply();

        var formData = {"pyuserid":pyuserid, "emails":emails};
        $.ajax({
        url: '/send_email',
        type: 'POST',
        data: formData,
        success: function(){
            $scope.loading = false;
            $scope.$apply();
          $( "#dialog-confirm-email" ).dialog({
            resizable: false,
            // height:140,
            // width: 70,
            modal: true,
            draggable:false,
            closeOnEscape:false,
            dialogClass: 'email-dialog no-close',
            buttons: {
              "Start over": function() {
                window.location = "/";
              },
              "Continue": function() {
                $( this ).dialog( "close" );
              }
            }
        })
          .position({of:'#container'});
        },
        error: function(){
            $scope.loading = false;
            $scope.$apply();  
        }
        });
    }


    $scope.call_email = function(){
        //first remove any tool circles if they exist
        closeTools();
        stage.draw();

        var emails=prompt("Please enter your friend's email(s)","oski@berkeley.edu, friend@berkeley.edu");
        //check if input is correct
        if(emails !== null) {                      
          debug('calling email');
          //remove spaces to have one long string as argv for python
          emails = emails.replace(/\s+/g, '');        
          debug(emails);
          //change to use scope variable instead
          pyuserid = getCookie('pyuserid');
          stage.toDataURL({
            callback: function(dataUrl) {
                debug('callback');
                //from helpertools
                email(pyuserid, emails, dataUrl);
            }
          }) ;         
        }
    };

    $scope.create_image = function(){
        debug('called');
        $scope.image_download = 'somethingelse.jpg';
        stage.toDataURL({
            mimeType: 'image/jpg',
            quality: 1,
            callback: function(dataUrl) {
                debug('callback');
                var link = document.createElement('a');
                angular.element(link)
                .attr('href', dataUrl)
                .attr('download', 'test.jpg'); // Pretty much only works in chrome
                link.click();
                debug('click?');
            }
        });
    };


    // Update the color of a background image
    // Basic operation:
    // 1 - Draw image on hidden canvas
    // 2 - Export canvas image pixel data to variable
    // 3 - Traverse image pixel and change colors
    // 4 - Put new colored image back on canvas
    // 5 - Export canvas as image and assign to source of background image

    function change_color(color){

        if($scope.selected_sticker)
            $scope.selected_sticker.previous_color = color;

        var canvas = document.getElementById('color_change_canvas');
        var context = canvas.getContext('2d');

        canvas.width = $scope.selected_background.width;
        canvas.height = $scope.selected_background.height;

        // clears canvas 
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.drawImage($scope.selected_background, 0,0, canvas.width, canvas.height);

        var imageX = 0;
        var imageY = 0;
        var imageWidth = $scope.selected_background.width;
        var imageHeight = $scope.selected_background.height;

        var imageData = context.getImageData(imageX, imageY, imageWidth, imageHeight);
        var data = imageData.data;

        // Color picker returns hex, call function in helpertools.js
        // to convert to
        var rgb = hexToRgb(color);

        // iterate over all pixels
        for(var i = 0, n = data.length; i < n; i += 4) {
          data[i] = rgb['r'];
          data[i+1] = rgb['g'];
          data[i+2] = rgb['b'];
        }

        context.putImageData(imageData,0,0);
        $scope.selected_background.onload = null;

        $scope.selected_background.src = canvas.toDataURL("image/png");

        layer.draw();
    }


    

} // End of Scenario Controller




//Used to make it easy to turn on and off console.log
function debug(msg){
    if(debug_flag){
        console.log(msg);
    }
}


