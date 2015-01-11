app.directive('slickSlider',function($timeout){
    return {
        restrict: 'A',
        link: function(scope,element,attrs) {
            $timeout(function() {
                $('.backgrounds_div').slick({
                    centerMode: true,
                    speed: 0,
                    swipeToSlide: true,
                    variableWidth: true,
                    responsive: [
                        {
                            breakpoint: 768,
                            settings: {
                                centerMode: true,
                                centerPadding: '40px',
                                slidesToShow: 3
                            }
                        },
                        {
                            breakpoint: 480,
                            settings: {
                                centerMode: true,
                                centerPadding: '40px',
                                slidesToShow: 1
                            }
                        }
                    ]
                });
            // We need this to be delayed so that slick won't be called until after Angular has 
            // fully finished ng-repeat and the DOM is complete. Otherwise, slick will fail to carousel.
            // Visually, this has the side effect of seeing all the background images in a row first, before
            // slick kicks in. However, the user should never see that since this should be hidden while 
            // the user is taking a selfie
            }, 3000); 
        }
    }
}).controller('BackgroundCtrl', function($scope, $http, $timeout){
    // Grab backgrounds from server
    $http.get('/global_json/backgrounds.json').success(
        function(data){
            $scope.background_images = data;
        }
    );

    $scope.selectBackground = function(){
        $scope.bg = $('.slick-center>img').attr('src');
        $scope.$emit('toggle_scenario', $scope.data, $scope.selfieCount, $scope.bg)
    }

    // Recieved from ViewCtrl
    $scope.$on('send_selfie_to_background', function(event, data, selfieCount){
        $scope.data = data;
        $scope.selfieCount = selfieCount;
    });
});