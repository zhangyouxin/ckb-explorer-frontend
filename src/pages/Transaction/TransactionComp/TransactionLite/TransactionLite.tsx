/* eslint-disable react/no-array-index-key */
import { FC } from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import styles from './TransactionLite.module.scss'
import DecimalCapacity from '../../../../components/DecimalCapacity'
import { parseCKBAmount, localeNumberString } from '../../../../utils/number'
import { shannonToCkb } from '../../../../utils/util'
import { Addr } from '../../TransactionCell'
import { defaultTransactionLiteDetails } from '../../state'
import { TransactionBadge } from './TransactionBadge'
import { fetchTransactionLiteDetailsByHash } from '../../../../services/ExplorerService/fetcher'

export const TransactionCompLite: FC<{ isCellbase: boolean }> = ({ isCellbase }) => {
  const { hash: txHash } = useParams<{ hash: string }>()

  const query = useQuery(['ckb_transaction_details', txHash], async () => {
    const ckbTransactionDetails = await fetchTransactionLiteDetailsByHash(txHash)
    return ckbTransactionDetails.data
  })
  const transactionLiteDetails: State.TransactionLiteDetails[] = query.data ?? defaultTransactionLiteDetails
  return (
    <>
      {transactionLiteDetails &&
        transactionLiteDetails.map(item => (
          <div className="transaction_lite" key={item.address}>
            <div className={styles.transactionLiteBox}>
              <div className={styles.transactionLiteBoxHeader}>
                <div className={styles.transactionLiteBoxHeaderAddr}>
                  <Addr address={item.address} isCellBase={isCellbase} />
                </div>
              </div>
              <div className={styles.transactionLiteBoxContent}>
                {item.transfers.map((transfer, index) => {
                  const transferCapacity = new BigNumber(transfer.capacity)
                  const isIncome = transferCapacity.isPositive()
                  return (
                    <div key={`transfer-${index}`}>
                      {/* only show token info on first line of transfer details */}
                      {index === 0 ? <div>CKB</div> : <div />}
                      <div className={styles.addressDetailLite}>
                        <TransactionBadge cellType={transfer.cellType} capacity={parseCKBAmount(transfer.capacity)} />
                        <div className={styles.capacityChange}>
                          <span className={isIncome ? styles.add : styles.subtraction}>{isIncome ? '+' : ''}</span>
                          <DecimalCapacity
                            balanceChangeType={isIncome ? 'income' : 'payment'}
                            value={localeNumberString(shannonToCkb(transfer.capacity))}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
    </>
  )
}
