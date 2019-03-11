angular.module('mainApp', [])
.controller('mainCtrl', function($scope,$http) {
  $scope.loading = true;
  $scope.getAllData = function(){
  	$http.get("/admin/get")
  	.then(function(data){
  		var list = data.data.result;
  		for (var i = 0; i < list.length; i++) {
  			list[i]['term'] = $scope.getTerm(list[i])
        list[i]['id'] = Number(list[i]['id']);
  		}
  		$scope.bonds = list;
  		$scope.loading = false;
  	})
  }
  $scope.cleanFields = function(){
		$scope.id = "id";
		$scope.settlement = "2019/2";
		$scope.maturity = "2019/5";
		$scope.coupon = 3;
		$scope.name = "name";
		$scope.price = 101;
		$scope.capital = 100;
		$scope.issuer = "UK Government";
		$scope.frequency = 2;
		$scope.type = 0;
  }
  $scope.init = function(){
  	$scope.cleanFields();
  	$scope.getAllData();
  }
  $scope.deleteBond = function(id){
  	$http.post("/admin/delete", {
  		id: id
  	})
  	.then(function(data){
  		$scope.getAllData();
  	})
  }
  $scope.add = function(id){
  	document.getElementById('cancelBtn').click();
  	$http.post("/admin/create", {
  		data: JSON.stringify({
	  		id: $scope.id,
	  		settlement: $scope.settlement,
	  		maturity: $scope.maturity,
	  		coupon: $scope.coupon,
	  		name: $scope.name,
	  		price: $scope.price,
	  		capital: $scope.capital,
	  		issuer: $scope.issuer,
	  		frequency: $scope.frequency,
	  		type: $scope.type
  		})
  	})
  	.then(function(data){
  		console.log(data);
  		$scope.getAllData();
  	})
  }
  $scope.getTerm = function(bond){
  	var maturity = bond.maturity;
  	var settlement = bond.settlement;
    var maturityFormated = {
      year: Number(maturity.split("/")[0]), 
      month: Number(maturity.split("/")[1])
    }
    var settlementFormated = {
      year: Number(settlement.split("/")[0]), 
      month: Number(settlement.split("/")[1])
    }
    var monthDiff = (maturityFormated.year - settlementFormated.year) * 12 + (maturityFormated.month - settlementFormated.month);
    return monthDiff/12;
  }
});
