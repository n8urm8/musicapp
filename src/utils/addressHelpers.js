import addresses from '../constants/contracts'


export const getMusicNFTAddress = (chainId) => {
  return addresses.musicNFT[chainId]
}