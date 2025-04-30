import React, { useState } from 'react';
import styles from './Dropdown.module.css';

interface DropdownOption {
  id: string;
  name: string;
}

interface DropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => option.id === value);

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          className={`${styles.button} ${disabled ? styles.buttonDisabled : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className="block truncate">
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          <span className={styles.dropdownIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>

        {isOpen && !disabled && (
          <div className={styles.dropdownMenu}>
            {options.length > 0 ? (
              options.map((option) => (
                <div
                  key={option.id}
                  className={styles.dropdownItem}
                  onClick={() => handleSelect(option.id)}
                >
                  <span className={option.id === value ? styles.selected : styles.normal}>
                    {option.name}
                  </span>
                </div>
              ))
            ) : (
              <div className={styles.emptyOption}>
                No options available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropdown;