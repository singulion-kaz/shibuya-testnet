//SPDX-License-Identifier: UNLICENSED
//2023-7-29
//SINGULION Corporation CEO Katsuya NISHIZAWA
//goerli:0x466c3D975691517De8eAE770644968923EE909AD
//shibuya81:0x69fD2b690A58DEe39CE697765CB2E3c6CDE5AB82
//shibuya81_oracleEdition:0x12ceC69f10F3eB12D274465dF1d5f07C654a9178
//shibuya81_culcHash:0xA6eCEE6E557563aCbf122B3C298D03f6E0AE553e
pragma solidity ^0.8.9;

//ストアスキャン用コード生成認証部
contract ShinAiScan  {

    address _owner;//

    //Shin coin_"Am I right ID?"
    uint256 _key=202304572;
    function changeKey(uint256 newKey)
    public
    returns (bool)
    {
        require(msg.sender == _owner, "owner");
        _key = newKey;
        return (true);
    }

    //<<otpMp修正ブロック番号変数>>
    uint8 otpMp = 4 ;//!初期値をゼロにしない。
    function changeOtpMp(uint8 newMp)
    public
    returns (bool)
    {
        require( newMp > 0 );//otpMp>0を要求
        otpMp = newMp;
        return (true);
    }



    function culcBnm(uint8 mp)
    private
    view
    returns (uint256)
    {
        //TOTP関数用　修正ブロック番号モジュール  
        require( mp > 0 );//otpMp>0を要求
        uint256 bnm = block.number ;//現在blocknumber取得
        uint256 bnModMp = block.number % mp;//blocknumberの剰余を出す。
        bnm = bnm - bnModMp;
        return bnm;
    }

    function culcHash(uint256 bn ,address eoa,uint256 key)
        private
        view
        returns(bytes32)
    {
        bytes32 vp32b = sha256(bn,eoa,key,block.gaslimit);
        return vp32b;
    }
    
    function culcVp(address addr)
    private
    view
    returns (uint256)
    {
        require(_key>100, "key err");//鍵値が100未満の時OTP停止_contract-stop
        uint256 bnm = culcBnm(otpMp);
        bytes32 vp32b = culcHash(bnm, addr, _key);
        //n桁決定
        uint256 nDigi = 8;//桁,QRの為多めにする。本当は16進数でもよい
        uint256 vpUin = uint256(vp32b) % 10**nDigi;
        //n桁VPを返す
        return vpUin;
    }

    function genVp()
    public
    view
    returns (uint256)
    {
        //gen by EOA
        return culcVp(msg.sender);
    }

    function authVp(address eoaId,uint256 vp)
    public
    view
    returns (bool)
    {
        //要求：ゼロアドレス以外が呼び出せる。
        require(msg.sender != address(0), "zero address");
        //auth by EOA
            if ( vp == culcVp(eoaId) ) {
                return true ;
            } else {
                return false;
            }
    }

    /// Create a new contract and owener.
    constructor()  {
        _owner = msg.sender;
    }
}
