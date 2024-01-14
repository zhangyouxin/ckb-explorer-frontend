import classNames from 'classnames'
import styles from './LabeledInput.module.scss'

type Props = {
  label: string
  value?: string
  onChange?: (value: string) => void
  labelRightAddon?: React.ReactNode
  placeholder?: string
  isRequired?: boolean
  className?: string
  isError?: boolean
  children?: React.ReactNode
}

export const LabeledInput = (props: Props) => {
  const { value, label, isError, onChange, labelRightAddon, placeholder, isRequired, children, className } = props
  return (
    <div className={classNames(styles.container, className)}>
      <label htmlFor={label} className={styles.label}>
        {label} {isRequired && <span className={styles.requiredIcon}>*</span>}
        {labelRightAddon && <span className={styles.labelRightAddon}>{labelRightAddon}</span>}
      </label>

      {children ?? (
        <input
          name={label}
          type="text"
          className={classNames(styles.input, isError && styles.error)}
          placeholder={placeholder}
          value={value}
          onChange={onChange ? e => onChange(e.target.value) : undefined}
        />
      )}
    </div>
  )
}
