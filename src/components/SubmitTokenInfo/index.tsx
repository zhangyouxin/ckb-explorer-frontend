import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Tooltip from 'antd/lib/tooltip'
// eslint-disable-next-line import/no-extraneous-dependencies
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

type Props = {
  isOpen: boolean
  onClose: () => void
}

const LableTooltip = ({ title, icon }: { title: string; icon?: string }) => (
  <Tooltip placement="bottom" title={title}>
    <img src={icon ?? HelpIcon} alt="tooltip" className={styles.tooltipIcon} />
  </Tooltip>
)

export const SubmitTokenInfo = (prop: Props) => {
  const { t } = useTranslation()
  const { onClose, isOpen } = prop
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
    .reverse() // sUDT should come first, then sUDT(deprecated)
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
      reader.onloadend = function () {
        baseString = reader.result as string
        setLogo(baseString)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClose = () => {
    onClose()
    setArgs('')
    setSymbol('')
    setName('')
    setDecimal('')
    setDescription('')
    setWebsite('')
    setCreatorEmail('')
    setLogo(null)
    onClose()
  }
  const parsedDecimal = parseInt(decimal, 10)

  const validateFields = () => {
    if (Number.isNaN(parsedDecimal)) {
      return false
    }
    if (!codeHash) {
      return false
    }
    if (!symbol) {
      return false
    }
    if (!args) {
      return false
    }
    if (!website) {
      return false
    }
    if (!creatorEmail) {
      return false
    }
    return true
  }

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

    submitTokenInfo(typeHash, {
      symbol,
      email: creatorEmail,
      operator_website: website,
      decimal: parsedDecimal,

      full_name: name,
      icon_file: logo ?? '',
      typeHash: '',
    })
  }

  return (
    <CommonModal isOpen={isOpen}>
      <div className={styles.modalWrapper}>
        <div className={styles.contentWrapper}>
          <div className={styles.modalTitle}>
            <div className={styles.title}>Submit Token Info</div>
            <button type="button" onClick={handleClose} className={styles.closeBtn}>
              <img src={CloseIcon} alt="close icon" />
            </button>
          </div>
          <div className={styles.divider} />
          <div className={styles.modalContent}>
            <div className={styles.sectionTitle}>Token Type Scripts</div>
            <div className={styles.section}>
              <LabeledInput
                isRequired
                labelRightAddon={<LableTooltip title={t('Args')} />}
                label={t('Token Type')}
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
                labelRightAddon={<LableTooltip title={t('Args')} />}
                label={t('Args')}
                placeholder={t('Enter args')}
                className={styles.labeledInput}
              />
            </div>
            <div className={styles.section}>
              <LabeledInput
                isRequired
                value={symbol}
                onChange={setSymbol}
                labelRightAddon={<LableTooltip title={t('Symbol')} />}
                label={t('Symbol')}
                placeholder={t('Enter symbol')}
                className={styles.labeledInput}
              />
              <LabeledInput
                value={name}
                onChange={setName}
                labelRightAddon={<LableTooltip title={t('Name')} />}
                label={t('Name')}
                placeholder={t('Enter name')}
                className={styles.labeledInput}
              />
              <LabeledInput
                isRequired
                value={decimal}
                onChange={setDecimal}
                labelRightAddon={<LableTooltip title={t('Decimal')} />}
                label={t('Decimal')}
                placeholder={t('Enter decimal')}
                className={styles.labeledInput}
              />
              <LabeledInput
                value={description}
                onChange={setDescription}
                labelRightAddon={<LableTooltip title={t('Description')} />}
                label={t('Description')}
                placeholder={t('Enter description')}
                className={styles.labeledInput}
              />
              <LabeledInput
                isRequired
                value={website}
                onChange={setWebsite}
                labelRightAddon={<LableTooltip title={t('Website')} />}
                label={t('Website')}
                placeholder={t('Enter website')}
                className={styles.labeledInput}
              />
              <LabeledInput
                isRequired
                value={creatorEmail}
                onChange={setCreatorEmail}
                labelRightAddon={<LableTooltip title={t('Creator Email')} icon={AlertIcon} />}
                label={t('Creator Email')}
                placeholder={t('Enter creator email')}
                className={styles.labeledInput}
              />
              <ImgUpload
                value={logo}
                onClear={() => setLogo(null)}
                onChange={handleImgChange}
                labelRightAddon={<LableTooltip title={t('Logo')} />}
                label={t('Logo')}
                placeholder={t('Upload')}
                className={styles.labeledInput}
              />
            </div>
          </div>
          <div className={styles.modalFooter}>
            <CommonButton
              className={styles.submitBtn}
              onClick={handleConfirm}
              name="Confirm"
              disabled={!validateFields()}
            />
          </div>
        </div>
      </div>
    </CommonModal>
  )
}
