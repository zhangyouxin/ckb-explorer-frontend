import classNames from 'classnames'
import styles from './index.module.scss'

type Props = {
  name: string
  onClick: () => void
  disabled?: boolean
  className?: string
}

export default (props: Props) => {
  const { name, onClick, disabled, className } = props
  return (
    <button
      type="button"
      className={classNames(styles.container, disabled && styles.isDisabled, className)}
      onKeyDown={disabled ? undefined : onClick}
      onClick={disabled ? undefined : onClick}
    >
      {name}
    </button>
  )
}
