import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const history = useHistory()
  const queryParams = new URLSearchParams(location.search)
  const inputCellsPageNumber = queryParams.get('inputCellsPageNumber')
  const inputCellsPageSize = queryParams.get('inputCellsPageSize')
  const outputCellsPageNumber = queryParams.get('outputCellsPageNumber')
  const outputCellsPageSize = queryParams.get('outputCellsPageSize')

  const DEFAULT_PAGE_SIZE = 10
  const inputCellsPageLimit = inputCellsPageSize ? Number(inputCellsPageSize) : DEFAULT_PAGE_SIZE
  const outputCellsPageLimit = outputCellsPageSize ? Number(outputCellsPageSize) : DEFAULT_PAGE_SIZE
  const [inputCellsPage, setInputCellsPage] = useState(inputCellsPageNumber ? Number(inputCellsPageNumber) : 1)
  const handleInputCellsPageChange = (page: number) => {
    setInputCellsPage(page)
    queryParams.set('inputCellsPageNumber', page.toString())
    history.replace(`${location.pathname}?${queryParams.toString()}`)
  }
  const txInputsQuery = useQuery(['transactionInputs', txHash, inputCellsPage], async () => {
    const result = await explorerService.api.fetchTransactionInputsByHash(txHash, inputCellsPage, inputCellsPageLimit)
    return result
  })
  const [outputCellsPage, setOutputCellsPage] = useState(outputCellsPageNumber ? Number(outputCellsPageNumber) : 1)
  const handleOutputCellsPageChange = (page: number) => {
    setOutputCellsPage(page)
    queryParams.set('outputCellsPageNumber', page.toString())
    history.replace(`${location.pathname}?${queryParams.toString()}`)
  }

  const txOutputsQuery = useQuery(['transactionOutputs', txHash, outputCellsPage], async () => {
    const result = await explorerService.api.fetchTransactionOutputsByHash(
      txHash,
      outputCellsPage,
      outputCellsPageLimit,
    )
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
        {inputs && (
          <TransactionCellList
            total={txInputsQuery.isSuccess ? txInputsQuery.data.total : 0}
            inputs={inputs}
            showReward={Number(blockNumber) > 0 && isCellbase}
            indiceOffset={(inputCellsPage - 1) * inputCellsPageLimit}
          />
        )}
        <Pagination
          currentPage={inputCellsPage}
          totalPages={txInputsQuery.isSuccess ? Math.ceil(txInputsQuery.data.total / inputCellsPageLimit) : 1}
          onChange={handleInputCellsPageChange}
        />
      </div>
      <div className="transactionOutputs">
        {txOutputsQuery.isFetching && <Loading show />}
        {txOutputsQuery.isSuccess && (
          <TransactionCellList
            total={txOutputsQuery.isSuccess ? txOutputsQuery.data.total : 0}
            outputs={txOutputsQuery.data.data}
            txHash={transactionHash}
            indiceOffset={(outputCellsPage - 1) * outputCellsPageLimit}
          />
        )}
        <Pagination
          currentPage={outputCellsPage}
          totalPages={txOutputsQuery.isSuccess ? Math.ceil(txOutputsQuery.data.total / outputCellsPageLimit) : 1}
          onChange={handleOutputCellsPageChange}
        />
      </div>
    </>
  )
}
