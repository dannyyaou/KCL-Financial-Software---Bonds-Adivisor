var express = require('express');
var router = express.Router();
var regression = require('regression');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/regression', function(req,res){
	var data = JSON.parse(req.body.data);
	var order = req.body.order;
	const result = regression.polynomial(data, { order: order });
	return res.send({result:result})
})

module.exports = router;
