
var util = require('util');
var events = require('events');
//var myredis = require('redis');
var async = require('async');
var myredis = require('../../lib/myredis.js');


var client;
var dateArr;
var ansJson={categories:[], series:[{name:'',data:[]}] };
var TDXdata = [];

myredis.createClient(
    '192.168.0.115',
    6379,
    2,
    'redis',
    function(err,cli){
    	console.log('this is connectdb err:',err);
        client = cli;
    });

var getTransactionDate = function(begindate){
	//取交易日期
	dateArr=['20160405','20160406'];
	stockHandle.emit('getDateover');
	return dateArr;
}
var getTDX = function(stockcode,dateArr){
	var key;
	var TDXdataIndex =dateArr.length;
	for(var i = 0;i<dateArr.length;i++){
		(function(){
			var tmpindex = i;
			key = stockcode+':'+dateArr[tmpindex];
			client.hget(key,'TDX',function(err,values){
				if(err) console.log(err);
				TDXdata[tmpindex]=JSON.parse(values).close;
				TDXdataIndex --;
				if (TDXdataIndex <= 0) stockHandle.emit('GetJsonOver');
			})
		})();
	}
	return ;
}


var stockHandle = function(req,res){
	 events.EventEmitter.call(this);
	 getTransactionDate(req.body.begindate);
}
util.inherits(stockHandle, events.EventEmitter);//eventemitter inherits

stockHandle.on('getDateover',function(){
	getTDX(req.body.code,dateArr);	
})
stockHandle.on('GetJsonOver',function(){
	createAnswerJson(req.body.code,dateArr,TDXdata);
	res.send(ansJson);
})


var createAnswerJson = function(stockcode,dateArr,seriesData){
	ansJson.categories = dateArr;
	ansJson.series.name =stockcode;
	ansJson.series.data = seriesData;

}
var stocklib ={

	stockHandle:stockHandle,

}


module.exports = stocklib;



/*function(req,res){
    	var stockcode = req.body.code;
    	var beginDate = req.body.begindate;
	   

	   var redisPort = 6379;
	   var redisHost = '192.168.0.115';
	   var db = 2; //选择db
	   var client = redis.createClient(redisPort, redisHost);
	   // prepare db
	   client.select(2, function() {
	   	console.log('i am select');
	   });
	   client.on("error", function(err) {
	       console.log("Error " + err);
	   }); 	
	   var dbkey = stockcode +":"+beginDate
	   client.hget('SH600961:20160406','TDX',function(err,data){
	   		vdata=JSON.parse(data);
	   		console.log(vdata.open);
	   });
*/