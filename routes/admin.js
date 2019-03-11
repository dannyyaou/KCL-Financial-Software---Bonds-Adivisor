var express = require('express');
var router = express.Router();
var hbase = require ("hbase-rpc-client");
const cf = "bond_basics";
const table = "bond";

router.post('/create', function(req, res, next) {
	var data = JSON.parse(req.body.data);
	var client = req.dbClient;
	var puts = [];
	var put;
	console.log("id:",data['id'])
	for (qualifier in data) {
		if (qualifier !== 'id') {
			put = new hbase.Put(String(data['id']));
			put.add(cf, qualifier, String(data[qualifier]) )
			console.log("put.add(", cf, ",", qualifier, ", ", String(data[qualifier]),")");
			puts.push(put);
		}
	}
	client.mput(table, puts, (err, response) =>{
		return res.send({error:err, result: response});
	});
});

router.post('/delete', function(req, res, next) {
	var client = req.dbClient;
	var id = String(req.body.id);
	var del = new hbase.Delete(id)
	client.delete(table, del, (err, response) =>{
		console.log(err);
		return res.send({result: response})
	})
});

router.get('/get', function(req, res, next) {
	var client = req.dbClient;
	var scan = client.getScanner('bond');
	var results = [];
	var temp,key;
	scan.toArray((err,response)=>{
		for (var i = 0; i < response.length; i++) {
			temp = {id: response[i].row.toString("utf-8")};
			for (var col in response[i].cols) {
				key = col.split(':')[1];
				if (key) {
					temp[key] = response[i].cols[col].value.toString("utf-8");
				}
			}
			results.push(temp)
		}
		return res.send({result:results})
	})
});

router.get('/', function(req, res, next) {
  res.render('admin', { title: 'Express' });
});

module.exports = router;
