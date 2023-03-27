// dotenvを読み込み、環境変数を設定する
require('dotenv').config();

// blastEngine SDKとBulkを読み込む
const { BlastEngine, Bulk } = require('blastengine');

// kintone-js-sdkとfsを読み込む
const kintone = require('@kintone/kintone-js-sdk');
const fs = require('fs');

// kintoneへの接続情報を作成する
const auth = new kintone.Auth();
const passwordAuthParam = {
		username: process.env.USERNAME,  // kintoneにログインするためのユーザー名
		password: process.env.PASSWORD   // kintoneにログインするためのパスワード
};
auth.setPasswordAuth(passwordAuthParam);
const connParam = {
	domain: process.env.DOMAIN,   // kintoneのドメイン名
	auth,
};
connection = new kintone.Connection(connParam);

// kintoneレコード操作用のオブジェクトを作成する
const kintoneRecord = new kintone.Record({ connection });

// blastEngineを初期化する
new BlastEngine(process.env.BLASTENGINE_USERID, process.env.BLASTENGINE_APIKEY);

// メイン処理をasync関数で囲む
(async () => {
	// kintoneアプリからレコードを取得する
	const params = {
		app: process.env.APPID,  // 取得するkintoneアプリのID
		query: `sendTarget in ("", "対象") and email != ""`  // レコードの検索クエリ
	};
	const { records } = await kintoneRecord.getRecords(params);

	// テキストファイルからメール本文を読み込む
	const text = fs.readFileSync('./mail.txt', 'utf-8');

	// Bulkオブジェクトを作成する
	const bulk = new Bulk();

	// Bulkオブジェクトにメールの情報を設定する
	await bulk
		.setFrom(process.env.FROMADDRESS, process.env.FROMNAME)   // 送信元のメールアドレスと名前
		.setSubject(process.env.SUBJECT)   // 件名
		.setText(text)   // 本文
		.register();   // 送信するメールの情報をblastEngineに登録する

	// レコードを処理し、Bulkオブジェクトに宛先を追加する
	records.map(record => {
		bulk.addTo(record.email.value, {name: record.name.value});
	});

	// blastEngineに登録したメールの情報を更新する
	await bulk.update();

	// blastEngineを使ってメールを送信する
	await bulk.send();

	// 送信が完了したことをログに出力する
	console.log(`送信しました ${bulk.delivery_id}`);
})();
