import { useState, FC, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Radio } from 'antd'
import { useTranslation } from 'react-i18next'
import TransactionItem from '../../components/TransactionItem/index'
import { explorerService } from '../../services/ExplorerService'
import { localeNumberString } from '../../utils/number'
import { shannonToCkb, deprecatedAddrToNewAddr } from '../../utils/util'
import {
  AddressAssetsTab,
  AddressAssetsTabPane,
  AddressAssetsTabPaneTitle,
  AddressLockScriptController,
  AddressLockScriptPanel,
  AddressTransactionsPanel,
  AddressUDTAssetsPanel,
} from './styled'
import Capacity from '../../components/Capacity'
import CKBTokenIcon from './ckb_token_icon.png'
import { ReactComponent as TimeDownIcon } from './time_down.svg'
import { ReactComponent as TimeUpIcon } from './time_up.svg'
import {
  OrderByType,
  useIsMobile,
  useNewAddr,
  usePaginationParamsInListPage,
  useSearchParams,
  useUpdateSearchParams,
} from '../../hooks'
import styles from './styles.module.scss'
import LiteTransactionList from '../../components/LiteTransactionList'
import Script from '../../components/Script'
import AddressText from '../../components/AddressText'
import { parseSimpleDateNoSecond } from '../../utils/date'
import { isMainnet } from '../../utils/chain'
import ArrowUpIcon from '../../assets/arrow_up.png'
import ArrowUpBlueIcon from '../../assets/arrow_up_blue.png'
import ArrowDownIcon from '../../assets/arrow_down.png'
import ArrowDownBlueIcon from '../../assets/arrow_down_blue.png'
import { LayoutLiteProfessional } from '../../constants/common'
import { omit } from '../../utils/object'
import { CsvExport } from '../../components/CsvExport'
import PaginationWithRear from '../../components/PaginationWithRear'
import { Transaction } from '../../models/Transaction'
import { Address, UDTAccount } from '../../models/Address'
import { Card, CardCellInfo, CardCellsLayout } from '../../components/Card'
import { CardHeader } from '../../components/Card/CardHeader'
import {
  AddressCoTAComp,
  AddressOmigaInscriptionComp,
  AddressMNFTComp,
  AddressSporeComp,
  AddressSudtComp,
} from './AddressAssetComp'

enum AssetInfo {
  UDT = 1,
  INSCRIPTION,
}

const lockScriptIcon = (show: boolean) => {
  if (show) {
    return isMainnet() ? ArrowUpIcon : ArrowUpBlueIcon
  }
  return isMainnet() ? ArrowDownIcon : ArrowDownBlueIcon
}

const AddressLockScript: FC<{ address: Address }> = ({ address }) => {
  const [showLock, setShowLock] = useState<boolean>(false)
  const { t } = useTranslation()

  const { liveCellsCount, minedBlocksCount, type, addressHash, lockInfo } = address
  const overviewItems: CardCellInfo<'left' | 'right'>[] = [
    {
      title: t('address.live_cells'),
      tooltip: t('glossary.live_cells'),
      content: localeNumberString(liveCellsCount),
    },
    {
      title: t('address.block_mined'),
      tooltip: t('glossary.block_mined'),
      content: localeNumberString(minedBlocksCount),
    },
  ]

  if (type === 'LockHash') {
    if (!addressHash) {
      overviewItems.push({
        title: t('address.address'),
        content: t('address.unable_decode_address'),
      })
    } else {
      overviewItems.push({
        title: t('address.address'),
        contentWrapperClass: styles.addressWidthModify,
        content: <AddressText>{addressHash}</AddressText>,
      })
    }
  }
  if (lockInfo && lockInfo.epochNumber !== '0' && lockInfo.estimatedUnlockTime !== '0') {
    const estimate = Number(lockInfo.estimatedUnlockTime) > new Date().getTime() ? t('address.estimated') : ''
    overviewItems.push({
      title: t('address.lock_until'),
      content: `${lockInfo.epochNumber} ${t('address.epoch')} (${estimate} ${parseSimpleDateNoSecond(
        lockInfo.estimatedUnlockTime,
      )})`,
    })
  }

  return (
    <AddressLockScriptPanel className={styles.addressLockScriptPanel}>
      <CardCellsLayout type="left-right" cells={overviewItems} borderTop />
      <AddressLockScriptController onClick={() => setShowLock(!showLock)}>
        <div>{t('address.lock_script')}</div>
        <img alt="lock script" src={lockScriptIcon(showLock)} />
      </AddressLockScriptController>
      {showLock && address.lockScript && <Script script={address.lockScript} />}
    </AddressLockScriptPanel>
  )
}

