// dotenvを読み込み、環境変数を設定する
require('dotenv').config();

// blastEngineとErrorReportを読み込む
const { BlastEngine, ErrorReport } = require('blastengine');

// kintone-js-sdkを読み込む
const kintone = require('@kintone/kintone-js-sdk');

// kintoneへの接続情報を作成する
const auth = new kintone.Auth(); // kintoneの認証情報を管理するオブジェクトを作成する
const passwordAuthParam = {
		username: process.env.USERNAME,  // kintoneにログインするためのユーザー名
		password: process.env.PASSWORD   // kintoneにログインするためのパスワード
};
auth.setPasswordAuth(passwordAuthParam); // パスワード認証を設定する
const connParam = {
	domain: process.env.DOMAIN,   // kintoneのドメイン名
	auth,
};
connection = new kintone.Connection(connParam); // kintoneとの接続情報を管理するオブジェクトを作成する
// kintoneレコード操作用のオブジェクトを作成する
const kintoneRecord = new kintone.Record({ connection });

// blastEngineを初期化する
new BlastEngine(process.env.BLASTENGINE_USERID, process.env.BLASTENGINE_APIKEY); // BlastEngineを初期化する

// メイン処理をasync関数で囲む
(async () => {
	const report = new ErrorReport; // blastEngineのエラーレポートを管理するオブジェクトを作成する
	while (await report.finished() === false) { // ダウンロードができるようになるまで待つ
		await new Promise(res => setTimeout(res, 1000)); // 1秒待つ
	}
	const ary = await report.download(); // エラーレポートをダウンロードする
	const query = ary
		.map((params) => `email = "${params.email}"`)
		.join(' or '); // ダウンロードしたエラーレポートから、emailアドレスで検索するクエリを作成する
	const params = {
		app: process.env.APPID,  // 取得するkintoneアプリのID
		query
	};
	const { records } = await kintoneRecord.getRecords(params); // kintoneアプリからレコードを取得する
	// 取得したレコードを更新するためのパラメータを作成する
	const updateParams = records.map((record) => {
		return {
			id: record.$id.value, // レコードのID
			record: {
				sendTarget: {
					value: '送信しない' // レコードの更新値
				},
			},
			revision: record.$revision.value // レコードのリビジョン番号
		};
	});
	await kintoneRecord.updateRecords({ // kintoneアプリのレコードを更新する
		app: process.env.APPID, // 更新するkintoneアプリのID
		records: updateParams // 更新するレコードの情報
	});
	console.log('更新完了しました');
})();
