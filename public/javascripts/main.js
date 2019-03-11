angular.module('mainApp', [])
.controller('mainCtrl', function($scope, $http) {
  $scope.mode = "list";
  $scope.bond_name = "bond_name"
  $scope.query = "";
  $scope.bond_capital = 100;
  $scope.bond_frequency = 2;
  $scope.resultIRR = 0.1;
  $scope.bond_coupon = 6.5;
  $scope.bond_settlement = 1999;
  $scope.bond_maturity = 2009;
  $scope.bond_price = 103.78;
  $scope.onAnalyzedProduct = {};
  $scope.products = [];
  $scope.loading = true;
  $scope.valueAts = [];
  $scope.marketRate = 0.03;
  $scope.getAnalysisForProduct = function(index) {
    $scope.mode = "analysis";
    $scope.onAnalyzedProduct = $scope.products[index];
    $scope.getValueAtDifferentTimePoint($scope.onAnalyzedProduct['payments'], $scope.marketRate)
  };

  $scope.regressionChartGenerate = function(dataset, elementId){
    var order = 2;
    $http.post("/regression",{data:JSON.stringify(dataset), order: order})
    .then(function(data){
      var weights = data.data.result.equation;
      console.log(data.data.result.string)
      var model_fit = (x) => {
        var y = 0;
        for (var i = 0; i < weights.length; i++) {
          y += (weights[i] * Math.pow(x, order-i))
        }
        return y;
      }
      var items_predicted = [];
      var items = [];
      for (var i = 0; i < dataset.length; i++) {
        var predicted_y = model_fit(dataset[i][0]);
        items.push({x: dataset[i][0], y: dataset[i][1]})
        items_predicted.push({x:dataset[i][0], y:predicted_y})
      }
      items.sort(function(a,b){
        return ((a.x-b.x>0)?-1:1);
      })
      for (var j = 0; j < items[0]['x']*10+10; j++) {
        var predicted_y = model_fit(j/10);
        items_predicted.push({x:j/10, y:predicted_y})
      }
      var pointBackgroundColors = [];
      var pointBackgroundColors2 = [];
      var ctx = document.getElementById(elementId).getContext('2d');
      var regressionChart = new Chart(ctx, {
          type: 'scatter',
          data: {
            datasets: [{
              label: 'Actual',
              data: items,
              pointBackgroundColor: pointBackgroundColors,
              pointBorderColor: []
            }, {
              label: 'Best Fit Line',
              data: items_predicted,
              pointBackgroundColor: pointBackgroundColors2,
              pointBorderColor: []
            }]
          },
          options: {
          }
      });
      for (i = 0; i < items_predicted.length; i++) {
        pointBackgroundColors.push("red");
        pointBackgroundColors2.push("green");
      }
      regressionChart.update();
    })
    // var regression = new jsregression.LinearRegression({
    //    alpha: 0.001,
    //    iterations: 1000,
    //    lambda: 0.0
    // });
    // var model = regression.fit(data);
    // console.log(model);
    // var items = [];
    // var items_predicted = [];
    // for (var i = 0; i < data.length; i++) {
    //   var x = data[i][0]
    //   var actual_y = data[i][1];
    //   var predicted_y = regression.transform(trainingData[i]);
    //   items.push({x: x, y: actual_y});
    //   items_predicted.push({x: x, y: predicted_y});
    // }
    // // for (var j = 0; j < 100; j++) {
    // //   var x = j/10;
    // //   var y = regression.transform([x, x*x, x*x*x]);
    // //   items_predicted.push({x: x, y: y});
    // // }
    // console.log(items, items_predicted)
    // var pointBackgroundColors = [];
    // var pointBackgroundColors2 = [];
    // var ctx = document.getElementById(elementId).getContext('2d');
    // var regressionChart = new Chart(ctx, {
    //     type: 'scatter',
    //     data: {
    //       datasets: [{
    //         label: 'Actual',
    //         data: items,
    //         pointBackgroundColor: pointBackgroundColors,
    //         pointBorderColor: []
    //       }, {
    //         label: 'Best Fit Line',
    //         data: items_predicted,
    //         pointBackgroundColor: pointBackgroundColors2,
    //         pointBorderColor: []
    //       }]
    //     },
    //     options: {
    //     }
    // });
    // for (i = 0; i < regressionChart.data.datasets[0].data.length; i++) {
    //     pointBackgroundColors.push("#90cd8a");
    //   pointBackgroundColors2.push("#f58368");
    // }
    // regressionChart.update();
  }

  // getPayment 
  $scope.getPayments = function getPayments(capital, frequency, coupon, settlement, maturity) {
    var maturityFormated = {
      year: Number(maturity.split("/")[0]), 
      month: Number(maturity.split("/")[1])
    }
    var settlementFormated = {
      year: Number(settlement.split("/")[0]), 
      month: Number(settlement.split("/")[1])
    }
    var monthDiff = (maturityFormated.year - settlementFormated.year) * 12 + (maturityFormated.month - settlementFormated.month);
    if (frequency === 0) {
      return [{
        amount: capital + (coupon/100*capital),
        timePoint: monthDiff/12,
        zeroCoupon: true 
      }]
    }else{
    	if (monthDiff < 1) {
        return [];
      }else{
      	var payments = [];
        var amount;
        for (var month = 1; month <= monthDiff; month++) {
          amount = ( (month%(12/frequency) == 0)? coupon/100*capital: 0);
          if (month === monthDiff) {
            amount += capital;
          }
          if (amount !== 0) {
            payments.push({
              amount: amount,
              timePoint: month/12
            })
          }
        }
      	return payments;
      }
    }
  }

  // IRR
  	// NPV -> net present value
  $scope.IRR = function IRR(payments, price, min, max){
    
  	var guess = (min + max)/2;
    NPV = 0;
    for (var j=0; j < payments.length; j++) {
        NPV += payments[j]['amount'] / Math.pow((1 + guess), payments[j]['timePoint']);
    }
    if (max == min) {
      return 0;
    }
    if (Math.abs(NPV - price) < 0.001) {
      return guess * 100;
    }else if(NPV - price < 0){
      return $scope.IRR(payments, price, min, guess);
    }else if(NPV - price > 0){
      return $scope.IRR(payments, price, guess, max);
    }
  }

  $scope.MacaulayDuration = function duration(payments, yieldRate){
  	var totalAmount = 0;
		for (var i = 0; i < payments.length; i++) {
			totalAmount += payments[i]['amount'] * payments[i]['timePoint']/( Math.pow( (1 + yieldRate), payments[i]['timePoint']) )
		}
		var yieldRateValue = $scope.getValue(payments, yieldRate);
		return totalAmount/yieldRateValue;
  }

  $scope.getValue = function getValue(payments, rate, type) {
  	if (!type) {
  		var type = "discrete_compounding"
  	}
  	var value = 0;
  	if (type == 'discrete_compounding') { 
	  	for (var i = 0; i < payments.length; i++) {
	  		value += payments[i]['amount'] * Math.pow((1 + rate), payments[i]['timePoint']);
	  	}
  	}else if (type == 'discrete_discounting') { 
      for (var i = 0; i < payments.length; i++) {
        value += payments[i]['amount'] / Math.pow((1 + rate), payments[i]['timePoint']);
      }
    }else if(type == 'continuous_compounding'){ 
	  	for (var i = 0; i < payments.length; i++) {
	  		value += payments[i]['amount'] / Math.pow(Math.E, rate * 1 * payments[i]['timePoint']);
	  	}
  	}else if(type == 'continuous_discounting'){ 
      for (var i = 0; i < payments.length; i++) {
        value += payments[i]['amount'] / Math.pow(Math.E, rate * -1 * payments[i]['timePoint']);
      }
    }
  	return value;
  }

  // get analysis //change//
  $scope.getAnalysis = function(productIndex){
    var product = $scope.products[productIndex]
    var capital = Number(product['capital']);
    var frequency = Number(product['frequency']);
    var coupon = Number(product['coupon']);
    if (product.type === "1") {
      coupon += ($scope.marketRate*100);
    }
    var settlement = product['settlement'];
    var maturity = product['maturity'];
    var price = Number(product['price']);
    var payments = $scope.getPayments(capital, frequency, coupon, settlement, maturity);
  	var analysis = {};
    analysis.term = payments[payments.length-1].timePoint;
    analysis.resultIRR = round_to_decimal_places($scope.IRR(payments, price,-1,1));
  	analysis.resultValue = round_to_decimal_places($scope.getValue(payments, $scope.marketRate/100));
  	analysis.discrete_compounding = round_to_decimal_places($scope.getValue(payments, $scope.marketRate/100, "discrete_compounding"));
    analysis.discrete_discounting = round_to_decimal_places($scope.getValue(payments, $scope.marketRate/100, "discrete_discounting"));
    analysis.continuous_compounding = round_to_decimal_places($scope.getValue(payments, $scope.marketRate/100, "continuous_compounding"));
    analysis.continuous_discounting = round_to_decimal_places($scope.getValue(payments, $scope.marketRate/100, "continuous_discounting"));
  	analysis.resultDuration = round_to_decimal_places($scope.MacaulayDuration(payments, analysis.resultIRR /100));
    if (payments.length === 1 && payments[0]['zeroCoupon']) {
      analysis.resultSpotRate = $scope.getSpotRate(price, payments[0]['amount'], payments[0]['timePoint'], -10, 10);
    }
    product['payments'] = payments;
    product['analysis'] = analysis;
    $scope.products[productIndex] = product;
  }

  $scope.getValueAtDifferentTimePoint = function(payments, rate){
    console.log(payments)
    $scope.valueAts =[];
    var data = []
    data.push({x: 0, y: $scope.getValue(payments, rate)})
    for (var i = 0; i < payments.length-1; i++) {
      data.push({x:payments[i]['timePoint'], y: round_to_decimal_places($scope.resaleValue(payments,rate,payments[i]['timePoint']),4)});
    }
    $scope.valueAts = data;
    // console.log(payments, rate, data)
    $scope.createChart(data,'valueAtChart',"Value at different time point");
  }

  $scope.resaleValue = function valueAt(payments, rate, timePointAt) {
    var value = 0;
    for (var i = 0; i < payments.length; i++) {
      if (payments[i].timePoint > timePointAt){
        value += payments[i]['amount'] / Math.pow((1 + rate), payments[i]['timePoint']-timePointAt);
      }
    }
    return value
  }

  $scope.createChart = function(data, elementId, label) {
  	var labels = data.map(t => t.x);
  	var ctx = document.getElementById(elementId).getContext('2d');
		var myChart = new Chart(ctx, {
		    type: 'line',
		    data: {
		        labels: labels,
		        datasets: [{
		            label: label,
		            data: data,
		            backgroundColor: [
		                "rgba(76, 182, 172, 0.4)"
		            ],
		            borderColor: [
		                "rgb(76, 182, 172)"
		            ],
		            borderWidth: 1
		        }]
		    },
		    options: {
		        scales: {
		            yAxes: [{
		                ticks: {
		                    beginAtZero:true
		                }
		            }]
		        }
		    }
		});
  }

  // init 
  $scope.appInit = function(){
    $scope.getDataFromDB(()=>{
      $scope.createYiledCurveWithMacaulayDuration()
      $scope.bootstrappingYiledCurve()
    });
  }

  $scope.bootstrappingYiledCurve = function(){
    var list = $scope.products;
    var spotRates = [];
    var productToBeCalculated = [];
    for (var i = 0; i < list.length; i++) {
      if(list[i]['type'] === "2"){
        spotRates.push({
          spotRate: list[i].analysis.resultSpotRate,
          timePoint: list[i].payments[0].timePoint
        })
      }else if(list[i]['type'] === "0" && list[i]['analysis']['term'] % 0.5 === 0 && list[i]['analysis']['term'] <= 5){
        productToBeCalculated.push(list[i])
      }
    }
    productToBeCalculated = productToBeCalculated.filter(product=>product.analysis.term > 0.5 * spotRates.length)
    productToBeCalculated.sort((a,b)=>{
      return ((a.analysis.term - b.analysis.term > 0)?1:-1)
    });
    spotRates.sort((a,b)=>{
      return ((a.timePoint - b.timePoint > 0)?1:-1)
    })
    spotRates = $scope.generateSpotRates(spotRates,productToBeCalculated);
    var regressionData = [];
    for (var j = 0; j < spotRates.length; j++) {
      regressionData.push([spotRates[j].timePoint, spotRates[j].spotRate]);
    }
    $scope.regressionChartGenerate(regressionData,"regressionChartBootstrapping")
  }

  $scope.generateSpotRates = function(spotRates,productToBeCalculated){
    // console.log(productToBeCalculated);
    var newSpotRate;
    for (var i = 0; i < productToBeCalculated.length; i++) {
      newSpotRate = $scope.bootstrapSpotRate(spotRates,productToBeCalculated[i],-10,10)
      spotRates.push({
        spotRate: newSpotRate,
        timePoint: productToBeCalculated[i].analysis.term
      })
    }
    return spotRates;
  }

  $scope.bootstrapSpotRate = function(spotRates, product, min, max){
    var price = Number(product.price);
    var guess = (min + max)/2
    var guessPrice = 0;
    var payments = product.payments;
    for (var i = 0; i < payments.length; i++) {
      if (i < payments.length-1) {
        guessPrice += payments[i].amount/Math.pow(1 + spotRates[i].spotRate/2, payments[i].timePoint*2);
      }else{
        guessPrice += payments[i].amount/Math.pow(1 + guess/2, payments[i].timePoint*2);
      }
    } 
    if(Math.abs(guessPrice - price) < 0.001){
      return guess;
    }else if(guessPrice - price > 0){
      return $scope.bootstrapSpotRate(spotRates, product, guess, max);
    }else{
      return $scope.bootstrapSpotRate(spotRates, product, min, guess);
    }
  }


  $scope.getSpotRate = function(price, amount, timePoint, min, max){
    var guess = (min + max)/2
    var guessPrice = amount/Math.pow(1 + guess/2, timePoint*2);
    if(Math.abs(guessPrice - price) < 0.001){
      return guess;
    }else if(guessPrice - price > 0){
      return $scope.getSpotRate(price, amount, timePoint, guess, max)
    }else{
      return $scope.getSpotRate(price, amount, timePoint, min, guess)
    }
  }

  $scope.createYiledCurveWithMacaulayDuration = function(){
    var list = $scope.products;
    for (var i = 0; i < $scope.products.length; i++) {
      $scope.getAnalysis(i);
    }
    var fixedCouponBondList = $scope.products.filter(product => product.type === "0");
    var indexLinkedBondList = $scope.products.filter(product => product.type === "1");
    var dataForRegression = [];
    for (var i = 0; i < fixedCouponBondList.length; i++) {
      dataForRegression.push([fixedCouponBondList[i].analysis.resultDuration,fixedCouponBondList[i].analysis.resultIRR])
    }
    $scope.regressionChartGenerate(dataForRegression,"regressionChartFixed");
    var dataForRegression = [];
    for (var i = 0; i < indexLinkedBondList.length; i++) {
      dataForRegression.push([indexLinkedBondList[i].analysis.resultDuration,indexLinkedBondList[i].analysis.resultIRR])
    }
    $scope.regressionChartGenerate(dataForRegression,"regressionChartIndexLinked");
  }

  $scope.getDataFromDB = function(cb){
    $http.get("/admin/get")
    .then(function(data){
      $scope.products = data.data.result;
      $scope.loading = false;
      return cb()
    })
  }

});

function round_to_decimal_places(value, decimal_places) {
	if (!decimal_places) {
		var decimal_places = 2;
	}
	return Math.round( value * Math.pow(10, decimal_places) ) / Math.pow(10, decimal_places);
}



// 1. The values of bonds using discounted cash flows, under different interest
// rates and index values at future time points. Both discrete and continuous
// compounding/discounting should be available as options.
// ---> done

// 2. The internal rate of return of bonds, using suitable numerical estimation
// routines.
// ---> done

// 3. The Macaulay duration of bonds.
// ---> done

// 4. The resale value of bonds at a point during their term, taking account of
// accrued interest.
// ---> done

// 5. Bootstrapping of interest rates, to compute unknown rates from known
// rates using bond prices. Eg., if 1-year, 2-year and 3-year interest rates are
// known, and the price of a 4-year annual coupon bond is known, then the
// 4-year interest rate can be computed.


// 6. An advisory function which can display a graph of bond yield versus estimated risk for all bonds of specified kinds, with terms in a specified range
// and available for purchase.
// ---> processing
