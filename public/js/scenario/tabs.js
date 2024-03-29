//Handles change of tab 
debug = true;
function TabsCtrl($scope, $http, $compile){
	$scope.tabs = {'stickers':true,'backgrounds':false,'filters':false,'frames':false};
	
	$scope.show_tab = function(category){
		//console.log("category: " + category)
		angular.forEach($scope.tabs,function(value,tab){
			if(tab == category){
				$scope.tabs[category] = true;
			}
			else{
				$scope.tabs[tab] = false;
			}
			// console.log(tab + ' == ' + category + " is " + (tab == category))
			// console.log('tab: ' + tab + " = " + value)
		});
	};//show_tab
	
}

TabsCtrl.$inject = ['$scope', '$http', '$compile']; //for minifier