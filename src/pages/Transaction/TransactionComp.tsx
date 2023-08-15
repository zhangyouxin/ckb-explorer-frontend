/* eslint-disable react/no-array-index-key */
import { useState, ReactNode, FC } from 'react'
import { useQuery } from 'react-query'
import { Tooltip } from 'antd'
import { Link, useParams } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import OverviewCard, { OverviewItemData } from '../../components/Card/OverviewCard'
import { useAppState } from '../../contexts/providers/index'
import { parseSimpleDate } from '../../utils/date'
import i18n from '../../utils/i18n'
import { localeNumberString } from '../../utils/number'
import { formatConfirmation, shannonToCkb, matchTxHash, isDaoWithdrawCell } from '../../utils/util'
import { Addr } from './TransactionCell'
import {
  TransactionBlockHeightPanel,
  TransactionInfoContentPanel,
  TransactionOverviewPanel,
  TransactionInfoContentItem,
  TransactionInfoItemPanel,
} from './styled'
import TransactionCellList from './TransactionCellList'
import DecimalCapacity from '../../components/DecimalCapacity'
import ArrowUpIcon from '../../assets/arrow_up.png'
import ArrowDownIcon from '../../assets/arrow_down.png'
import ArrowUpBlueIcon from '../../assets/arrow_up_blue.png'
import ArrowDownBlueIcon from '../../assets/arrow_down_blue.png'
import { isMainnet } from '../../utils/chain'
import SimpleButton from '../../components/SimpleButton'
import HashTag from '../../components/HashTag'
import { useAddrFormatToggle } from '../../utils/hook'
import ComparedToMaxTooltip from '../../components/Tooltip/ComparedToMaxTooltip'
import styles from './styles.module.scss'
import { defaultTransactionLiteDetails } from './state'
import { fetchTransactionLiteDetailsByHash } from '../../service/http/fetcher'
import { LayoutLiteProfessional } from '../../constants/common'

const showTxStatus = (txStatus: string) => txStatus?.replace(/^\S/, s => s.toUpperCase()) ?? '-'

const TransactionBlockHeight = ({ blockNumber, txStatus }: { blockNumber: number; txStatus: string }) => (
  <TransactionBlockHeightPanel>
    {txStatus === 'committed' ? (
      <Link to={`/block/${blockNumber}`}>{localeNumberString(blockNumber)}</Link>
    ) : (
      <span>{showTxStatus(txStatus)}</span>
    )}
  </TransactionBlockHeightPanel>
)

const transactionParamsIcon = (show: boolean) => {
  if (show) {
    return isMainnet() ? ArrowUpIcon : ArrowUpBlueIcon
  }
  return isMainnet() ? ArrowDownIcon : ArrowDownBlueIcon
}

const TransactionInfoItem = ({
  title,
  value,
  linkUrl,
  tag,
}: {
  title?: string
  value: string | ReactNode
  linkUrl?: string
  tag?: ReactNode
}) => (
  <TransactionInfoContentItem>
    <div className="transaction__info__content_title">{title ? `${title}: ` : ''}</div>
    <div className="transaction__info__content_container monospace">
      <div className="transaction__info__content_value">
        {linkUrl ? (
          <Link to={linkUrl} className="monospace">
            {value}
          </Link>
        ) : (
          value
        )}
      </div>
      {tag && <div className="transaction__info__content__tag">{tag}</div>}
    </div>
  </TransactionInfoContentItem>
)

const TransactionInfoItemWrapper = ({
  title,
  value,
  linkUrl,
}: {
  title?: string
  value: string | ReactNode
  linkUrl?: string
}) => (
  <TransactionInfoContentPanel>
    <TransactionInfoItem title={title} value={value} linkUrl={linkUrl} />
  </TransactionInfoContentPanel>
)

