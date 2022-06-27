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
      const nftContract = nftContract(NFT_CONTRACT_ADDRESS, abi, provider);
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



  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOption: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      // check if presale has started and ended
      const _presaleStarted = checkIfPresaleStarted();

      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      // set an interval which gets called every 5 seconds to check presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // set an interval to get the number of token Ids minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);



  //renderButton: Returns a button based on the state of the dapp
  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // If connected user is the owner, and presale hasnt started yet, allow them to start the presale
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }

    // If connected user is not the owner but presale hasn't started yet, tell them that
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasnt started!</div>
        </div>
      );
    }

    // If presale started, but hasn't ended yet, allow for minting during the presale period
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a
            Crypto Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // If presale started and has ended, its time for public minting
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  }

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );

}