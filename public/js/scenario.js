function ScenarioCtrl($scope){
	
      	var imageObj = new Image();
		imageObj.src = result;
		
		var stage = new Kinetic.Stage({
        container: 'container',
        width: imageObj.width,
        height: imageObj.height
      	});
		
		var background = new Kinetic.Rect({
			x:0,
			y:0,
			width: imageObj.width,
			height: imageObj.height,
			fillEnabled: false,
			opacity: 1
		});
		
		var selection = new Kinetic.Rect({
			x:0,
			y:0,
			stroke:'yellow',
			strokeWidth: 3,
			fillEnabled: false
		})
		var originalPoint = {x: selection.getX(), y: selection.getY()};

      	var layer = new Kinetic.Layer();
		var down = false;
		
      	imageObj.onload = function() {
        	var yoda = new Kinetic.Image({
          		x: 0,
          		y: 0,
          		image: imageObj,
          		width: imageObj.width,
          		height: imageObj.height
        	});

       	 // add the shape to the layer
	        layer.add(yoda);
			layer.add(background);
			layer.add(selection);

       	 // add the layer to the stage
       	 stage.add(layer);
      	}; // end of imageObj.onload
	
		stage.on('mousedown',function(){
			down = true;
			selection.setX(stage.getMousePosition().x);
			selection.setY(stage.getMousePosition().y);
			x = selection.getX();
			y = selection.getY();
		});
	
		stage.on('mouseup', function(){
		down = false;
	})

	    stage.on('mousemove', function(){
			if (!down) return;

			selection.setWidth(stage.getMousePosition().x - selection.getX());
			selection.setHeight(stage.getMousePosition().y - selection.getY());

			width = selection.getWidth();
			height = selection.getHeight();
			layer.draw();
		});
	}
	
	
}