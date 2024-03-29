

//Handles getting user image from snapshot, sending image + coords to server, and calling the crop
app.controller('SnapshotCtrl', function($scope, $http, $timeout, $window){
    //create proper login methods etc...
    $('#snapshot_ctrl').fadeIn();
    var mouse = 'up';
    var pyuserid    = getCookie(pyuseridtag);
    var selfieCount = parseInt(getCookie("selfiecount") || 0);
    checkCookie(pyuserid);

    //canvas setup
    var canvas = document.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var video = document.querySelector('video');
    var cropObj; // CropJS object set up in function kinetic()

    $scope.pyuserid = getCookie(pyuseridtag);     // fix - Do we need both this and var pyuserid? i don't think so

    //site setup
    $scope.camera = false;

    // ng-show/ng-hide expressions for which divs are shown
    $scope.show_tos      = false;
    $scope.show_capture  = false;
    $scope.check_face    = false;
    $scope.show_camera   = true;
    $scope.camera_loaded = true;

    // Loading overlay
    $scope.loading = false;

    // Controls disability and visibility of buttons
    $scope.show_buttons = true;
    $scope.cutDisabled = false;
    $scope.webcam_accessed = true; //Disabled when true

    // Controls whether the user has already agreed to the TOS and chosen a background.
    // Once, true, should stay true.
    $scope.has_agreed = false;
    $scope.has_background = false;

    // Controls which snapshot button is shown
    $scope.snapshot_button = {'start':true,'snap_it':false,'cut':false};

    // //KineticJS setup
    var imageObj  = new Image();
    $scope.camera = getUserMedia($scope);

    $scope.snapshot_button.snap_it = true;

    // Button functions

    $scope.capture = function(){
        ctx.drawImage(video, 0, 0);
        //hide camera and show capture
        $scope.show_camera = false;
        $scope.show_capture = true;
        kinetic(canvas.toDataURL('image/png'));

        $scope.snapshot_button.cut = true;
        $scope.snapshot_button.snap_it = false;
        // Turn off webcam. Function defined in webcam.js
        stop_webcam()
        $timeout(function(){
            $('#snapshot_container').popover('show');
        }, 500);
    };

    $scope.upload_webcam = function(){
      if (cropObj.getSelectionRectangle()) {
        // Display loading; will display regardless of success or failure
        // $('.loader').fadeIn();
        $('#snapshot_container').popover('hide');
        $scope.loading = true;
        $scope.cutDisabled = true;
        var name = $scope.pyuserid;
        var formData = {"name":name, "data":canvas.toDataURL('image/png'), "count": selfieCount};
        $http.post('/fileupload', formData).success(function(data){
            $scope.cut();
        }).error(function(){
            $scope.loading = false;
            $scope.cutDisabled = true;
            alert("There was an issue uploading the image.");
        });
      }
    };

    //Call grabcut with coordinates
    $scope.cut = function(){
        var coord = cropObj.getSelectionRectangle().getOpenCVXYWH();
        var formData = {};
        formData['coords'] = coord.x + ' ' + coord.y  + ' ' + coord.width + ' ' + coord.height;
        formData['pyuserid'] = $scope.pyuserid;
        formData['count'] = selfieCount;

        $http.post('/grabcut', formData).success(function(data){
            if (!Date.now) {
                Date.now = function() { return new Date().getTime(); }
            }
            console.log(data)
            $scope.selfie = data + "?" + Date.now();
            $('.check_image').attr('src', data);
            $scope.check();
        })
        .error(function(){
            $scope.loading = false;
            $scope.cutDisabled = true;
            alert ("There was an issue cropping the image.");
        });
    };

    $scope.check = function(data){
        $scope.check_face = true;
        $scope.loading = false;
        $scope.show_capture = false;
        $('#snap_it').attr("disabled", "disabled");
        $scope.snapshot_button = {'start':false,'snap_it':false,'cut':false};
    }

    // Reset snapshot page
    $scope.redo = function(){
      $window.location.href = "/camera";
    }

    $scope.keep = function(){
      selfieCount += 1
      setCookie("selfiecount", selfieCount, 1)
      $window.location.href = "/scenario"
    }

    // Creates the kineticJS environment
    // Should be called by the change of img
    var kinetic = function(result) {
        // Everything below to the imageObj.src line is to flip the saved image, so that it follows
        // the flipped video, which mirrors the user, rather than move in the opposite direction

        // Reuse the canvas to put the old flipped image on
        var canvas = document.getElementById("cam_canvas");
        var ctx = canvas.getContext("2d");
        var image = new Image();
        image.src = result;

        // When the image is loaded
        image.onload = function() {
            // Flip the image and draw it so that we can get the Base64 representation
            ctx.translate(image.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(image, 0, 0);
            // Now set the actual image of the canvas to the flipped image
            imageObj.src = canvas.toDataURL('image/png');

            // This is nested to ensure the image was loaded and flipped before presenting it to the user (Async issues)
            imageObj.onload = function() {
                // CropJS set up
                cropObj = new CropJS({
                    cropEdges: new EdgeList({
                        topY: 160,
                        bottomY: 320,
                        leftX: 213,
                        rightX: 426,
                    }),
                    image: imageObj,
                    imageContainerID: "snapshot_container",
                });
                //snapshot effect
                $('#snapshot_container').addClass('animated fadeInUp');
            }; // end of imageObj.onload
        };
    }; // End of kinetic Function

});//End of new SnapshotCtrl



$(function () {
  $('[data-toggle="popover"]').popover()
})

app.directive("ngFileSelect",function(){
  return {
    link: function($scope,el){

      el.bind("change", function(e){

        $scope.file = (e.srcElement || e.target).files[0];
        $scope.getFile();
      });
    }
  };
});

function debug(msg){
    if(debug_flag){
        console.log(msg);
    }
}
