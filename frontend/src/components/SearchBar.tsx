import React from 'react';

interface SearchBarProps {
     value: string;
     onChange: (value: string) => void;
     placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
     value,
     onChange,
     placeholder = 'Search repositories...'
}) => {
     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          onChange(e.target.value);
     };

     return (
          <div className="mb-4 sm:mb-6">
               <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-3 min-h-[44px] text-base text-dark-text placeholder-dark-text-tertiary focus:border-dark-accent focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                    aria-label={placeholder}
               />
          </div>
     );
};

export default SearchBar;
