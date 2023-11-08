import { UdtQueryResult } from '../../services/ExplorerService/fetcher'
import styles from './SearchByNameResults.module.scss'

type Props = {
  udtQueryResults: UdtQueryResult[]
}

export const SearchByNameResults = (props: Props) => {
  const { udtQueryResults } = props
  return (
    <div className={styles.searchResultsPanelWrapper}>
      <div className={styles.searchResultsPanel}>
        {udtQueryResults.map(item => {
          return <SearchByNameResult key={item.typeHash} item={item} />
        })}
      </div>
    </div>
  )
}

const SearchByNameResult = (props: { item: UdtQueryResult }) => {
  const { item } = props
  return <div className={styles.searchResult}>{item.fullName}</div>
}
