import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PaginationLeftItem, PaginationRightItem, PaginationPanel } from './styled'
import LeftBlack from './pagination_black_left.png'
import RightBlack from './pagination_black_right.png'
import LeftGrey from './pagination_grey_left.png'
import RightGrey from './pagination_grey_right.png'
import { useIsMobile } from '../../hooks'
import SimpleButton from '../SimpleButton'
import { HelpTip } from '../HelpTip'
import styles from './index.module.scss'

const Pagination = ({
  currentPage,
  totalPages,
  gotoPage = currentPage === totalPages ? totalPages : currentPage + 1,
  onPageNumberChange: onChange,
  onPageSizeChange,
  pageSize = 10,
  className,
  annotation,
}: {
  currentPage: number
  pageSize?: number
  totalPages: number
  gotoPage?: number
  onPageNumberChange: (pageNumber: number) => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
  annotation?: string
}) => {
  const isMobile = useIsMobile()
  const { t } = useTranslation()
  const [inputPage, setInputPage] = useState(gotoPage)
  const [inputPageSize, setInputPageSize] = useState(pageSize)

  const total = Math.max(totalPages, 1)
  const current = Math.min(Math.max(currentPage, 1), totalPages)

  const mobilePagination = `${t('pagination.total_page')} ${total} ${t('pagination.end_page')}`
  const pcPagination = `${t('pagination.current_page')} ${current} ${t('pagination.of_page')} ${total} ${t(
    'pagination.end_page',
  )}`

  const annotationComp = annotation ? <HelpTip title={annotation} iconProps={{ alt: 'annotation' }} /> : null

  const changePage = (page: number) => {
    if (page && page >= 1 && page <= total) {
      onChange(page)
      setInputPage(Math.min(page + 1, total))
    }
  }

  const changePageSize = (pageSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(pageSize)
    }
    setInputPageSize(pageSize)
  }

  return (
    <PaginationPanel className={className}>
      <PaginationLeftItem isFirstPage={current === 1} isLastPage={current === total}>
        <SimpleButton className="paginationFirstButton" onClick={() => changePage(1)}>
          {t('pagination.first')}
        </SimpleButton>
        <SimpleButton className="paginationLeftButton" onClick={() => changePage(current - 1)}>
          <img src={current === 1 ? LeftGrey : LeftBlack} alt="left button" />
        </SimpleButton>

        {!isMobile && (
          <span className="paginationMiddleLabel">
            {pcPagination}
            {annotationComp}
          </span>
        )}
        <SimpleButton className="paginationRightButton" onClick={() => changePage(current + 1)}>
          <img src={current === total ? RightGrey : RightBlack} alt="right button" />
        </SimpleButton>
        {isMobile && (
          <span className="paginationMiddleLabel">
            {mobilePagination}
            {annotationComp}
          </span>
        )}

        <SimpleButton className="paginationLastButton" onClick={() => changePage(total)}>
          {t('pagination.last')}
        </SimpleButton>
        {!isMobile && (
          <>
            <span className={styles.pageSize}>{t('pagination.page_size')}</span>
            <input
              type="text"
              pattern="[0-9]*"
              className={styles.pageSizeInput}
              value={inputPageSize}
              onChange={event => {
                const value = parseInt(event.target.value, 10)
                if (!Number.isNaN(value)) {
                  setInputPageSize(value)
                }
              }}
              onKeyUp={event => {
                if (event.keyCode === 13) {
                  changePageSize(inputPageSize)
                }
              }}
            />
          </>
        )}
      </PaginationLeftItem>
      <PaginationRightItem>
        <span className="paginationPageLabel">{t('pagination.page')}</span>
        <input
          type="text"
          pattern="[0-9]*"
          className="paginationInputPage"
          value={inputPage}
          onChange={event => {
            const pageNo = parseInt(event.target.value, 10)
            setInputPage(Number.isNaN(pageNo) ? Number(event.target.value) : Math.min(pageNo, total))
          }}
          onKeyUp={event => {
            if (event.keyCode === 13) {
              changePage(inputPage)
            }
          }}
        />
        <SimpleButton className="paginationGotoPage" onClick={() => changePage(inputPage)}>
          {t('pagination.goto')}
        </SimpleButton>
      </PaginationRightItem>
    </PaginationPanel>
  )
}

export default Pagination
