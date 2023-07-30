/*
//------------------------------------------------
//name:Web3QRSCAN-demo_ShinI
//
//SPDX-License-Identifier: UNLICENSED
//2023-7-27
//SINGULION Corporation
//CEO Katsuya NISHIZAWA
//https://www.openzeppelin.com/contracts
//https://patentscope2.wipo.int/search/ja/detail.jsf?docId=JP366820626&_cid=JP1-LDO5GB-30888-1
//WEB3-QRコード認証のコード読取・認証部
//------------------------------------------------
*/

//Creator:0xc10E39d4F3Cf08eD11BbE48398a5d571d3BD9981

//contract
//const gaContractAddress = "0x69fD2b690A58DEe39CE697765CB2E3c6CDE5AB82";//生成部認証部 shibuya
const gaContractAddress = "0xA6eCEE6E557563aCbf122B3C298D03f6E0AE553e";
let gaInstance; // instance

//EOA
let myAccount;//user Wallet
//totp (動的QRコード、動的バーコード、リライタブルNFC動的コード、認証コード)
let totp;


//https://docs.metamask.io/guide/ethereum-provider.html#using-the-provider
/*****************************************/
/* Detect the MetaMask GU Ethereum provider */
/*****************************************/
/*
//>>import detectEthereumProvider from '@metamask/detect-provider';
//<script src="https://unpkg.com/@metamask/detect-provider/dist/detect-provider.min.js"></script>
*/

async function getChainData(){
  const hexChainId = await window.ethereum.request({ method: 'eth_chainId' });
  const chainId = parseInt(hexChainId);
  console.log('chain ID is',chainId);
  let hexBlockNumber = await window.ethereum.request({ method: "eth_blockNumber"} );
  let bn = parseInt(hexBlockNumber);
  console.log('latest block number is',bn);
}

async function getUserEoa(){
  try {
    const acccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (acccounts.length > 0) {
      myAccount=acccounts[0];
      console.log('Your Address is ',acccounts[0]);
    }
  } catch (err) {
    if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        console.log('Please connect to MetaMask.');
    } else {
        console.error(err);
    }
  }
}

function startApp(provider) {
  // If the provider returned by detectEthereumProvider is not the same as
  // window.ethereum, something is overwriting it, perhaps another wallet.
  if (provider !== window.ethereum) {
    console.error('Do you have multiple wallets installed?');
  }
  // Access the decentralized web
  getChainData();
  getUserEoa();
  getEthersContract();
}

async function getEthersContract(){
// A Web3Provider wraps a standard Web3 provider, which is
// what MetaMask injects as window.ethereum into each page
const ethProvider = new ethers.providers.Web3Provider(window.ethereum)

// MetaMask requires requesting permission to connect users accounts
await ethProvider.send("eth_requestAccounts", []);
// Look up the current block number
let bn = await ethProvider.getBlockNumber();
console.log( 'bn is' , bn );
}

async function startEthProv(){

    // this returns the provider, or null if it wasn't detected
    const provider = await detectEthereumProvider();

    if (provider) {
      console.log('detect provider. start app.')
      startApp(provider); // Initialize your app

    } else {
      console.log('Please install MetaMask!');
    }
} 

/*---------------*/
//run program
startEthProv();
  // Contract
const ethProvider = new ethers.providers.Web3Provider(window.ethereum)
const signer = ethProvider.getSigner()
const gaContract = new ethers.Contract(gaContractAddress, abiga, ethProvider);



//QR-auth_QRコード検証・認証部
let qrMes;
async function authQrVp(qrMes) {

  const gaWithSigner = await gaContract.connect(signer); 
  //入力
  console.log('QR is' ,qrMes );

  //メッセージ分離部、分離記号"+"
  let words = qrMes.split('+');
  let authTotp=words[0];
  let authEoa=words[1];
  console.log(words[0]);
  console.log(words[1]);

  // スマコンの認証部に代入し検証
  let tx;
  try {
      tx = await gaWithSigner.authVp(authEoa,authTotp);
  } catch (error) {
    // 例外が発生したあとはこのブロックが実行される
    console.log("catch:err");
    console.log(error.message); // => "undefinedFunction is not defined"
  }
  console.log("tx",tx);
  //検証結果により応答
  if (tx==true) {
    console.log('認証OK！　入場してください　Hello W3.' ,tx);
    let elem = document.getElementById("authRes");
    elem.innerHTML = "<span style='background-color:blue;'><font color='#FFFFFF'>認証OK！　入場してください　Hello W3</font></span>";
  } else {
    console.log('認証中、ゲートにてお待ちください' ,tx);
    let elem = document.getElementById("authRes");
    elem.innerHTML = "<span style='background-color:red;'><font color='#FFFFFF'>認証中、ゲートにてお待ちください</font></span>";    
  }
};




window.onload = (e)=>{

	let video  = document.createElement("video");
	let canvas = document.getElementById("canvas");
	let ctx    = canvas.getContext("2d");
	let msg    = document.getElementById("msg");

	const userMedia = {video: {facingMode: "environment"}};
	navigator.mediaDevices.getUserMedia(userMedia).then((stream)=>{
		video.srcObject = stream;
		video.setAttribute("playsinline", true);
		video.play();
		startTick();
	});

	function startTick(){
		msg.innerText = "Loading video...";
		if(video.readyState === video.HAVE_ENOUGH_DATA){
			canvas.height = video.videoHeight;
			canvas.width = video.videoWidth;
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
			let code = jsQR(img.data, img.width, img.height, {inversionAttempts: "dontInvert"});
			if(code){
				drawRect(code.location);// Rect
				msg.innerText = code.data;// Data

        //call auth contract
        authQrVp(code.data);//auth with qr code

			}else{
				msg.innerText = "Detecting QR-Code...";
			}
		}
		setTimeout(startTick, 25);//250
	}

	function drawRect(location){
		drawLine(location.topLeftCorner,     location.topRightCorner);
		drawLine(location.topRightCorner,    location.bottomRightCorner);
		drawLine(location.bottomRightCorner, location.bottomLeftCorner);
		drawLine(location.bottomLeftCorner,  location.topLeftCorner);
	}

	function drawLine(begin, end){
		ctx.lineWidth = 4;
		ctx.strokeStyle = "#FF3B58";
		ctx.beginPath();
		ctx.moveTo(begin.x, begin.y);
		ctx.lineTo(end.x, end.y);
		ctx.stroke();
	}
}




