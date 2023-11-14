import { useTranslation } from 'react-i18next'
import { UDTQueryResult } from '../../services/ExplorerService/fetcher'
import styles from './SearchByNameResults.module.scss'
import { truncateHash } from '../../utils/string'

type Props = {
  udtQueryResults: UDTQueryResult[]
  truncateTypeHash?: boolean
}

export const SearchByNameResults = (props: Props) => {
  const { udtQueryResults, truncateTypeHash } = props
  return (
    <div className={styles.searchResultsPanelWrapper}>
      {udtQueryResults.length === 0 ? (
        <EmptySearchByNameResult />
      ) : (
        udtQueryResults.map(item => {
          return <SearchByNameResult key={item.typeHash} item={item} truncateTypeHash={truncateTypeHash} />
        })
      )}
    </div>
  )
}

const EmptySearchByNameResult = () => {
  const { t } = useTranslation()
  return <>{t('search.no_search_result')}</>
}

const SearchByNameResult = (props: { item: UDTQueryResult; truncateTypeHash?: boolean }) => {
  const { t } = useTranslation()
  const { item, truncateTypeHash } = props
  const { typeHash, symbol } = item
  const displayTypeHash = truncateTypeHash ? truncateHash(typeHash) : typeHash
  return (
    <>
      <a className={styles.searchResult} href={`${window.origin}/sudt/${typeHash}`}>
        {symbol ?? t('udt.unknown_token')}
        <span className={styles.typeHash}>{displayTypeHash}</span>
      </a>
      <div className={styles.divider} />
    </>
  )
}
