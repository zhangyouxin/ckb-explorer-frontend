/* eslint-disable react/no-array-index-key */
import { FC } from 'react'
import { useQuery } from 'react-query'
import { Tooltip } from 'antd'
import { useParams } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import styles from './transactionComp.module.scss'
import DecimalCapacity from '../../../components/DecimalCapacity'
import { fetchTransactionLiteDetailsByHash } from '../../../service/http/fetcher'
import i18n from '../../../utils/i18n'
import { localeNumberString } from '../../../utils/number'
import { isDaoWithdrawCell, shannonToCkb } from '../../../utils/util'
import { Addr } from '../TransactionCell'
import { defaultTransactionLiteDetails } from '../state'

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
                        {transfer.cellType === 'nervos_dao_deposit' ||
                        transfer.cellType === 'nervos_dao_withdrawing' ? (
                          <Tooltip
                            placement="top"
                            title={
                              <div>
                                {transfer.cellType === 'nervos_dao_deposit'
                                  ? i18n.t('transaction.nervos_dao_deposit')
                                  : i18n.t('transaction.nervos_dao_withdraw')}
                              </div>
                            }
                          >
                            <span className={styles.tag}>
                              {isDaoWithdrawCell(transfer.cellType)
                                ? i18n.t('nervos_dao.withdraw_tooltip')
                                : i18n.t('nervos_dao.withdraw_request_tooltip')}
                            </span>
                          </Tooltip>
                        ) : null}
                        <div>
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
