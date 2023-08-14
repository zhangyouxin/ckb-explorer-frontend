import i18n from '../../utils/i18n'
import { DecimalPanel, DecimalPartPanel, DecimalZerosPanel } from './styled'

export default ({
  value,
  fontSize,
  balanceChangeType = 'income',
  hideUnit,
  hideZero,
  marginBottom = '1px',
}: {
  value: string
  balanceChangeType?: 'payment' | 'income'
  fontSize?: string
  hideUnit?: boolean
  hideZero?: boolean
  marginBottom?: string
}) => {
  const integer = value.split('.')[0] || '0'
  const isPayment = balanceChangeType === 'payment'
  // red color for payment, green color for income
  const paymentColor = '#FA504F'
  const incomeColor = '#00CC9B'
  const color = isPayment ? paymentColor : incomeColor
  let decimal = value.split('.')[1] || ''
  let zeros = ''

  if (decimal.length < 8) {
    zeros = '0'.repeat(8 - decimal.length)
  }
  if (decimal.length === 0) {
    zeros = `.${'0'.repeat(8)}`
  } else if (decimal.length < 8) {
    zeros = '0'.repeat(8 - decimal.length)
  }
  decimal = decimal.length > 0 ? `.${decimal}` : ''

  return (
    <DecimalPanel>
      <span className={isPayment ? 'subtraction' : ''}>{integer}</span>
      <DecimalPartPanel className="monospace" fontSize={fontSize} color={color} marginBottom={marginBottom}>
        {decimal}
      </DecimalPartPanel>
      {!hideZero && (
        <DecimalZerosPanel className="monospace" fontSize={fontSize} color={color} marginBottom={marginBottom}>
          {zeros}
        </DecimalZerosPanel>
      )}
      {!hideUnit && (
        <div className={isPayment ? 'decimal__unit monospace subtraction' : 'decimal__unit monospace'}>
          {i18n.t('common.ckb_unit')}
        </div>
      )}
    </DecimalPanel>
  )
}
