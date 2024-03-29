// Setups stage (Kinetic.Stage) and layer (Kinetic.Layer)
// returns - { 'stage' : Kinetic.Stage, 'layer' : Kinetic.Layer }
function kineticSetup(stage_width, stage_height){

    var stage = new Kinetic.Stage({
        container: 'container',
        width: stage_width,
        height: stage_height
    });

    var layer = new Kinetic.Layer();
    stage.add(layer);

    return {'stage' : stage, 'layer' : layer};
}

// Creates background object (Kinetic.Image) with image source and events
// returns - Kinetic.Image
function backgroundSetup(closeTools, layer, stage){

    var background_obj = new Image();

    var background = new Kinetic.Image({
        image: background_obj,
        x:0,
        y:0,
        width: stage.getWidth(),
        height: stage.getHeight(),
        id: 'background',
    });

    background_obj.onload = function(){
        layer.add(background);
        background.setZIndex(0);

        layer.draw();
    };

    // Remove sticker tools when background is clicked
    background.on('click', function(){
        closeTools();
    });

    return background;
}

// Update the color of a background image
// Basic operation:
// 1 - Draw image on hidden canvas
// 2 - Export canvas image pixel data to variable
// 3 - Traverse image pixel and change colors
// 4 - Put new colored image back on canvas
// 5 - Export canvas as image and assign to source of background image

function change_color(color, layer, $scope){

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

// Ajax call to server for sticker images
//  creates $scope variables :
//    visible - dictionary of categories and if their stickers are visible
//    stickers - dictionary of stickers by category
//    categories - dictionary of categories id name and display title (e.g. {'shirts_and_shoes' : 'Shirts And Shoes'})
//    sticker_keys - array of category id names used for keys in stickers dictionary. Perserves order
function grabStickerImages($scope, $http, $compile){
  var default_category = "shoes_and_pants";
  // Grab stickers from server and append them to category

  var career = location.search.split("?career=")[1] || getCookie("career");
  $http.get('/careers/' + career + '/stickers').success(function(data) {
    data                = angular.fromJson(data);
    $scope.visible      = {};
    $scope.stickers     = data['stickers'];
    $scope.categories   = data['categories'];
    $scope.sticker_keys = Object.keys($scope.categories);

    angular.forEach($scope.stickers, function(stickers, category){
      // Category is open on page load if it's the default category
      $scope.visible[category] = (category == default_category);

      // Assign background and foreground sources for chroma green stickers
      angular.forEach(stickers, function(sticker){
        if(sticker.chroma_green){
          console.log(sticker)
          $scope.image_sources[sticker.name] = {'fore':sticker.fore_source, 'back': sticker.back_source};
        };
        if(sticker.text){
          $scope.sticker_text[sticker.name] = true;
        };
      });

    });
  });

}

// Changes hex code to rgb values
//  returns - { 'r' : int, 'g' : int, 'b' : int}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};
