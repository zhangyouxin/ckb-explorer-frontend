import { useQuery } from '@tanstack/react-query'
import { useHistory, useLocation } from 'react-router-dom'
import TransactionCellList from '../TransactionCellList'
import { Cell } from '../../../models/Cell'
import { Transaction } from '../../../models/Transaction'
import { explorerService } from '../../../services/ExplorerService'
import Pagination from '../../../components/Pagination'
import Loading from '../../../components/Loading'
import { useSearchParams } from '../../../hooks'

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
  const DEFAULT_PAGE_SIZE = 10
  const txHash = transaction.transactionHash
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const history = useHistory()

  const {
    inputCellsPageNumber = 1,
    inputCellsPageSize = DEFAULT_PAGE_SIZE,
    outputCellsPageNumber = 1,
    outputCellsPageSize = DEFAULT_PAGE_SIZE,
  } = useSearchParams('inputCellsPageNumber', 'inputCellsPageSize', 'outputCellsPageNumber', 'outputCellsPageSize')

  const handleInputCellsPageChange = (page: number) => {
    queryParams.set('inputCellsPageNumber', page.toString())
    history.replace(`${location.pathname}?${queryParams.toString()}`)
  }
  const txInputsQuery = useQuery(['transactionInputs', txHash, inputCellsPageNumber, inputCellsPageSize], async () => {
    const result = await explorerService.api.fetchTransactionInputsByHash(
      txHash,
      Number(inputCellsPageNumber),
      Number(inputCellsPageSize),
    )
    return result
  })
  const handleOutputCellsPageChange = (page: number) => {
    queryParams.set('outputCellsPageNumber', page.toString())
    history.replace(`${location.pathname}?${queryParams.toString()}`)
  }

  const txOutputsQuery = useQuery(
    ['transactionOutputs', txHash, outputCellsPageNumber, outputCellsPageSize],
    async () => {
      const result = await explorerService.api.fetchTransactionOutputsByHash(
        txHash,
        Number(outputCellsPageNumber),
        Number(outputCellsPageSize),
      )
      // TODO: When will displayOutputs be empty? Its type description indicates that it will not be empty.
      if (result.data.length > 0) {
        result.data[0].isGenesisOutput = transaction.blockNumber === 0
      }
      return result
    },
  )

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
            indiceOffset={(Number(inputCellsPageNumber) - 1) * Number(inputCellsPageSize)}
          />
        )}
        <Pagination
          currentPage={Number(inputCellsPageNumber)}
          totalPages={txInputsQuery.isSuccess ? Math.ceil(txInputsQuery.data.total / Number(inputCellsPageSize)) : 1}
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
            indiceOffset={(Number(outputCellsPageNumber) - 1) * Number(outputCellsPageSize)}
          />
        )}
        <Pagination
          currentPage={Number(outputCellsPageNumber)}
          totalPages={txOutputsQuery.isSuccess ? Math.ceil(txOutputsQuery.data.total / Number(outputCellsPageSize)) : 1}
          onChange={handleOutputCellsPageChange}
        />
      </div>
    </>
  )
}
