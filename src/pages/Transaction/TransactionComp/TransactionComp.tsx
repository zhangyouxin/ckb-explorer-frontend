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
  const handleInputCellsPageSizeChange = (pageSize: number) => {
    queryParams.set('inputCellsPageSize', pageSize.toString())
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
  const handleOutputCellsPageSizeChange = (pageSize: number) => {
    queryParams.set('outputCellsPageSize', pageSize.toString())
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

  const totalInputsCount = txInputsQuery.data?.meta?.total ?? 0
  const totalOutputsCount = txOutputsQuery.data?.meta?.total ?? 0
  /// [0, 11] block doesn't show block reward and only cellbase show block reward
  return (
    <>
      <div className="transactionInputs">
        {txInputsQuery.isFetching && <Loading show />}
        {inputs && (
          <TransactionCellList
            total={totalInputsCount}
            inputs={inputs}
            showReward={Number(blockNumber) > 0 && isCellbase}
            indiceOffset={(Number(inputCellsPageNumber) - 1) * Number(inputCellsPageSize)}
          />
        )}
        <Pagination
          currentPage={Number(inputCellsPageNumber)}
          pageSize={Number(inputCellsPageSize)}
          totalPages={txInputsQuery.isSuccess ? Math.ceil(totalInputsCount / Number(inputCellsPageSize)) : 1}
          onPageNumberChange={handleInputCellsPageChange}
          onPageSizeChange={handleInputCellsPageSizeChange}
        />
      </div>
      <div className="transactionOutputs">
        {txOutputsQuery.isFetching && <Loading show />}
        {txOutputsQuery.isSuccess && (
          <TransactionCellList
            total={totalOutputsCount}
            outputs={txOutputsQuery.data.data}
            txHash={transactionHash}
            indiceOffset={(Number(outputCellsPageNumber) - 1) * Number(outputCellsPageSize)}
          />
        )}
        <Pagination
          currentPage={Number(outputCellsPageNumber)}
          pageSize={Number(outputCellsPageSize)}
          totalPages={txOutputsQuery.isSuccess ? Math.ceil(totalOutputsCount / Number(outputCellsPageSize)) : 1}
          onPageNumberChange={handleOutputCellsPageChange}
          onPageSizeChange={handleOutputCellsPageSizeChange}
        />
      </div>
    </>
  )
}
