import classNames from 'classnames'
import styles from './LabeledInput.module.scss'

type Props = {
  name: string
  label: string
  value?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  labelRightAddon?: React.ReactNode
  placeholder?: string
  isRequired?: boolean
  className?: string
  isError?: boolean
  children?: React.ReactNode
}

export const LabeledInput = (props: Props) => {
  const { value, name, label, isError, onChange, labelRightAddon, placeholder, isRequired, children, className } = props
  return (
    <div className={classNames(styles.container, className)}>
      <label htmlFor={name} className={styles.label}>
        {label} {isRequired && <span className={styles.requiredIcon}>*</span>}
        {labelRightAddon && <span className={styles.labelRightAddon}>{labelRightAddon}</span>}
      </label>

      {children ?? (
        <input
          id={name}
          name={name}
          type="text"
          className={classNames(styles.input, isError && styles.error)}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  )
}
