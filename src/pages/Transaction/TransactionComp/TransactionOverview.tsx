/* eslint-disable react/no-array-index-key */
import { useState, ReactNode, FC } from 'react'
import { Link } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import { Trans } from 'react-i18next'
import OverviewCard, { OverviewItemData } from '../../../components/Card/OverviewCard'
import DecimalCapacity from '../../../components/DecimalCapacity'
import HashTag from '../../../components/HashTag'
import { HelpTip } from '../../../components/HelpTip'
import SimpleButton from '../../../components/SimpleButton'
import ComparedToMaxTooltip from '../../../components/Tooltip/ComparedToMaxTooltip'
import { LayoutLiteProfessional } from '../../../constants/common'
import { useAppState } from '../../../contexts/providers'
import { isMainnet } from '../../../utils/chain'
import { parseSimpleDate } from '../../../utils/date'
import i18n from '../../../utils/i18n'
import ArrowUpIcon from '../../../assets/arrow_up.png'
import ArrowDownIcon from '../../../assets/arrow_down.png'
import ArrowUpBlueIcon from '../../../assets/arrow_up_blue.png'
import ArrowDownBlueIcon from '../../../assets/arrow_down_blue.png'
import { localeNumberString } from '../../../utils/number'
import { shannonToCkb, formatConfirmation, matchTxHash } from '../../../utils/util'
import {
  TransactionBlockHeightPanel,
  TransactionInfoContentItem,
  TransactionInfoContentPanel,
  TransactionOverviewPanel,
  TransactionInfoItemPanel,
} from './styled'

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
  tooltip,
  value,
  valueTooltip,
  linkUrl,
  tag,
}: {
  title?: string
  tooltip?: string
  value: string | ReactNode
  valueTooltip?: string
  linkUrl?: string
  tag?: ReactNode
}) => (
  <TransactionInfoContentItem>
    <div className="transaction__info__content_title">
      {title ? (
        <>
          <span>{title}</span>
          {tooltip && <HelpTip title={tooltip} />}
          <span>:</span>
        </>
      ) : (
        ''
      )}
    </div>
    <div className="transaction__info__content_container monospace">
      <div className="transaction__info__content_value">
        {linkUrl ? (
          <Link to={linkUrl} className="monospace">
            {value}
          </Link>
        ) : (
          value
        )}
        {valueTooltip && <HelpTip title={valueTooltip} />}
      </div>
      {tag && <div className="transaction__info__content__tag">{tag}</div>}
    </div>
  </TransactionInfoContentItem>
)

const TransactionInfoItemWrapper = ({
  title,
  tooltip,
  value,
  linkUrl,
}: {
  title?: string
  tooltip?: string
  value: string | ReactNode
  linkUrl?: string
}) => (
  <TransactionInfoContentPanel>
    <TransactionInfoItem title={title} tooltip={tooltip} value={value} linkUrl={linkUrl} />
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
    tooltip: i18n.t('glossary.block_height'),
    content: <TransactionBlockHeight blockNumber={blockNumber} txStatus={txStatus} />,
  }
  const timestampData: OverviewItemData = {
    title: i18n.t('block.timestamp'),
    tooltip: i18n.t('glossary.timestamp'),
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
    tooltip: i18n.t('glossary.transaction_status'),
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
  const overviewItems: Array<OverviewItemData> = []
  if (txStatus === 'committed') {
    overviewItems.push(blockHeightData, timestampData)
    if (confirmation >= 0) {
      if (isProfessional) {
        overviewItems.push(bytes ? feeWithFeeRateData : txFeeData, txStatusData)
      } else {
        overviewItems.push(txStatusData)
      }
    }
  } else if (txStatus === 'rejected') {
    overviewItems.push(
      blockHeightData,
      {
        ...timestampData,
        content: 'Rejected',
      },
      {
        ...txStatusData,
        content: 'Rejected',
        valueTooltip: detailedMessage,
      },
    )
  } else {
    // pending
    overviewItems.push(
      {
        ...blockHeightData,
        content: '···',
      },
      {
        ...timestampData,
        content: '···',
      },
      {
        ...txStatusData,
        content: 'Pending',
      },
    )
  }
  if (isProfessional) {
    overviewItems.push(liteTxSizeData, liteTxCyclesData)
  }
  const TransactionParams = [
    {
      title: i18n.t('transaction.cell_deps'),
      tooltip: (
        <Trans
          i18nKey="glossary.cell_deps"
          components={{
            link1: (
              // eslint-disable-next-line jsx-a11y/control-has-associated-label, jsx-a11y/anchor-has-content
              <a
                href="https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0022-transaction-structure/0022-transaction-structure.md#code-locating"
                target="_blank"
                rel="noreferrer"
              />
            ),
          }}
        />
      ),
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
                  tooltip={i18n.t('glossary.out_point_tx_hash')}
                  value={txHash}
                  linkUrl={`/transaction/${txHash}`}
                  tag={hashTag && <HashTag content={hashTag.tag} category={hashTag.category} />}
                />
                <TransactionInfoItem
                  title={i18n.t('transaction.out_point_index')}
                  tooltip={i18n.t('glossary.out_point_index')}
                  value={index}
                />
                <TransactionInfoItem
                  title={i18n.t('transaction.dep_type')}
                  tooltip={i18n.t('glossary.dep_type')}
                  value={depType}
                  valueTooltip={depType === 'dep_group' ? i18n.t('glossary.dep_group') : undefined}
                />
              </TransactionInfoContentPanel>
            )
          })
        ) : (
          <TransactionInfoItemWrapper title="CellDep" value="[ ]" />
        ),
    },
    {
      title: i18n.t('transaction.header_deps'),
      tooltip: i18n.t('glossary.header_deps'),
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
      tooltip: i18n.t('glossary.witnesses'),
      content:
        witnesses && witnesses.length > 0 ? (
          witnesses.map((witness, index) => (
            <TransactionInfoItemWrapper
              key={`${witness}-${index}`}
              title="Witness"
              tooltip={i18n.t('glossary.witness')}
              value={witness}
            />
          ))
        ) : (
          <TransactionInfoItemWrapper title="Witness" tooltip={i18n.t('glossary.witness')} value="[ ]" />
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
                    <div className="transaction__info_title">
                      <span>{item.title}</span>
                      {item.tooltip && <HelpTip title={item.tooltip} />}
                    </div>
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
