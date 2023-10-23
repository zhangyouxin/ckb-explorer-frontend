import classNames from 'classnames'
import styles from './index.module.scss'

type Props = {
  isOpen: boolean
  children: React.ReactNode
  className?: string
}

export default (props: Props) => {
  const { isOpen, children, className } = props
  if (!isOpen) {
    return null
  }
  return (
    <>
      <div className={styles.overlay} />
      <div className={classNames(styles.container, className)}>{children}</div>
    </>
  )
}
