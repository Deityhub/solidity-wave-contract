import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import portalJson from "./utils/WavePortal.json";
import './App.css';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [mining, setMining] = useState(false);
  const [waves, setWave] = useState(0);
  const [fetchingWaveLength, setFetchingWaveLength] = useState(false);
  const [allWaves, setAllWaves] = useState([]);
  const [value, setValue] = useState('');
  const contractABI = portalJson.abi;
  const contractAddress = "0xA8C9F60d5582cB73E7eD7efFbCe760Fb6CC53baE"

  const setupContract = async ({ contractAddress, contractABI }) => {
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      return new ethers.Contract(contractAddress, contractABI, signer);
    } catch (error) {
      console.log('Error setting up contract: ', error)
    }
  }

  const getWaveCount = async () => {
    try {
      setFetchingWaveLength(true);
      const waveContract = await setupContract({ contractAddress, contractABI });

      const count = await waveContract.getTotalWaves();
      setFetchingWaveLength(false);
      setWave(Number(count));
    } catch (error) {
      console.log('Error fetching wave count: ', error)
      setFetchingWaveLength(false);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      /*
      * First make sure we have access to window.ethereum
      */
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });
      console.log('** connected accounts **', accounts);

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
      }


    } catch (error) {
      console.log('** Caught Error **', error);
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const wavePortalContract = await setupContract({ contractAddress, contractABI });

        const waveTxn = await wavePortalContract.wave(value, { gasLimit: 300000 });
        setMining(true)
        await waveTxn.wait();
        setMining(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
      setMining(false);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert('Get metamask...');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log('** accounts **', accounts);
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Connected:", account);
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log('Error connecting wallet: ', error);
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const wavePortalContract = await setupContract({ contractAddress, contractABI })

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();


        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleValue = e => {
    setValue(e.target.value);
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    getAllWaves();
  }, [])

  /**
 * Listen in for emitter events!
 */
  useEffect(async () => {
    let wavePortalContract;

    const onNewWave = (from, message, timestamp) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      wavePortalContract = await setupContract({ contractAddress, contractABI });
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          👋 Hello World! 👋🏼
        </div>

        <div className="bio">
          I am Jude, a javascript developer learning how to build products that will run on the blockchain
        </div>

        <textarea
          value={value}
          onChange={handleValue}
          style={{
            height: 150,
            borderRadius: 5,
            border: 'solid #1212',
            padding: 10
          }}
        />

        <button className="waveButton" onClick={wave} disabled={mining}>
          {mining ? 'Registering wave...' : 'Wave at Me'}
        </button>


        {
          !currentAccount &&
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
        </button>
        }

        {/*{
          !fetchingWaveLength ? (
            <section>
              <aside>Total Waves:</aside>{' '}
              <aside>{waves}</aside>
            </section>

          ) : (<section>
            <aside>Loading total waves... </aside>
          </section>)
        }*/}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
