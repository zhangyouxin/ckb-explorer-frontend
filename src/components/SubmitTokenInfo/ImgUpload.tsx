import classNames from 'classnames'
import { useRef } from 'react'
import UploadIcon from '../../assets/arrow_up_circle.png'
import DeleteIcon from '../../assets/delelte.png'
import styles from './ImgUpload.module.scss'

type Props = {
  value: string | null
  label: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  onClear: () => void
  labelRightAddon?: React.ReactNode
  placeholder?: string
  isRequired?: boolean
  className?: string
}

export const ImgUpload = (prop: Props) => {
  const { value, label, onChange, labelRightAddon, placeholder, isRequired, className, onClear } = prop
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }
  // clear ref value on click to trigger onChange event event if choose the same file of last choice
  const clearValue = () => {
    inputRef.current!.value = ''
  }
  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.label}>
        {label} {isRequired && <span className={styles.requiredIcon}>*</span>}
        {labelRightAddon && <span className={styles.labelRightAddon}>{labelRightAddon}</span>}
      </div>

      <input
        type="file"
        onChange={onChange}
        className={styles.input}
        ref={inputRef}
        accept="image/*"
        onClick={clearValue}
      />
      <button type="button" className={styles.inputWrapper} onClick={value ? undefined : handleClick}>
        {value ? (
          <>
            <img src={value} className={styles.uploadedIcon} alt="upload" />
            <button type="button" onClick={onClear} className={styles.deleteIcon}>
              <img src={DeleteIcon} alt="upload" />
            </button>
          </>
        ) : (
          <div className={styles.uploadIconWrapper}>
            <img src={UploadIcon} className={styles.uploadIcon} alt="upload" />
            <div className={styles.placeholder}>{placeholder}</div>
          </div>
        )}
      </button>
    </div>
  )
}
