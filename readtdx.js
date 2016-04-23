var redis = require("redis");
var fs = require('fs');

var util = require('util');
var events = require('events');

var fileNameSzDayPath = 'C:/TdxW_HuaTai/vipdoc/sz/lday/';
var fileNameShDayPath = 'C:/TdxW_HuaTai/vipdoc/sh/lday/';
var fileName_min5 = 'C:/TdxW_HuaTai/vipdoc/sh/fzline/sh600100.lc5';
var kline_step = 32; //k线的步长
var stockList = require('./astocklist.json'); //读取股票名称
var transactionDate = require('./transactionDate.json');
var readDataDate = 20; //读取10个交易日的数据



var logger;
var redisPort = 6379;
var redisHost = '192.168.0.115';
var db = 2; //选择db
var client = redis.createClient(redisPort, redisHost);
// prepare db
client.select(2, function() {});
client.on("error", function(err) {
    console.log("Error " + err);
});

var stockcode, i, stockindex, aday, tmpfilename, tmpexchange, TDX_date;
var dbvalue = [],dbkey = [];
var data;

var insertDb = function() {
	var count = dbkey.length;//count 在callback中调用
	if (data.length<kline_step * readDataDate ){
				dbkey.length = 0;//写完毕，清空length
        		data.length = 0; //
        		
        		console.log('i am all saved')
        		reader.emit('dbSaved');

	} 
	var tmpindex=0; //由于 i 是倒序，所以用一个临时变量
    for (i = data.length; i > data.length - (kline_step * readDataDate); i = i - kline_step) {

        aday = data.slice(i - kline_step, i);
        TDX_date = aday.slice(0, 4).readUInt32LE(0).toString();
        dbvalue[tmpindex]= new Object() ;
        dbvalue[tmpindex].open = (aday.slice(4, 8).readUInt32LE(0) / 100).toFixed(2);
        dbvalue[tmpindex].high = (aday.slice(8, 12).readUInt32LE(0) / 100).toFixed(2);
        dbvalue[tmpindex].low = (aday.slice(12, 16).readUInt32LE(0) / 100).toFixed(2);
        dbvalue[tmpindex].close = (aday.slice(16, 20).readUInt32LE(0) / 100).toFixed(2);
        dbvalue[tmpindex].volum = aday.slice(24, 28).readUInt32LE(0).toFixed(0);
        dbkey[tmpindex] = stockcode + ':' + TDX_date;
        tmpindex++;
    }

    for (i = 0; i < dbkey.length; i++) {
        client.hset(dbkey[i], 'TDX', JSON.stringify(dbvalue[i]), function(err, res) {
        	if(count>0){
        		count --
        		console.log('i am count',count)
        	}
        	else{
        		dbkey.length = 0;//写完毕，清空length
        		data.length = 0; //
        		
        		console.log('i am all saved')
        		reader.emit('dbSaved');
        	}
        })
    }

}


var readTDX = function(){
    events.EventEmitter.call(this);//eventemitter inherits
}
util.inherits(readTDX, events.EventEmitter);//eventemitter inherits


//this = readTDX;//没有这个就没有this 
stockindex = 0;// 这个相当于读文件的for循环的起始 在消息循环中判断结束

var reader = new readTDX;

reader.on('dbSaved',function(){
	setTimeout(function(){
		console.log('i am in sleep',500);
	})
	if(stockindex <=stockList.stocklist.length ){
		console.log("i am in dbSaved:",stockindex,stockList.stocklist.length);

		stockcode = stockList.stocklist[stockindex].code;
		tmpexchange = stockcode.slice(0, 2);

		if (tmpexchange.toUpperCase() === 'SH') {
		    tmpfilename = fileNameShDayPath + stockcode + '.day';
		} else if (tmpexchange.toUpperCase() === 'SZ') {
		    tmpfilename = fileNameSzDayPath + stockcode + '.day'
		} else {
		    console.log('exchange is not exist', tmpfilename);
		}
		console.log("beginread a file: ", tmpfilename);

		data = fs.readFileSync(tmpfilename);
		if (!data) {
		    console.log('file connot read:', tmpfilename);
		}

		stockindex++; //表示有可读数据,加一个，下次循环
		reader.emit('dbsaving');
	} else{
		reader.emit('readOver');// 表示读完了
	}


});
reader.on('readover',function(){
	console.log('i am in readover');
})

reader.on('dbsaving',function(){
	insertDb();
})

reader.emit('dbSaved');// start



/*
for (stockindex = 0; stockindex < 2; stockindex++) {

    async.waterfall([
        function(callback) {
            readStockFile();
            callback();
        },
        function(callback) {
            getStockData();
            callback();
        },
        function(callback) {
            insertDb();
        },
    ], function(err, result) {
        console.log('db is seted over:', err, result);
    });


}

*/