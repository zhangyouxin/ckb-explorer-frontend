import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Tooltip from 'antd/lib/tooltip'
import { utils } from '@ckb-lumos/base'
import CloseIcon from '../../assets/modal_close.png'
import HelpIcon from '../../assets/qa_help.png'
import AlertIcon from '../../assets/alert.png'
import { LabeledInput } from './LabeledInput'
import styles from './styles.module.scss'
import { ImgUpload } from './ImgUpload'
import CommonButton from '../CommonButton'
import CommonModal from '../CommonModal'
import { submitTokenInfo } from '../../services/ExplorerService/fetcher'
import CommonSelect from '../CommonSelect'
import { isMainnet } from '../../utils/chain'
import { scripts } from '../../pages/ScriptList'
import { MainnetContractHashTags, TestnetContractHashTags } from '../../constants/scripts'
import { isValidNoNegativeInteger } from '../../utils/number'
import { useSetToast } from '../Toast'

const emptyTokenInfo = {
  tokenType: '',
  args: '',
  typeHash: '',
  symbol: '',
  name: '',
  decimal: '',
  description: '',
  website: '',
  creatorEmail: '',
  logo: '',
}

export type TokenInfo = typeof emptyTokenInfo

const LabelTooltip = ({ title, icon }: { title: string; icon?: string }) => (
  <Tooltip placement="bottom" title={title}>
    <img src={icon ?? HelpIcon} alt="tooltip" className={styles.tooltipIcon} />
  </Tooltip>
)

