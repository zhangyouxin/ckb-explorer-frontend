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
import { MainnetContractHashTags, TestnetContractHashTags } from '../../constants/scripts'
import { isValidPositiveInteger } from '../../utils/number'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const LabelTooltip = ({ title, icon }: { title: string; icon?: string }) => (
  <Tooltip placement="bottom" title={title}>
    <img src={icon ?? HelpIcon} alt="tooltip" className={styles.tooltipIcon} />
  </Tooltip>
)

export const SubmitTokenInfo = ({ onClose, isOpen }: Props) => {
  const { t } = useTranslation()
  const [args, setArgs] = useState('')

  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [decimal, setDecimal] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [creatorEmail, setCreatorEmail] = useState('')
  const [logo, setLogo] = useState<string | null>(null)

  const scriptDataList = isMainnet() ? MainnetContractHashTags : TestnetContractHashTags
  const tokenTypeOptions = scriptDataList
    .filter(scriptData => scriptData.tag.includes('sudt'))
    .sort((a, b) => a.tag.localeCompare(b.tag))
    .map(scriptData => ({
      value: scriptData.codeHashes[0],
      label: scriptData.tag,
    }))
  const [codeHash, setCodeHash] = useState<string>(tokenTypeOptions[0].value)
  const handleTokenTypesChange = (value: string) => {
    setCodeHash(value)
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
        setLogo(baseString)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearForm = () => {
    onClose()
    setArgs('')
    setSymbol('')
    setName('')
    setDecimal('')
    setDescription('')
    setWebsite('')
    setCreatorEmail('')
    setLogo(null)
  }

  const handleClose = () => {
    onClose()
  }

  const validateFields = () =>
    isValidPositiveInteger(decimal) && !codeHash && !symbol && !args && !website && !creatorEmail

  const handleConfirm = async () => {
    if (!validateFields()) {
      return
    }
    const typeHash = utils.computeScriptHash({
      // code hash should be fixed for sUDT
      codeHash,
      // hash type should be fixed for sUDT
      hashType: 'data',
      args,
    })

    submitTokenInfo(typeHash.toLowerCase(), {
      symbol,
      email: creatorEmail,
      operator_website: website,
      decimal: Number(decimal),
      full_name: name,
      icon_file: logo ?? '',
      typeHash: '',
    }).then(() => {
      clearForm()
    })
  }

  return (
    <CommonModal isOpen={isOpen} onClose={handleClose}>
      <div className={styles.modalWrapper}>
        <div className={styles.contentWrapper}>
          <div className={styles.modalTitle}>
            <div className={styles.title}>{t('submit_token_info.title')}</div>
            <button type="button" onClick={handleClose} className={styles.closeBtn}>
              <img src={CloseIcon} alt="close icon" />
            </button>
          </div>
          <div className={styles.divider} />
          <div className={styles.modalContent}>
            <div className={styles.sectionTitle}>{t('submit_token_info.token_type_scripts')}</div>
            <div className={styles.section}>
              <LabeledInput
                isRequired
                labelRightAddon={<LabelTooltip title={t('submit_token_info.token_type_tip')} />}
                label={t('submit_token_info.token_type')}
                className={styles.labeledInput}
              >
                <CommonSelect
                  className={styles.codeHashSelect}
                  options={tokenTypeOptions}
                  onChange={handleTokenTypesChange}
                  defaultValue={codeHash}
                />
              </LabeledInput>

              <LabeledInput
                isRequired
                value={args}
                onChange={setArgs}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.args_tip')} />}
                label={t('submit_token_info.args')}
                placeholder={t('submit_token_info.args_placeholder')}
                className={styles.labeledInput}
              />
            </div>
            <div className={styles.section}>
              <LabeledInput
                isRequired
                value={symbol}
                onChange={setSymbol}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.symbol_tip')} />}
                label={t('submit_token_info.symbol')}
                placeholder={t('submit_token_info.symbol_placeholder')}
                className={styles.labeledInput}
              />
              <LabeledInput
                value={name}
                onChange={setName}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.name_tip')} />}
                label={t('submit_token_info.name')}
                placeholder={t('submit_token_info.name_placeholder')}
                className={styles.labeledInput}
              />
              <LabeledInput
                isRequired
                value={decimal}
                onChange={setDecimal}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.decimal_tip')} />}
                label={t('submit_token_info.decimal')}
                placeholder={t('submit_token_info.decimal_placeholder')}
                className={styles.labeledInput}
              />
              <LabeledInput
                value={description}
                onChange={setDescription}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.description_tip')} />}
                label={t('submit_token_info.description')}
                placeholder={t('submit_token_info.description_placeholder')}
                className={styles.labeledInput}
              />
              <LabeledInput
                isRequired
                value={website}
                onChange={setWebsite}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.website_tip')} />}
                label={t('submit_token_info.website')}
                placeholder={t('submit_token_info.website_placeholder')}
                className={styles.labeledInput}
              />
              <LabeledInput
                isRequired
                value={creatorEmail}
                onChange={setCreatorEmail}
                labelRightAddon={<LabelTooltip title={t('submit_token_info.creator_email_tip')} icon={AlertIcon} />}
                label={t('submit_token_info.creator_email')}
                placeholder={t('submit_token_info.creator_email_placeholder')}
                className={styles.labeledInput}
              />
              <ImgUpload
                value={logo}
                onClear={() => setLogo(null)}
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
              className={styles.submitBtn}
              onClick={handleConfirm}
              name={t('submit_token_info.confirm')}
              disabled={!validateFields()}
            />
          </div>
        </div>
      </div>
    </CommonModal>
  )
}
