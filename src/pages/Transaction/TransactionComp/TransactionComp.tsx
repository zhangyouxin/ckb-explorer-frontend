import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import TransactionCellList from '../TransactionCellList'
import { Cell } from '../../../models/Cell'
import { Transaction } from '../../../models/Transaction'
import { explorerService } from '../../../services/ExplorerService'
import Pagination from '../../../components/Pagination'
import Loading from '../../../components/Loading'

const handleCellbaseInputs = (inputs: Cell[], outputs: Cell[]) => {
  if (inputs[0] && inputs[0].fromCellbase && outputs[0] && outputs[0].baseReward) {
    const resultInputs = inputs
    resultInputs[0] = {
      ...resultInputs[0],
      baseReward: outputs[0].baseReward,
      secondaryReward: outputs[0].secondaryReward,
      commitReward: outputs[0].commitReward,
      proposalReward: outputs[0].proposalReward,
    }
    return resultInputs
  }
  return inputs
}

export const TransactionComp = ({ transaction }: { transaction: Transaction }) => {
  const txHash = transaction.transactionHash
  // refactor to configurable
  const PAGE_SIZE = 10
  const [inputCellsPage, setInputCellsPage] = useState(1)
  const txInputsQuery = useQuery(['transactionInputs', txHash, inputCellsPage], async () => {
    const result = await explorerService.api.fetchTransactionInputsByHash(txHash, inputCellsPage, PAGE_SIZE)
    return result
  })
  const [outputCellsPage, setOutputCellsPage] = useState(1)
  const txOutputsQuery = useQuery(['transactionOutputs', txHash, outputCellsPage], async () => {
    const result = await explorerService.api.fetchTransactionOutputsByHash(txHash, outputCellsPage, PAGE_SIZE)
    // TODO: When will displayOutputs be empty? Its type description indicates that it will not be empty.
    if (result.data.length > 0) {
      result.data[0].isGenesisOutput = transaction.blockNumber === 0
    }
    return result
  })

  const { transactionHash, blockNumber, isCellbase } = transaction

  const inputs = handleCellbaseInputs(
    txInputsQuery.isSuccess ? txInputsQuery.data.data : [],
    txOutputsQuery.isSuccess ? txOutputsQuery.data.data : [],
  )

  /// [0, 11] block doesn't show block reward and only cellbase show block reward
  return (
    <>
      <div className="transactionInputs">
        {txInputsQuery.isFetching && <Loading show />}
        {inputs && <TransactionCellList inputs={inputs} showReward={Number(blockNumber) > 0 && isCellbase} />}
        {txInputsQuery.isSuccess && txInputsQuery.data.total > PAGE_SIZE && (
          <Pagination
            currentPage={inputCellsPage}
            totalPages={txInputsQuery.isSuccess ? Math.ceil(txInputsQuery.data.total / PAGE_SIZE) : 1}
            onChange={setInputCellsPage}
          />
        )}
      </div>
      <div className="transactionOutputs">
        {txOutputsQuery.isFetching && <Loading show />}
        {txOutputsQuery.isSuccess && (
          <TransactionCellList outputs={txOutputsQuery.data.data} txHash={transactionHash} />
        )}
        {txOutputsQuery.isSuccess && txOutputsQuery.data.total > PAGE_SIZE && (
          <Pagination
            currentPage={outputCellsPage}
            totalPages={txOutputsQuery.isSuccess ? Math.ceil(txOutputsQuery.data.total / PAGE_SIZE) : 1}
            onChange={setOutputCellsPage}
          />
        )}
      </div>
    </>
  )
}