export const TransactionOverview: FC<{ transaction: State.Transaction; layout: LayoutLiteProfessional }> = ({
  transaction,
  layout,
}) => {
  const [showParams, setShowParams] = useState<boolean>(false)
  const {
    app: { tipBlockNumber },
  } = useAppState()
  const {
    blockNumber,
    cellDeps,
    headerDeps,
    witnesses,
    blockTimestamp,
    transactionFee,
    txStatus,
    detailedMessage,
    bytes,
    largestTxInEpoch,
    largestTx,
    cycles,
    maxCyclesInEpoch,
    maxCycles,
  } = transaction

  let confirmation = 0
  const isProfessional = layout === LayoutLiteProfessional.Professional

  if (tipBlockNumber && blockNumber) {
    confirmation = tipBlockNumber - blockNumber
  }

  const blockHeightData: OverviewItemData = {
    title: i18n.t('block.block_height'),
    content: <TransactionBlockHeight blockNumber={blockNumber} txStatus={txStatus} />,
  }
  const timestampData: OverviewItemData = {
    title: i18n.t('block.timestamp'),
    content: parseSimpleDate(blockTimestamp),
  }
  const feeWithFeeRateData: OverviewItemData = {
    title: `${i18n.t('transaction.transaction_fee')} | ${i18n.t('transaction.fee_rate')}`,
    content: (
      <div
        style={{
          display: 'flex',
        }}
      >
        <DecimalCapacity value={localeNumberString(shannonToCkb(transactionFee))} />
        <span
          style={{
            whiteSpace: 'pre',
          }}
        >{` | ${new BigNumber(transactionFee).multipliedBy(1000).dividedToIntegerBy(bytes).toFormat({
          groupSeparator: ',',
          groupSize: 3,
        })} shannons/kB`}</span>
      </div>
    ),
  }
  const txFeeData: OverviewItemData = {
    title: i18n.t('transaction.transaction_fee'),
    content: <DecimalCapacity value={localeNumberString(shannonToCkb(transactionFee))} />,
  }
  const txStatusData: OverviewItemData = {
    title: i18n.t('transaction.status'),
    content: formatConfirmation(confirmation),
  }

  const liteTxSizeDataContent = bytes ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {`${(bytes - 4).toLocaleString('en')} Bytes`}
      <ComparedToMaxTooltip
        numerator={bytes}
        maxInEpoch={largestTxInEpoch}
        maxInChain={largestTx}
        titleInEpoch={i18n.t('transaction.compared_to_the_max_size_in_epoch')}
        titleInChain={i18n.t('transaction.compared_to_the_max_size_in_chain')}
        unit="Bytes"
      >
        {i18n.t('transaction.size_in_block', {
          bytes: bytes.toLocaleString('en'),
        })}
      </ComparedToMaxTooltip>
    </div>
  ) : (
    ''
  )
  const liteTxSizeData: OverviewItemData = {
    title: i18n.t('transaction.size'),
    content: liteTxSizeDataContent,
  }
  const liteTxCyclesDataContent = cycles ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {`${cycles.toLocaleString('en')}`}
      <ComparedToMaxTooltip
        numerator={cycles}
        maxInEpoch={maxCyclesInEpoch}
        maxInChain={maxCycles}
        titleInEpoch={i18n.t('transaction.compared_to_the_max_cycles_in_epoch')}
        titleInChain={i18n.t('transaction.compared_to_the_max_cycles_in_chain')}
      />
    </div>
  ) : (
    '-'
  )
  const liteTxCyclesData: OverviewItemData = {
    title: i18n.t('transaction.cycles'),
    content: liteTxCyclesDataContent,
  }
  const overviewItems: Array<OverviewItemData> = [blockHeightData]
  if (txStatus === 'committed') {
    if (confirmation >= 0) {
      if (isProfessional) {
        overviewItems.push(timestampData, bytes ? feeWithFeeRateData : txFeeData, txStatusData)
      } else {
        overviewItems.push(timestampData, txStatusData)
      }
    }
  } else {
    overviewItems.push(timestampData, txFeeData, {
      ...txStatusData,
      valueTooltip: txStatus === 'rejected' ? detailedMessage : undefined,
    })
  }
  if (isProfessional) {
    overviewItems.push(liteTxSizeData, liteTxCyclesData)
  }
  const TransactionParams = [
    {
      title: i18n.t('transaction.cell_deps'),
      content:
        cellDeps && cellDeps.length > 0 ? (
          cellDeps.map(cellDep => {
            const {
              outPoint: { txHash, index },
              depType,
            } = cellDep
            const hashTag = matchTxHash(txHash, index)
            return (
              <TransactionInfoContentPanel key={`${txHash}${index}`}>
                <TransactionInfoItem
                  title={i18n.t('transaction.out_point_tx_hash')}
                  value={txHash}
                  linkUrl={`/transaction/${txHash}`}
                  tag={hashTag && <HashTag content={hashTag.tag} category={hashTag.category} />}
                />
                <TransactionInfoItem title={i18n.t('transaction.out_point_index')} value={index} />
                <TransactionInfoItem title={i18n.t('transaction.dep_type')} value={depType} />
              </TransactionInfoContentPanel>
            )
          })
        ) : (
          <TransactionInfoItemWrapper title="CellDep" value="[ ]" />
        ),
    },
    {
      title: i18n.t('transaction.header_deps'),
      content:
        headerDeps && headerDeps.length > 0 ? (
          headerDeps.map(headerDep => (
            <TransactionInfoItemWrapper
              key={headerDep}
              title={i18n.t('transaction.header_dep')}
              value={headerDep}
              linkUrl={`/block/${headerDep}`}
            />
          ))
        ) : (
          <TransactionInfoItemWrapper title={i18n.t('transaction.header_dep')} value="[ ]" />
        ),
    },
    {
      title: i18n.t('transaction.witnesses'),
      content:
        witnesses && witnesses.length > 0 ? (
          witnesses.map((witness, index) => (
            <TransactionInfoItemWrapper key={`${witness}-${index}`} title="Witness" value={witness} />
          ))
        ) : (
          <TransactionInfoItemWrapper title="Witness" value="[ ]" />
        ),
    },
  ]

  return (
    <TransactionOverviewPanel>
      <OverviewCard items={overviewItems} hideShadow>
        {isProfessional && (
          <div className="transaction__overview_info">
            <SimpleButton className="transaction__overview_parameters" onClick={() => setShowParams(!showParams)}>
              <div>{i18n.t('transaction.transaction_parameters')}</div>
              <img alt="transaction parameters" src={transactionParamsIcon(showParams)} />
            </SimpleButton>
            {showParams && (
              <div className="transaction__overview_params">
                {TransactionParams.map(item => (
                  <TransactionInfoItemPanel key={item.title}>
                    <div className="transaction__info_title">{item.title}</div>
                    <div className="transaction__info_value">{item.content}</div>
                  </TransactionInfoItemPanel>
                ))}
              </div>
            )}
          </div>
        )}
      </OverviewCard>
    </TransactionOverviewPanel>
  )
}

