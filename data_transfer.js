var readXlsxFile = require('read-excel-file/node')
var hbase = require ("hbase-rpc-client");
const cf = "bond_basics";
const table = "bond";
// File path.
readXlsxFile('./dataset_bonds.xlsx').then((rows) => {
  var list = [];
  var temp;
  for (var i = 1; i < rows.length; i++) {
    temp = {};
    for (var j = 0; j < rows[i].length; j++) {
      temp[rows[0][j].toLowerCase()] = rows[i][j];
    }
    list.push(temp);
  }
  var client = hbase({
      zookeeperHosts: ['localhost:2181'],
      zookeeperRoot: '/hbase',
      rootRegionZKPath: '/meta-region-server',
      rpcTimeout: 3000,
      pingTimeout: 3000,
      callTimeout: 5000
  });
  var puts = [];
  var put;
  for (index in list) {
    put = new hbase.Put(String(list[index]['id']));
    for(qualifier in list[index]){
      if (qualifier !== 'id') {
        put.add(cf, qualifier, String(list[index][qualifier]) )
        console.log("put.add(", cf, ",", qualifier, ", ", String(list[index][qualifier]),")");
        puts.push(put);
      }
    }
  }
  client.mput(table, puts, (err, response) =>{
    console.log(response);
  });
})
 