import { useTranslation } from 'react-i18next'
import TransactionItem from '../../../components/TransactionItem'
import { TransactionsPagination, DAONoResultPanel } from './styled'
import Pagination from '../../../components/Pagination'
import { PageParams } from '../../../constants/common'
import { Transaction } from '../../../models/Transaction'

export default ({
  currentPage = 1,
  pageSize = PageParams.PageSize,
  transactions,
  total,
  onPageChange,
  filterNoResult,
}: {
  currentPage: number
  pageSize: number
  transactions: Transaction[]
  total: number
  onPageChange: (page: number) => void
  filterNoResult?: boolean
}) => {
  const { t } = useTranslation()
  const totalPages = Math.ceil(total / pageSize)

  if (filterNoResult) {
    return (
      <DAONoResultPanel>
        <span>{t('search.dao_filter_no_result')}</span>
      </DAONoResultPanel>
    )
  }

  return (
    <>
      {transactions.map(
        (transaction: Transaction, index: number) =>
          transaction && (
            <TransactionItem
              key={transaction.transactionHash}
              transaction={transaction}
              circleCorner={{
                bottom: index === transactions.length - 1 && totalPages === 1,
              }}
            />
          ),
      )}
      {totalPages > 1 && (
        <TransactionsPagination>
          <Pagination currentPage={currentPage} totalPages={totalPages} onChange={onPageChange} />
        </TransactionsPagination>
      )}
    </>
  )
}