const handleCellbaseInputs = (inputs: State.Cell[], outputs: State.Cell[]) => {
  if (inputs[0] && inputs[0].fromCellbase && outputs[0] && outputs[0].baseReward) {
    const resultInputs = inputs
    resultInputs[0] = {
      ...resultInputs[0],
      baseReward: outputs[0].baseReward,
      secondaryReward: outputs[0].secondaryReward,
      commitReward: outputs[0].commitReward,
      proposalReward: outputs[0].proposalReward,
    }
    return resultInputs
  }
  return inputs
}

export const TransactionCompLite: FC<{ transaction: State.Transaction }> = ({ transaction }) => {
  const { hash: txHash } = useParams<{ hash: string }>()
  const { isCellbase } = transaction

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
                  return (
                    <div key={`transfer-${index}`}>
                      <div>{transfer.tokenName}</div>
                      <div className={styles.addressDetailLite}>
                        {(transfer.transferType && transfer.transferType === 'nervos_dao_deposit') ||
                        transfer.transferType === 'nervos_dao_withdrawing' ? (
                          <Tooltip
                            placement="top"
                            title={
                              <div>
                                {transfer.transferType === 'nervos_dao_deposit'
                                  ? i18n.t('transaction.nervos_dao_deposit')
                                  : i18n.t('transaction.nervos_dao_withdraw')}
                              </div>
                            }
                          >
                            <span className={styles.tag}>
                              {isDaoWithdrawCell(transfer.transferType)
                                ? i18n.t('nervos_dao.withdraw_tooltip')
                                : i18n.t('nervos_dao.withdraw_request_tooltip')}
                            </span>
                          </Tooltip>
                        ) : null}
                        {transfer.transferType === 'nft_transfer' ? (
                          <span className={styles.nftId}>-ID : {transfer.nftId}</span>
                        ) : (
                          <div>
                            <span className={transfer.capacity > 0 ? styles.add : styles.subtraction}>
                              {transfer.capacity > 0 ? '+' : ''}
                            </span>
                            <DecimalCapacity
                              balanceChangeType={transfer.capacity > 0 ? 'income' : 'payment'}
                              value={localeNumberString(shannonToCkb(transfer.capacity))}
                            />
                          </div>
                        )}
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

export default ({ transaction }: { transaction: State.Transaction }) => {
  const { transactionHash, displayInputs, displayOutputs, blockNumber, isCellbase, txStatus } = transaction

  const { isNew: isAddrNew, setIsNew: setIsAddrNew } = useAddrFormatToggle()
  const inputs = handleCellbaseInputs(displayInputs, displayOutputs)

  /// [0, 11] block doesn't show block reward and only cellbase show block reward
  return (
    <>
      <div className="transaction__inputs">
        {inputs && (
          <TransactionCellList
            inputs={inputs}
            showReward={blockNumber > 0 && isCellbase}
            txStatus={txStatus}
            addrToggle={{
              isAddrNew,
              setIsAddrNew,
            }}
          />
        )}
      </div>
      <div className="transaction__outputs">
        {displayOutputs && (
          <TransactionCellList
            outputs={displayOutputs}
            txHash={transactionHash}
            txStatus={txStatus}
            addrToggle={{
              isAddrNew,
              setIsAddrNew,
            }}
          />
        )}
      </div>
    </>
  )
}
