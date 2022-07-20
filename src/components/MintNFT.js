import React, {useEffect, useState} from 'react';
import {
    VStack,
    Button,
    Text,
    HStack,
    Select,
    Input,
    Box
  } from "@chakra-ui/react";
import { NFTStorage } from 'nft.storage';
import { ethers } from 'ethers';
import MediaNFT from '../constants/abis/MediaNFT.json'
import mime from 'mime';

const APIKEY = process.env.REACT_APP_NFTSTORAGE_KEY;
const nftContractAddress = '0xC365e077Bb448d3985d40222aE6972083f9b345c';

const MintNFT = ({signer}) => {

    const [errorMessage, setErrorMessage] = useState(null);
    const [uploadedFile, setUploadedFile] = useState();
    const [type, setType] = useState();
    const [imageView, setImageView] = useState();
    const [metaDataURL, setMetaDataURl] = useState();
    const [txURL, setTxURL] = useState();
    const [txStatus, setTxStatus] = useState();

    const handleFileUpload = (event) => {
        console.log("file is uploaded");
        setUploadedFile(event.target.files[0]);
        
        setTxStatus("");
        setImageView("");
        setMetaDataURl("");
        setTxURL("");
    }

    const mintNFTToken = async(event, uploadedFile) =>{
        event.preventDefault();
        //1. upload NFT content via NFT.storage
        const metaData = await uploadNFTContent(uploadedFile);
        
        //2. Mint a NFT 
        const mintNFTTx = await sendTx(metaData);

        //3. preview the minted nft
        previewNFT(metaData, mintNFTTx);
    }

    const uploadNFTContent = async(inputFile) =>{
        const nftStorage = new NFTStorage({token: APIKEY,});
        let filetype = inputFile.type;
        filetype = filetype.split("/");
        setType(filetype[0]);
        try {
            setTxStatus("Uploading NFT to IPFS & Filecoin via NFT.storage.");
            const metaData = await nftStorage.store({
                name: 'Media NFT collection',
                description: 'This is a Media NFT collection stored on IPFS & Filecoin.',
                image: inputFile
            });
            console.log("metaData",metaData)
            setMetaDataURl(getIPFSGatewayURL(metaData.url));
            return metaData;

        } catch (error) {
            setErrorMessage("Could not save NFT to NFT.Storage - Aborted minting.");
            console.log(error);
        }
    }

    const sendTx = async(metadata) =>{
        try {
            setTxStatus("Sending mint transaction to Mumbai Blockchain.");
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const connectedContract = new ethers.Contract(
                nftContractAddress,
                MediaNFT,
                signer
            );
            const mintNFTTx = await connectedContract.safeMint(metadata.url);
            return mintNFTTx;
        } catch (error) {
            setErrorMessage("Failed to send tx to Mumbai.");
            console.log(error);
        }
    }

    const previewNFT = (metaData, mintNFTTx) =>{
        let imgViewString = getIPFSGatewayURL(metaData.data.image.pathname);;
        setImageView(imgViewString);
        console.log("media url:", imgViewString);
        setMetaDataURl(getIPFSGatewayURL(metaData.url));
        setTxURL('https://mumbai.polygonscan.com/search?f=0&q='+ mintNFTTx.hash);
        setTxStatus("NFT is minted successfully!");
    }

    const getIPFSGatewayURL = (ipfsURL)=>{
        let urlArray = ipfsURL.split("/");
        let ipfsGateWayURL = `https://${urlArray[2]}.ipfs.dweb.link/${urlArray[3]}`;
        return ipfsGateWayURL;
    }

    return(
        <div className='MintNFT'>
            <form>
                <h3>Mint your Multimedia NFT - Separate from the tokens above</h3>
                <input type="file" onChange={handleFileUpload}></input>
                <Button onClick={e=>mintNFTToken(e, uploadedFile)}>Mint NFT</Button>
            </form>
            {txStatus && <p>{txStatus}</p>}
            {imageView && type === "video" ?
                <video controls name="video">
                    <source src={imageView} type="video/mp4" />
                </video>
                : (imageView &&  type === "audio") ?
                    <audio controls>
                        <source src={imageView} type="audio/mpeg" />
                    </audio> 
                    : (imageView &&  type === "image") ?
                        <img className='NFTImg' src={imageView} alt="NFT preview" />
                        : null
            }
            {metaDataURL && <p><a href={metaDataURL}>Metadata on IPFS</a></p>}
            {txURL && <p><a href={txURL}>See the mint transaction</a></p>}
            {errorMessage}
        </div>
        
    );
}
export default MintNFT;