export const AddressOverviewCard: FC<{ address: Address }> = ({ address }) => {
  const { t, i18n } = useTranslation()
  const { udtAccounts = [] } = address
  const [activeTab, setActiveTab] = useState<AssetInfo>(AssetInfo.UDT)

  const [udts, inscriptions] = udtAccounts.reduce(
    (acc, cur) => {
      switch (cur.udtType) {
        case 'sudt':
        case 'spore_cell':
        case 'm_nft_token':
        case 'cota':
        case 'nrc_721_token':
          acc[0].push(cur)
          break
        case 'omiga_inscription':
          acc[1].push(cur)
          break
        default:
          break
      }
      return acc
    },
    [[] as UDTAccount[], [] as UDTAccount[]],
  )

  const { data: initList } = useQuery(
    ['cota-list', address.addressHash],
    () => explorerService.api.fetchNFTItemByOwner(address.addressHash, 'cota'),
    {
      enabled: !!address?.addressHash,
    },
  )

  const { data: cotaList } = useQuery(['cota-list', initList?.pagination.series], () =>
    Promise.all(
      (initList?.pagination.series ?? []).map(p =>
        explorerService.api.fetchNFTItemByOwner(address.addressHash, 'cota', p),
      ),
    ).then(resList => resList.flatMap(res => res.data)),
  )

  const overviewItems: CardCellInfo<'left' | 'right'>[] = [
    {
      slot: 'left',
      cell: {
        icon: <img src={CKBTokenIcon} alt="item icon" width="100%" />,
        title: t('common.ckb_unit'),
        content: <Capacity capacity={shannonToCkb(address.balance)} />,
      },
    },
    {
      title: t('address.occupied'),
      tooltip: t('glossary.occupied'),
      content: <Capacity capacity={shannonToCkb(address.balanceOccupied)} />,
    },
    {
      title: t('address.dao_deposit'),
      tooltip: t('glossary.nervos_dao_deposit'),
      content: <Capacity capacity={shannonToCkb(address.daoDeposit)} />,
    },
    {
      title: t('address.compensation'),
      content: <Capacity capacity={shannonToCkb(address.daoCompensation)} />,
      tooltip: t('glossary.nervos_dao_compensation'),
    },
  ]

  useEffect(() => {
    if (!udts.length && !cotaList?.length && inscriptions.length) {
      setActiveTab(AssetInfo.INSCRIPTION)
    }
  }, [udts.length, cotaList?.length, inscriptions.length])

  return (
    <Card className={styles.addressOverviewCard}>
      <div className={styles.cardTitle}>{t('address.overview')}</div>

      <CardCellsLayout type="leftSingle-right" cells={overviewItems} borderTop />

      {udts.length > 0 || (cotaList?.length && cotaList.length > 0) || inscriptions.length > 0 ? (
        <AddressUDTAssetsPanel className={styles.addressUDTAssetsPanel}>
          <AddressAssetsTab animated={false} key={i18n.language} activeKey={activeTab.toString()}>
            {(udts.length > 0 || cotaList?.length) && (
              <AddressAssetsTabPane
                tab={
                  <AddressAssetsTabPaneTitle onClick={() => setActiveTab(AssetInfo.UDT)}>
                    {t('address.user_defined_token')}
                  </AddressAssetsTabPaneTitle>
                }
                key={AssetInfo.UDT}
              >
                <div className="addressUdtAssetsGrid">
                  {udts.map(udt => {
                    switch (udt.udtType) {
                      case 'sudt':
                        return <AddressSudtComp account={udt} key={udt.symbol + udt.udtType + udt.amount} />

                      case 'spore_cell':
                        return <AddressSporeComp account={udt} key={udt.symbol + udt.udtType + udt.amount} />

                      case 'm_nft_token':
                        return <AddressMNFTComp account={udt} key={udt.symbol + udt.udtType + udt.amount} />
                      default:
                        return null
                    }
                  })}
                  {cotaList?.map(cota => (
                    <AddressCoTAComp
                      account={{
                        udtType: 'cota',
                        symbol: cota.collection.name,
                        udtIconFile: cota.collection.icon_url ?? '',
                        cota: {
                          cotaId: cota.collection.id,
                          tokenId: Number(cota.token_id),
                        },
                      }}
                      key={cota.collection.id + cota.token_id}
                    />
                  )) ?? null}
                </div>
              </AddressAssetsTabPane>
            )}
            {inscriptions.length > 0 && (
              <AddressAssetsTabPane
                tab={
                  <AddressAssetsTabPaneTitle onClick={() => setActiveTab(AssetInfo.INSCRIPTION)}>
                    {t('address.inscription')}
                  </AddressAssetsTabPaneTitle>
                }
                key={AssetInfo.INSCRIPTION}
              >
                <div className="addressUdtAssetsGrid">
                  {inscriptions.map(inscription => {
                    switch (inscription.udtType) {
                      case 'omiga_inscription':
                        return (
                          <AddressOmigaInscriptionComp
                            account={inscription}
                            key={`${inscription.symbol + inscription.udtType + inscription.udtAmount}`}
                          />
                        )

                      default:
                        return null
                    }
                  })}
                </div>
              </AddressAssetsTabPane>
            )}
          </AddressAssetsTab>
        </AddressUDTAssetsPanel>
      ) : null}

      <AddressLockScript address={address} />
    </Card>
  )
}

