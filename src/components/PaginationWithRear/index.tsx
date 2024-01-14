import { ReactNode } from 'react'
import classNames from 'classnames'
import Pagination from '../Pagination'
import styles from './styles.module.scss'

const PaginationWithRear = ({
  currentPage,
  totalPages,
  onChange,
  paginationClassName,
  onPageSizeChange,
  pageSize,
  rear,
}: {
  currentPage: number
  totalPages: number
  pageSize?: number
  onChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  paginationClassName?: string
  rear: ReactNode
}) => {
  return (
    <div className={classNames(styles.paginationWithRear, { [styles.withPagination]: totalPages > 1 })}>
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          onPageNumberChange={onChange}
          className={classNames(styles.pagination, paginationClassName)}
        />
      )}
      <div className={styles.rear}>{rear}</div>
    </div>
  )
}

export default PaginationWithRear
