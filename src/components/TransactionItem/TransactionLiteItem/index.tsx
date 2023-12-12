import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { localeNumberString } from '../../../utils/number'
import AddressText from '../../AddressText'
import styles from './index.module.scss'
import TransactionLiteIncome from '../TransactionLiteIncome'
import { useIsMobile, useParsedDate } from '../../../hooks'
import { Transaction } from '../../../models/Transaction'
import { explorerService } from '../../../services/ExplorerService'

const TransactionLiteItem = ({ transaction, address }: { transaction: Transaction; address?: string }) => {
  const isMobile = useIsMobile()
  const { t } = useTranslation()
  const parsedBlockCreateAt = useParsedDate(transaction.blockTimestamp)

  // refactor to configurable
  const PAGE_SIZE = 10
  const txHash = transaction.transactionHash
  const txInputsQuery = useQuery(['transactionInputs', txHash, 1], async () => {
    const result = await explorerService.api.fetchTransactionInputsByHash(txHash, 1, PAGE_SIZE)
    return result
  })
  const txOutputsQuery = useQuery(['transactionOutputs', txHash, 1], async () => {
    const result = await explorerService.api.fetchTransactionOutputsByHash(txHash, 1, PAGE_SIZE)
    return result
  })

  return (
    <div className={styles.transactionLitePanel}>
      <div className={styles.transactionLiteRow}>
        <div>
          {isMobile && <div>{t('transaction.transaction_hash')}</div>}
          <AddressText
            disableTooltip
            className={styles.transactionLink}
            linkProps={{
              to: `/transaction/${transaction.transactionHash}`,
            }}
          >
            {transaction.transactionHash}
          </AddressText>
        </div>
        <div>
          {isMobile && <div>{t('transaction.height')}</div>}
          <Link className={styles.blockLink} to={`/block/${transaction.blockNumber}`}>
            {localeNumberString(transaction.blockNumber)}
          </Link>
        </div>
        <div>
          {isMobile && <div>{t('transaction.time')}</div>}
          {parsedBlockCreateAt}
        </div>
        <div>
          {isMobile && <div>{`${t('transaction.input')} & ${t('transaction.output')}`}</div>}
          <span>{txInputsQuery.isSuccess && `${t('transaction.input')}: ${txInputsQuery.data.total}`}</span>
          <span>{txOutputsQuery.isSuccess && `${t('transaction.output')}: ${txOutputsQuery.data.total}`}</span>
        </div>
        <div>
          {isMobile && <div>{t('transaction.capacity_change')}</div>}
          {address && <TransactionLiteIncome income={transaction.income} />}
        </div>
      </div>
    </div>
  )
}

export default TransactionLiteItem