// TODO: Adding loading
export const AddressTransactions = ({
  address,
  transactions,
  timeOrderBy,
  meta: { counts },
}: {
  address: string
  transactions: Transaction[]
  timeOrderBy: OrderByType
  meta: { counts: Record<'committed' | 'pending', number | '-'> }
}) => {
  const isMobile = useIsMobile()
  const { t } = useTranslation()
  const { currentPage, pageSize, setPage } = usePaginationParamsInListPage()
  const { Professional, Lite } = LayoutLiteProfessional
  const searchParams = useSearchParams('layout', 'tx_status')
  const defaultLayout = Professional
  const updateSearchParams = useUpdateSearchParams<'layout' | 'sort' | 'tx_type'>()
  const layout = searchParams.layout === Lite ? Lite : defaultLayout

  const txStatus = searchParams.tx_status
  const isPendingListActive = txStatus === 'pending'
  const total = isPendingListActive ? counts.pending : counts.committed
  const totalPages = total === '-' ? 0 : Math.ceil(total / pageSize)

  const onChangeLayout = (layoutType: LayoutLiteProfessional) => {
    updateSearchParams(params =>
      layoutType === defaultLayout
        ? Object.fromEntries(Object.entries(params).filter(entry => entry[0] !== 'layout'))
        : { ...params, layout: layoutType },
    )
  }
  const handleTimeSort = () => {
    updateSearchParams(
      params =>
        timeOrderBy === 'asc' ? omit(params, ['sort', 'tx_type']) : omit({ ...params, sort: 'time' }, ['tx_type']),
      true,
    )
  }

  const newAddr = useNewAddr(address)
  const isNewAddr = newAddr === address
  const txList = isNewAddr
    ? transactions.map(tx => ({
        ...tx,
        displayInputs: tx.displayInputs.map(i => ({
          ...i,
          addressHash: deprecatedAddrToNewAddr(i.addressHash),
        })),
        displayOutputs: tx.displayOutputs.map(o => ({
          ...o,
          addressHash: deprecatedAddrToNewAddr(o.addressHash),
        })),
      }))
    : transactions

  const searchOptionsAndModeSwitch = (
    <div className={styles.searchOptionsAndModeSwitch}>
      <div className={styles.sortAndFilter} data-is-active={timeOrderBy === 'asc'}>
        {timeOrderBy === 'asc' ? <TimeDownIcon onClick={handleTimeSort} /> : <TimeUpIcon onClick={handleTimeSort} />}
      </div>
      <Radio.Group
        className={styles.layoutButtons}
        options={[
          { label: t('transaction.professional'), value: Professional },
          { label: t('transaction.lite'), value: Lite },
        ]}
        onChange={({ target: { value } }) => onChangeLayout(value)}
        value={layout}
        optionType="button"
        buttonStyle="solid"
      />
    </div>
  )

  return (
    <>
      <Card className={styles.transactionListOptionsCard} rounded="top">
        <CardHeader
          className={styles.cardHeader}
          leftContent={
            <div className={styles.txHeaderLabels}>
              <Link
                to={`/address/${address}?${new URLSearchParams({ ...searchParams, tx_status: 'committed' })}`}
                data-is-active={!isPendingListActive}
              >{`${t('transaction.transactions')} (${
                counts.committed === '-' ? counts.committed : localeNumberString(counts.committed)
              })`}</Link>
              <Link
                to={`/address/${address}?${new URLSearchParams({ ...searchParams, tx_status: 'pending' })}`}
                data-is-active={isPendingListActive}
              >{`${t('transaction.pending_transactions')} (${
                counts.pending === '-' ? counts.pending : localeNumberString(counts.pending)
              })`}</Link>
            </div>
          }
          rightContent={!isMobile && searchOptionsAndModeSwitch}
        />
        {isMobile && searchOptionsAndModeSwitch}
      </Card>

      <AddressTransactionsPanel>
        {layout === 'lite' ? (
          <LiteTransactionList address={address} list={transactions} />
        ) : (
          <>
            {txList.map((transaction: Transaction, index: number) => (
              <TransactionItem
                address={address}
                transaction={transaction}
                key={transaction.transactionHash}
                circleCorner={{
                  bottom: index === transactions.length - 1 && totalPages === 1,
                }}
              />
            ))}
            {txList.length === 0 ? <div className={styles.noRecords}>{t(`transaction.no_records`)}</div> : null}
          </>
        )}
      </AddressTransactionsPanel>
      <PaginationWithRear
        currentPage={currentPage}
        totalPages={totalPages}
        onChange={setPage}
        rear={isPendingListActive ? null : <CsvExport type="address_transactions" id={address} />}
      />
    </>
  )
}
