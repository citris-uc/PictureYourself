//http://angular-ui.github.io/bootstrap/

//COLOR PICKER - https://github.com/tkrotoff/jquery-simplecolorpicker

//This flag is used to determine if you want console output or not.
//Don't use console.log, instead use debug("some thing you want to send to console")
var debug_flag = true;
var default_background = '/images/stickers/0-backgrounds/ASproul.jpg';

$(document).ready(function() {
    /*
    * Gets user selfie
    */
    //also have to refresh page to get changes, why? probably a caching thing?
    //set pyuserid as global variable to easily access it

    $('#selfie').attr('src', '../users/'+getCookie('pyuserid')+'/1_sticker.png');

    $("#toolicon li").on("click", function(){
        $(this).parent().children().removeClass("active");
        $(this).addClass("active");
    });

    //fixes positioning issue with kineticJS canvas
    $(".kineticjs-content").css('position',''); 
    
    $("#modal").hide();

    // Canvas where color changing occurs. Should always be hidden
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

    var con = stage.container();
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

    // Grab backgrounds from server
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


    // Frames (Currently disabled)///////////////////////////////////////////////////////////////

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
        a = $(stage.find('.y, .x, .delete, .rotate, .background'));

        a.each(function(index){
            a[index].visible(false);
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
                
            var half_width = this.x() - sticker.image.x()
            sticker.image.width(half_width * 2);
            sticker.image.offsetX(half_width);
            
            if(has_chroma_green) {
                sticker.imageBack.width(sticker.image.width());
                sticker.imageBack.offsetX(half_width);
                // sticker.imageBack.setAbsolutePosition({ x: sticker.image.getAbsolutePosition().x, y: sticker.image.getAbsolutePosition().y });
            }

            sticker.reposition();
        });


        //set vertical height of image
        sticker.scalerY.on('dragmove touchmove',function(){
            
            var half_height = this.y() - sticker.image.y();
            sticker.image.height(half_height * 2);
            sticker.image.offsetY(half_height);

            if(has_chroma_green)
            {
                sticker.imageBack.height(sticker.image.height());
                sticker.imageBack.offsetY(half_height);
                // sticker.imageBack.setAbsolutePosition({ x: sticker.image.getAbsolutePosition().x, y: sticker.image.getAbsolutePosition().y });
            }

            sticker.reposition();   
            layer.draw();

        });
        
        var startX;
        var startY;
        var half_width = sticker.image.getWidth()/2
        var half_height = sticker.image.getHeight()/2
        var start_angle, end_angle;
        var start_rotation;

        function angle(rad) {
            if (rad > Math.PI) {
                rad = rad - 2*Math.PI;
            }
            return rad * 180 / Math.PI;
        }

        sticker.rotate.on('dragstart', function(e) {
            startX = stage.getPointerPosition().x - sticker.image.getAbsolutePosition().x;
            startY = stage.getPointerPosition().y - sticker.image.getAbsolutePosition().y;
            start_angle = Math.atan2(startY, startX);
            start_rotation = sticker.image.rotation();
        });

        sticker.rotate.on('dragmove touchmove', function(e){ //dragmove

            endX = stage.getPointerPosition().x - sticker.image.getAbsolutePosition().x;
            endY = stage.getPointerPosition().y - sticker.image.getAbsolutePosition().y;
            end_angle = Math.atan2(endY, endX);
            sticker.group.rotation(start_rotation + angle(end_angle - start_angle));

            sticker.reposition();   
            layer.draw();
        });
        

        //---- Color Picker------------------------------------------------------------------------------

        // Used to move color picker with drag
        sticker.group.on('dragmove', function(){
            if(sticker.scalerX.isVisible() && has_chroma_green)
                sticker.move_color();   
        });


        //hide and show resize and scaler
        sticker.image.on('click',function(e){
            debug("Sticker click");
            if(sticker.scalerX.isVisible()){  //this should be enough to determine if all the other buttons are visible as well
                closeTools();
                $scope.selected_background = null;
                $scope.selected_sticker = null;
            } else{
                closeTools(); //closes all other tools
                
                $scope.selected_sticker = sticker;  

                if($scope.selected_sticker.previous_color != null){
                    $('select[name="colorpicker"]').simplecolorpicker('selectColor', $scope.selected_sticker.previous_color);   
                }

                if(has_chroma_green){
                    debug("Has Chroma green")
                    sticker.move_color();
                    $scope.selected_background = imageObjBack;
                }
                sticker.scalerX.visible(true);
                sticker.scalerY.visible(true);
                sticker.delete_icon.visible(true);
                sticker.rotate.visible(true);
                sticker.background.visible(true);
            }
            layer.draw();
        });



    }); // End of drop listener


   // TODO do we need to have these in Scenario?
   //Probably not, but there dependencies on things defined in this file, such as the stage. 

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
        $scope.image_download = 'somethingelse.jpg';
        stage.toDataURL({
            mimeType: 'image/jpg',
            quality: 1,
            callback: function(dataUrl) {
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