export const SubmitTokenInfo = ({
  onClose,
  isOpen,
  initialInfo,
}: {
  isOpen: boolean
  onClose: () => void
  initialInfo?: TokenInfo
}) => {
  const { t } = useTranslation()
  const setToast = useSetToast()
  const [submitting, setSubmitting] = useState(false)

  const scriptDataList = isMainnet() ? MainnetContractHashTags : TestnetContractHashTags
  const tokenTypeOptions = scriptDataList
    .filter(scriptData => scriptData.tag.includes('sudt'))
    .sort((a, b) => a.tag.localeCompare(b.tag))
    .map(scriptData => ({ label: scripts.get(scriptData.tag)?.name ?? scriptData.tag, value: scriptData.tag }))

  const [tokenInfo, setTokenInfo] = useState<TokenInfo>(
    initialInfo ?? { ...emptyTokenInfo, tokenType: tokenTypeOptions[0].value },
  )

  const handleTokenTypesChange = (value: string) => {
    setTokenInfo(info => ({ ...info, tokenType: value }))
  }

  const handleFieldChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    e.stopPropagation()
    e.preventDefault()
    const { name, value } = e.currentTarget
    setTokenInfo(info => ({ ...info, [name]: value }))
  }

  useEffect(() => {
    // scroll to top when open modal
    if (isOpen) {
      window.scrollTo(0, 0)
    }
  }, [isOpen])

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      let baseString: string | null = null
      // eslint-disable-next-line func-names
      reader.onloadend = function () {
        baseString = reader.result as string
        setTokenInfo(info => ({ ...info, logo: baseString ?? info.logo }))
      }
      reader.readAsDataURL(file)
    }
  }

  const clearForm = () => {
    onClose()
    setTokenInfo(emptyTokenInfo)
  }

  const handleClose = () => {
    clearForm()
    onClose()
  }

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  const validateEmail = (email: string) => emailRegex.test(email)
  const isInputEmailValid = validateEmail(tokenInfo.creatorEmail)

  const hexRegex = /^0x[0-9A-Fa-f]+$/
  const validateHex = (str: string) => hexRegex.test(str) && str.length % 2 === 0
  const isInputHexValid = validateHex(tokenInfo.args)

  const websiteRegex =
    /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/
  const validateWebsite = (str: string) => websiteRegex.test(str)
  const isInputWebsiteValid = validateWebsite(tokenInfo.website)

  const isInputDecimalValid = isValidNoNegativeInteger(tokenInfo.decimal)

  const validateBasicFields = () =>
    !!tokenInfo.tokenType &&
    !!tokenInfo.args &&
    !!tokenInfo.symbol &&
    !!tokenInfo.decimal &&
    !!tokenInfo.website &&
    !!tokenInfo.creatorEmail
  const isInputRulesValid = isInputDecimalValid && isInputEmailValid && isInputHexValid && isInputWebsiteValid

  const validateFields = () => validateBasicFields() && isInputRulesValid

  const handleConfirm = async () => {
    if (!validateFields()) {
      return
    }

    setSubmitting(true)
    const token = scriptDataList.find(scriptData => scriptData.tag === tokenInfo.tokenType)
    if (!token) {
      throw new Error(`tokenType ${tokenInfo.tokenType} is not found`)
    }
    const typeHash = utils.computeScriptHash({
      codeHash: token.codeHashes[0],
      hashType: token.hashType,
      args: tokenInfo.args,
    })

    submitTokenInfo(typeHash.toLowerCase(), {
      symbol: tokenInfo.symbol,
      email: tokenInfo.creatorEmail,
      operator_website: tokenInfo.website,
      decimal: Number(tokenInfo.decimal),
      full_name: tokenInfo.name,
      total_amount: 0,
      icon_file: tokenInfo.logo ?? '',
    })
      .then(() => {
        clearForm()
        setSubmitting(false)
      })
      .catch(() => {
        setToast({ message: t('error.page_crashed_tip') })
        setSubmitting(false)
      })
  }

  const isModification = !!initialInfo

  return (
    <CommonModal isOpen={isOpen} onClose={handleClose}>
      <div className={styles.modalWrapper}>
        <div className={styles.contentWrapper}>
          <div className={styles.modalTitle}>
            <div className={styles.title}>{t(isModification ? 'udt.modify_token_info' : 'udt.submit_token_info')}</div>
            <button type="button" onClick={handleClose} className={styles.closeBtn}>
              <img src={CloseIcon} alt="close icon" />
            </button>
          </div>
          <div className={styles.divider} />
          <div className={styles.modalContent}>
            <div className={styles.sectionTitle}>{t('submit_token_info.token_type_scripts')}</div>
            <div className={styles.section}>
              <LabeledInput
                name="tokenType"
                isRequired
                labelRightAddon={<LabelTooltip title={t('submit_token_info.token_type_tip')} />}
                label={t('submit_token_info.token_type')}
                className={styles.labeledInput}
              >
                <CommonSelect
                  className={styles.codeHashSelect}
                  options={tokenTypeOptions}
                  onChange={handleTokenTypesChange}
                  defaultValue={tokenInfo.tokenType}
                />
              </LabeledInput>

              <LabeledInput
                isRequired
                isError={!!tokenInfo.args && !isInputHexValid}
                value={tokenInfo.args}
                name="args"
                onChange={handleFieldChange}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.args_tip')} />}
                label={t('submit_token_info.args')}
                placeholder={t('submit_token_info.args_placeholder')}
                className={styles.labeledInput}
              />
            </div>
            <div className={styles.section}>
              <LabeledInput
                isRequired
                value={tokenInfo.symbol}
                name="symbol"
                onChange={handleFieldChange}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.symbol_tip')} />}
                label={t('submit_token_info.symbol')}
                placeholder={t('submit_token_info.symbol_placeholder')}
                className={styles.labeledInput}
              />
              <LabeledInput
                value={tokenInfo.name}
                name="name"
                onChange={handleFieldChange}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.name_tip')} />}
                label={t('submit_token_info.name')}
                placeholder={t('submit_token_info.name_placeholder')}
                className={styles.labeledInput}
              />
              <LabeledInput
                isRequired
                isError={!!tokenInfo.decimal && !isInputDecimalValid}
                value={tokenInfo.decimal}
                name="decimal"
                onChange={handleFieldChange}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.decimal_tip')} />}
                label={t('submit_token_info.decimal')}
                placeholder={t('submit_token_info.decimal_placeholder')}
                className={styles.labeledInput}
              />
              <LabeledInput
                value={tokenInfo.description}
                name="description"
                onChange={handleFieldChange}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.description_tip')} />}
                label={t('submit_token_info.description')}
                placeholder={t('submit_token_info.description_placeholder')}
                className={styles.labeledInput}
              />
              <LabeledInput
                isRequired
                isError={!!tokenInfo.website && !isInputWebsiteValid}
                value={tokenInfo.website}
                name="website"
                onChange={handleFieldChange}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.website_tip')} />}
                label={t('submit_token_info.website')}
                placeholder={t('submit_token_info.website_placeholder')}
                className={styles.labeledInput}
              />
              <LabeledInput
                isRequired
                isError={!!tokenInfo.creatorEmail && !isInputEmailValid}
                value={tokenInfo.creatorEmail}
                name="creatorEmail"
                onChange={handleFieldChange}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.creator_email_tip')} icon={AlertIcon} />}
                label={t('submit_token_info.creator_email')}
                placeholder={t('submit_token_info.creator_email_placeholder')}
                className={styles.labeledInput}
              />
              <ImgUpload
                value={tokenInfo.logo}
                onClear={() => setTokenInfo(info => ({ ...info, logo: '' }))}
                onChange={handleImgChange}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.logo_tip')} />}
                label={t('submit_token_info.logo')}
                placeholder={t('submit_token_info.logo_placeholder')}
                className={styles.labeledInput}
              />
            </div>
          </div>
          <div className={styles.modalFooter}>
            <CommonButton
              loading={submitting}
              className={styles.submitBtn}
              onClick={handleConfirm}
              name={t('submit_token_info.confirm')}
              disabled={!validateBasicFields()}
            />
          </div>
        </div>
      </div>
    </CommonModal>
  )
}
