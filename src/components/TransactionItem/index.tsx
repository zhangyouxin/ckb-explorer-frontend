import { ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import RightArrowIcon from './input_arrow_output.png'
import DownArrowIcon from './input_arrow_output_down.png'
import { localeNumberString } from '../../utils/number'
import TransactionCell from './TransactionItemCell'
import TransactionCellList from './TransactionItemCellList'
import TransactionIncome from './TransactionIncome'
import { FullPanel, TransactionHashBlockPanel, TransactionCellPanel, TransactionPanel } from './styled'
import { CellType } from '../../constants/common'
import AddressText from '../AddressText'
import { useIsLGScreen, useParsedDate } from '../../hooks'
import { Transaction } from '../../models/Transaction'
import { explorerService } from '../../services/ExplorerService'
import Pagination from '../Pagination'

export interface CircleCorner {
  top?: boolean
  bottom?: boolean
}

const TransactionItem = ({
  transaction,
  address,
  isBlock = false,
  titleCard,
  circleCorner = {
    top: false,
    bottom: false,
  },
  scrollIntoViewOnMount,
}: {
  transaction: Transaction
  address?: string
  isBlock?: boolean
  titleCard?: ReactNode | null
  circleCorner?: CircleCorner
  scrollIntoViewOnMount?: boolean
}) => {
  const isLG = useIsLGScreen()
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
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
    return result
  })

  useEffect(() => {
    const el = ref.current
    if (el && scrollIntoViewOnMount) {
      const style = getComputedStyle(ref.current)
      const navbarHeight = parseInt(style.getPropertyValue('--navbar-height'), 10)
      const marginTop = parseInt(style.getPropertyValue('margin-top'), 10)
      const y = el.getBoundingClientRect().top + window.pageYOffset - navbarHeight - marginTop
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const parsedBlockCreateAt = useParsedDate(transaction.blockTimestamp)

  return (
    <TransactionPanel ref={ref} circleCorner={circleCorner}>
      {titleCard}
      <TransactionHashBlockPanel>
        <div className="transactionItemContent">
          <AddressText
            disableTooltip
            className="transactionItemHash"
            linkProps={{
              to: `/transaction/${transaction.transactionHash}`,
            }}
          >
            {transaction.transactionHash}
          </AddressText>
          {!isBlock && (
            <div className="transactionItemBlock">
              {`(${t('block.block')} ${localeNumberString(transaction.blockNumber)})  ${parsedBlockCreateAt}`}
            </div>
          )}
        </div>
      </TransactionHashBlockPanel>
      <TransactionCellPanel>
        <div className="transactionItemInput">
          <TransactionCellList
            cells={txInputsQuery.isSuccess ? txInputsQuery.data.data : []}
            transaction={transaction}
            render={cell => <TransactionCell cell={cell} address={address} cellType={CellType.Input} key={cell.id} />}
          />
          {txInputsQuery.isSuccess && txInputsQuery.data.total > PAGE_SIZE && (
            <Pagination
              currentPage={inputCellsPage}
              totalPages={txInputsQuery.isSuccess ? Math.ceil(txInputsQuery.data.total / PAGE_SIZE) : 1}
              onChange={setInputCellsPage}
            />
          )}
        </div>
        <img src={isLG ? DownArrowIcon : RightArrowIcon} alt="input and output" />
        <div className="transactionItemOutput">
          {txOutputsQuery.isSuccess && txOutputsQuery.data.total > 0 ? (
            <TransactionCellList
              cells={txOutputsQuery.data.data}
              transaction={transaction}
              render={cell => (
                <FullPanel key={cell.id}>
                  <TransactionCell cell={cell} address={address} cellType={CellType.Output} />
                </FullPanel>
              )}
            />
          ) : (
            <div className="transactionItemOutputEmpty">{t('transaction.empty_output')}</div>
          )}
          {txOutputsQuery.isSuccess && txOutputsQuery.data.total > PAGE_SIZE && (
            <Pagination
              currentPage={outputCellsPage}
              totalPages={txOutputsQuery.isSuccess ? Math.ceil(txOutputsQuery.data.total / PAGE_SIZE) : 1}
              onChange={setOutputCellsPage}
            />
          )}
        </div>
      </TransactionCellPanel>
      {address && <TransactionIncome income={transaction.income} />}
    </TransactionPanel>
  )
}

export default TransactionItem
