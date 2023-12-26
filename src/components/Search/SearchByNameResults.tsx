import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import { UDTQueryResult } from '../../services/ExplorerService/fetcher'
import styles from './SearchByNameResults.module.scss'
import EllipsisMiddle from '../EllipsisMiddle'
import Loading from '../Loading'

type Props = {
  loading?: boolean
  udtQueryResults: UDTQueryResult[] | null
}

export const SearchByNameResults = (props: Props) => {
  const { udtQueryResults, loading } = props
  if (loading) {
    return (
      <div className={styles.searchResultsPanelWrapper}>
        <Loading show className={styles.loadingWrapper} />
      </div>
    )
  }
  if (udtQueryResults) {
    return (
      <div className={styles.searchResultsPanelWrapper}>
        {udtQueryResults.length === 0 ? (
          <EmptySearchByNameResult />
        ) : (
          udtQueryResults.map(item => {
            return <SearchByNameResult key={item.typeHash} item={item} />
          })
        )}
      </div>
    )
  }
  return null
}

const EmptySearchByNameResult = () => {
  const { t } = useTranslation()
  return <>{t('search.no_search_result')}</>
}

const SearchByNameResult = (props: { item: UDTQueryResult }) => {
  const { t } = useTranslation()
  const { item } = props
  const { typeHash, fullName } = item
  return (
    <a className={styles.searchResult} href={`${window.origin}/sudt/${typeHash}`}>
      <EllipsisMiddle className={styles.tokenSymbol}>{fullName ?? t('udt.unknown_token')}</EllipsisMiddle>
      <EllipsisMiddle className={classNames(styles.typeHash, 'monospace')}>{typeHash}</EllipsisMiddle>
    </a>
  )
}