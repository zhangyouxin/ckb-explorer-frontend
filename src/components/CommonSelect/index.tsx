/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
import classNames from 'classnames'
import { useState } from 'react'
import OutsideClickHandler from 'react-outside-click-handler'
import styles from './index.module.scss'
import { isMainnet } from '../../utils/chain'

type OptionType = {
  value: string
  label: string
}

type Props = {
  options: OptionType[]
  onChange: (value: string) => void
  defaultValue?: string
  placeholder?: string
  className?: string
}

export default (props: Props) => {
  const { options, onChange, defaultValue, placeholder, className } = props
  const defaultLabel = options.find(option => option.value === defaultValue)?.label
  const [value, setValue] = useState(defaultLabel)
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }
  const handleOptionClick = (option: OptionType) => {
    onChange(option.value)
    setValue(option.label)
    toggleExpand()
  }
  return (
    <OutsideClickHandler onOutsideClick={() => setIsExpanded(false)}>
      <div className={classNames(styles.select, className)}>
        <div onClick={toggleExpand} className={styles.value}>
          {value ?? placeholder}
          <div className={classNames(isMainnet() ? styles.arrow : styles.arrowTestnet, isExpanded && styles.flip)} />
        </div>
        {isExpanded && (
          <div className={styles.options}>
            {options.map(option => (
              <div key={option.value} className={styles.option} onClick={() => handleOptionClick(option)}>
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </OutsideClickHandler>
  )
}
