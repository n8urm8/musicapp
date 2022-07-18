import { useEffect, useState } from "react";
import {
  VStack,
  Button,
  Text,
  HStack,
  Select,
  Input,
  Box
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { Tooltip } from "@chakra-ui/react";
import { networkParams } from "./networks";
import { toHex, truncateAddress } from "./utils";
import { BigNumber, ethers } from "ethers";
import Web3Modal from "web3modal";
import { providerOptions } from "./providerOptions";
import MusicNFT from "./constants/abis/MusicNFT.json";
import { songs } from "./constants/MusicCIDs";

const web3Modal = new Web3Modal({
  cacheProvider: true, // optional
  providerOptions // required
});

export default function Home() {
  const [provider, setProvider] = useState();
  const [library, setLibrary] = useState();
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [chainId, setChainId] = useState();
  const [network, setNetwork] = useState();
  const [message, setMessage] = useState("");
  const [signedMessage, setSignedMessage] = useState("");
  const [verified, setVerified] = useState();

  const [nftBalance, setNFTBalance] = useState();
  const [loading, setLoading] = useState(false);
  const [CID, setCID] = useState("");
  const [audioURL, setAudioURL] = useState("")
  const [myTokens, setMyTokens] = useState([])
  const contractAddress = "0xa2f25545B02eE52EBFcf501E0843DFfc2bc50629";
  const NFTContract = new ethers.Contract(
    contractAddress,
    MusicNFT.abi,
    signer
  );

  const connectWallet = async () => {
    try {
      const provider = await web3Modal.connect();
      const library = new ethers.providers.Web3Provider(provider);
      const signer = library.getSigner();
      const accounts = await library.listAccounts();
      const network = await library.getNetwork();
      setSigner(signer);
      setProvider(provider);
      setLibrary(library);
      setNetwork(network);
      console.log("network.chainid", network.chainId)
      if (network.chainId !== 80001) switchNetwork();
      if (accounts) setAccount(accounts[0]);
      setChainId(network.chainId);
      
    } catch (error) {
      setError(error);
    }
  };


  const handleNetwork = (e) => {
    const id = e.target.value;
    setNetwork(Number(id));
  };

  const handleInput = (e) => {
    const msg = e.target.value;
    setMessage(msg);
  };

  const switchNetwork = async () => {
    const mumbainetwork = 80001;
    try {
      await library.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: toHex(mumbainetwork) }]
      });
    } catch (switchError) {
      if (switchError) {
        try {
          await library.provider.request({
            method: "wallet_addEthereumChain",
            params: [networkParams[mumbainetwork]]
          });
        } catch (error) {
          setError(error);
        }
      }
    }
  };

  const signMessage = async () => {
    if (!library) return;
    try {
      const signature = await library.provider.request({
        method: "personal_sign",
        params: [message, account]
      });
      setSignedMessage(message);
      setSignature(signature);
    } catch (error) {
      setError(error);
    }
  };

  const verifyMessage = async () => {
    if (!library) return;
    try {
      const verify = await library.provider.request({
        method: "personal_ecRecover",
        params: [signedMessage, signature]
      });
      setVerified(verify === account.toLowerCase());
    } catch (error) {
      setError(error);
    }
  };

  const refreshState = () => {
    setAccount();
    setChainId();
    setNetwork("");
    setMessage("");
    setSignature("");
    setVerified(undefined);
  };

  const disconnect = async () => {
    await web3Modal.clearCachedProvider();
    refreshState();
  };

  // useEffect(() => {
  //   if (web3Modal.cachedProvider) {
  //     connectWallet();
  //     console.log("cached provider", web3Modal.cachedProvider)
  //   }
  // }, []);

  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts) => {
        console.log("accountsChanged", accounts);
        if (accounts) setAccount(accounts[0]);
      };

      const handleChainChanged = (_hexChainId) => {
        setChainId(Number(_hexChainId));
        if (Number(_hexChainId) === 80001) {
          loadMyCollection();
          getNFTBalance(account);
        }
      };

      const handleDisconnect = () => {
        console.log("disconnect", error);
        disconnect();
      };

      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
      provider.on("disconnect", handleDisconnect);

      return () => {
        if (provider.removeListener) {
          provider.removeListener("accountsChanged", handleAccountsChanged);
          provider.removeListener("chainChanged", handleChainChanged);
          provider.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, [provider]);


  const getNFTBalance = async (address) => {
    const result = await NFTContract.balanceOf(address);
    const balance = result.toString();
    setNFTBalance(balance);
  };

  const loadMyCollection = async () => {
    const myTokenIds = await NFTContract.getTokensByOwner(account);
    console.log(`myTokenIds: ${myTokenIds} (${myTokenIds.length})`)
    const tokens = [];
    for (let i = 0; i < myTokenIds.length; i++) {
      console.log("tokenID", myTokenIds[i].toString())
      const tokenURI = await NFTContract.tokenURI(myTokenIds[i].toString());
      console.log("tokenURI", tokenURI)
      const tokenInfo = {
        id: myTokenIds[i].toString(),
        uri: tokenURI.toString()
      }
      tokens.push(tokenInfo);
      
    }
    setMyTokens(tokens);  
    console.log("myTokens" , tokens)
  };

  useEffect(() => {
    console.log("chainid (getbalance):", chainId);
    (account ? (getNFTBalance(account) && loadMyCollection()) : null);
  }, [account, nftBalance]);

  const mintNFT = async () => {
    try {
      const tx = await NFTContract.safeMint(account, CID);
      setLoading(true);
      await tx.wait();
      setLoading(false);
    } catch (error) {
      setError(error);
    }
  };

  const setSong = (id) => {
    const songId = id.target.value;
    setCID(songId);
    console.log("song CID:", songId);
  };

  useEffect(() => {
    const url = "https://" + CID + ".ipfs.nftstorage.link"
    setAudioURL(url);
    console.log("audio url:", url)
  }, [CID]);

  const createAudioURL = (uri) => {
    const CID = uri.slice(7);
    const newURL =  "https://" + CID + ".ipfs.nftstorage.link";
    return newURL;
  };

  return (
    <>
      <VStack justifyContent="center" alignItems="center" overflowY="scroll">
        <HStack marginBottom="10px">
          <Text
            margin="0"
            lineHeight="1.15"
            fontSize={["1.5em", "2em", "3em", "4em"]}
            fontWeight="600"
            sx={{
              background: "linear-gradient(90deg, #1652f0 0%, #b9cbfb 70.35%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            NFT MUSIC APP
          </Text>
        </HStack>
        <HStack>
          {!account ? (
            <Button onClick={connectWallet}>Connect Wallet</Button>
          ) : (
            <Button onClick={disconnect}>Disconnect</Button>
          )}
        </HStack>
        <VStack justifyContent="center" alignItems="center" padding="10px 0">
          <HStack>
            <Text>{`Connection Status: `}</Text>
            {account ? (
              <CheckCircleIcon color="green" />
            ) : (
              <WarningIcon color="#cd5700" />
            )}
          </HStack>

          <Tooltip label={account} placement="right">
            <Text>{`Account: ${truncateAddress(account)}`}</Text>
          </Tooltip>
          <HStack>
            <Text>{`Network ID: ${chainId ? chainId : "No Network"}`}</Text>
            <Text>{chainId === 80001 || Number(chainId) === Number(0x13881) ? "Mumbai" : ""}</Text>
          </HStack>
            {network && (Number(chainId) != 80001 || Number(chainId) != Number(0x13881)) ?
              <Button onClick={switchNetwork}>
                  Switch to Mumbai
              </Button>
               : ""
            }
          <Text><a style={{color:"blue"}} href="https://mumbai.polygonscan.com/address/0xa2f25545B02eE52EBFcf501E0843DFfc2bc50629#code" target="_blank" rel="noreferrer noopener">View Contract on PolygonScan</a> </Text>
        </VStack>
        {!account ? (
          <HStack 
            padding="20px" 
            justifyContent="center"
            maxW="90vw"
            flexWrap="wrap">
            <Box
              maxW="sm"
              margin="5px"
              borderWidth="1px"
              borderRadius="lg"
              padding="10px">
              <VStack>
                <Text>Step 1: Setup a Wallet</Text>
                <Text>Must use Metamask, Coinbase Wallet, or a WalletConnect compatible wallet</Text>
              </VStack>
            </Box>
            <Box
              maxW="sm"
              margin="5px"
              borderWidth="1px"
              borderRadius="lg"
              padding="10px">
              <VStack >
                <Text>Step 2: Connect to Mumbai (Polygon Testnet)</Text>
                <Text>
                  Go to <a style={{color:"blue"}} href="https://chainlist.org/" rel="noreferrer noopener" target="_blank">Chainlist</a> and search for Mumbai from the Testnet list, connect wallet, and add to wallet.
                </Text>
              </VStack>
            </Box>
            <Box
              maxW="sm"
              margin="5px"
              borderWidth="1px"
              borderRadius="lg"
              padding="10px">
              <VStack>
                <Text>Step 3: Get testnet Matic from faucet</Text>
                <Text>Go to <a style={{color:"blue"}} href="https://faucet.polygon.technology/" rel="noreferrer noopener" target="_blank">Polygon Faucet</a> and enter your wallet address to get MATIC (testnet) tokens sent to you. This is needed to pay for gas fees.</Text>
              </VStack>
            </Box>
            <Box
              maxW="sm"
              margin="5px"
              borderWidth="1px"
              borderRadius="lg"
              padding="10px">
              <VStack>
                <Text>Step 4: Connect To the App!</Text>
                <Text>Minting NFTs doesn't cost anything besides the gas fee. Have fun!</Text>
              </VStack>
            </Box>
          </HStack>
        ) : (
          <HStack justifyContent="flex-start" alignItems="flex-start">
            <Box
              maxW="sm"
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              padding="10px"
            >
              <VStack>
                <p>Set Song</p>
                <Select placeholder="Select Song" onChange={setSong}>
                  {songs.map((song, i) => {
                    return <option key={i} value={song.cid}>{song.name}</option>
                  })}
                </Select>
              </VStack>
            </Box>
            <Box>
              <VStack>
                {/* need to fix this to render songs correctly */}
                {/* <Text style={{marginTop:"20%"}}>Select a song to play!</Text> */}
                {songs.map((song, i) => {
                  return (song.cid === CID &&
                    <audio controls autoPlay name="radio" key={i}>
                      <source src={audioURL} type="audio/mpeg" />
                    </audio>
                    )
                })}
                {audioURL === "https://.ipfs.nftstorage.link" && 
                  <p style={{marginTop:"20%"}}>Select a song to play!</p>
                }
                <Button onClick={mintNFT} isDisabled={CID == "" || loading}>
                  {!loading? "Mint This Song" : "Minting..."}
                </Button>
                
              </VStack>
            </Box>
            {/* <Box
              maxW="sm"
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              padding="10px"
            >
              <VStack>
                <Button onClick={switchNetwork} isDisabled={!network}>
                  Switch Network
                </Button>
                <Select placeholder="Select network" onChange={handleNetwork}>
                  <option value="80001">Mumbai</option>
                  <option value="137">Polygon</option>
                </Select>
              </VStack>
            </Box>
            <Box
              maxW="sm"
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              padding="10px"
            >
              <VStack>
                <Button onClick={signMessage} isDisabled={!message}>
                  Sign Message
                </Button>
                <Input
                  placeholder="Set Message"
                  maxLength={20}
                  onChange={handleInput}
                  w="140px"
                />
                {signature ? (
                  <Tooltip label={signature} placement="bottom">
                    <Text>{`Signature: ${truncateAddress(signature)}`}</Text>
                  </Tooltip>
                ) : null}
              </VStack>
            </Box>
            <Box
              maxW="sm"
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              padding="10px"
            >
              <VStack>
                <Button onClick={verifyMessage} isDisabled={!signature}>
                  Verify Message
                </Button>
                {verified !== undefined ? (
                  verified === true ? (
                    <VStack>
                      <CheckCircleIcon color="green" />
                      <Text>Signature Verified!</Text>
                    </VStack>
                  ) : (
                    <VStack>
                      <WarningIcon color="red" />
                      <Text>Signature Denied!</Text>
                    </VStack>
                  )
                ) : null}
              </VStack>
            </Box> */}
          </HStack>
        )}
        {account && <div>
        <HStack>
            <p>My NFT Balance: {nftBalance}</p>
        </HStack>
        <HStack flexWrap="wrap"  >
            {myTokens.map((token, i) => {
                return ( 
                  <Box
                    maxW="sm"
                    borderWidth="1px"
                    borderRadius="lg"
                    overflow="wrap"
                    overflowWrap={true}
                    padding="10px"
                    key={i}
                  >
                  <VStack>
                    <Text>
                      TokenID: {token.id}
                    </Text>
                    <audio controls>
                      <source src={createAudioURL(token.uri)} type="audio/mpeg" />
                    </audio>
                  </VStack>
                </Box>)
          })}
        </HStack></div>}
        <Text>{error ? error.message : null}</Text>
      </VStack>
    </>
  );
}
