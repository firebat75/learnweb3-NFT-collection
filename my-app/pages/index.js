import { Contract, provider, providers, utils } from "ethers";
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
      console.error(err);
    }
  };



  const checkIfPresaleStarted = async () => { // checkIfPresaleStarted: querys' `presaleStarted` var in contract
    try {
      const provider = await getProviderOrSigner();

      // we connect to contract as a provider so we have read-only access to the contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the presaleStarted from the contract
      const _presaleStarted = await nftContract.presaleStarted();

      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
    }
  };


  const checkIfPresaleEnded = async () => { // checkIfPresaleEnded: querys' `presaleEnded` var in contract
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleEnded = await nftContract.presaleEnded();

      // _presaleEnded is a big number, so we use lt(less than function) instead of '<'
      // Date.now()/1000 returns the current time in seconds
      // We compare if the _presaleEnded timestamp is less than the current time
      // which means presale has ended
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const getOwner = async () => { // getOwner: calls the contract to retrieve the owner
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _owner = await nftContract.owner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress(); // address associated with metamask account

      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTokenIdsMinted = async () => { // getTokenIdsMinted: gets the number of tokenIds that have been minted
    try {
      const provider = await getProviderOrSigner();
      const nftContract = NewContract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _tokenIds = await nftContract.tokenIds();
      // _tokenIds is a `big number`, we need to convert it to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  // @param{*}needSigner - True if you need the signer, default false otherwise
  const getProviderOrSigner = async (needSigner = false) => {
    // connect to metamask, store web3modal as a reference to access underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // if user it not connected to Rinkeby, throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };
}