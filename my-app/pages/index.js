import { Contract, provider, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal, { getProviderDescription } from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  const web3ModalRef = useRef();

  const presaleMint = async () => { // presaleMint: Mint an NFT during the presale
    try {
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tc = await whitelistContract.presaleMint({ value: utils.parseEther("0.01"), });

      setLoading(true);
      // wait for the transaction to get minted
      await tx.wait();
      windows.alert("You successfully minted a CryptoDev!");
    } catch (err) {
      console.error(err);
    }
  };

  const publicMint = async () => { // publicMint: Mint an NFT after the presale
    try {
      // we need a signer to "write" a transaction
      const signer = await getProviderDescription(true);
      // Create a new instance of the Contract with a signer, which allows update methods
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      // call the mint from the contract to mint the Crypto Dev
      const tx = await whitelistContract.mint({ value: utils.parseEther("0.01") });
      setLoading(true);
      // wait for the transaction to get minted
      await tx.await();
      setLoading(false);
      window.alart("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };


  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };


  const startPresale = async () => { // startPresale: starts the presale for the NFT collection
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      // call the startPresale from the contract
      const tx = await whitelistContract.startPresale();
      setLoading(true);
      await tx.wait()
      setLoading(false);

      // set presale started to true
      await checkIfPresaleStarted();
    } catch (err) {
      console.log(err);
    }
  };




}