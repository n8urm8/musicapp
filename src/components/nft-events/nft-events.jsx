import { styled, Typography } from '@mui/material';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { abi } from './abi'; // Abi code for parsing tx and logs

const CONTRACT_ADDR = '0xedD59eAF94C1f2736FE20C2371E9431b26183564'

const provider = new ethers.providers.JsonRpcProvider(
  'https://polygon-mumbai.g.alchemy.com/v2/v9tZMbd55QG9TpLMqrkDc1dQIzgZazV6',
)

const contract = new ethers.Contract(CONTRACT_ADDR, abi, provider)
const filterFrom = contract.filters.TransferSingle(null, null, null)

const Row = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, .5fr)',
  gap: '10px',
}))

export const EventListener = () => {
  const [txs, setTxs] = useState([])

  const handleTransferSingle = (operator, from, to, id, amount) => {
    let type

    if (from === ethers.constants.AddressZero) {
      type = 'Purchase'
    } else {
      type = 'Transfer'
    }

    setTxs(prev => [
      {
        type,
        from,
        to,
        id: id.toString(),
        amount: amount.toString(),
      },
      ...prev,
    ])
  }

  useEffect(() => {
    const fetchOldEvents = async () => {
      const items = await contract.queryFilter(filterFrom, 28105390, 29202867)
      items.forEach(item => {
        handleTransferSingle(
          item.args[0],
          item.args[1],
          item.args[2],
          item.args[3],
          item.args[4],
        )
      })
    }

    fetchOldEvents()
    // contract.on("TransferSingle", handleTransferSingle);
    return () => {
      contract.removeAllListeners('TransferSingle')
      setTxs([])
    }
  }, [])

  return (
    <form className='m-4'>
      <div className='credit-card w-full lg:w-1/2 sm:w-auto shadow-lg mx-auto rounded-xl bg-white'>
        <div className='mt-4 p-4'>
          <h3 className='text-xl font-semibold text-gray-700 text-center'>
            NFT Events
          </h3>
          <h4 className='text-xs text-gray-400 text-center mb-6 mt-2'>
            {CONTRACT_ADDR}
          </h4>

          <div>
            <Row>
              <Typography variant='bodyLargeBold'>Event Type</Typography>
              <Typography variant='bodyLargeBold'>From ➡️</Typography>
              <Typography variant='bodyLargeBold'>To</Typography>
              <Typography variant='bodyLargeBold'>TokenID</Typography>
              <Typography variant='bodyLargeBold'>Amount</Typography>
            </Row>
            {txs.map(log => (
              <Row>
                <Typography>
                  {log.type === 'Purchase' && <span>{log.type}</span>}
                  {log.type === 'Transfer' && <span>{log.type}</span>}
                </Typography>
                {log.type === 'Transfer' && (
                  <Typography>
                    {log.from.slice(0, 6)}
                  </Typography>
                )}
                {log.type === 'Transfer' && (
                  <Typography>
                    {log.to.slice(0, 6)}
                  </Typography>
                )}
                {log.type === 'Purchase' && (
                  <Typography>New!</Typography>
                )}
                {log.type === 'Purchase' && (
                  <Typography>{log.to.slice(0, 6)}</Typography>
                )}
                <Typography>
                  #{log.id}
                </Typography>
                <Typography>
                  {log.amount}
                </Typography>
              </Row>
            ))}
          </div>
        </div>
      </div>
    </form>
  )
}
