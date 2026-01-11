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
          <div className="mb-6">
               <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-3 text-base text-dark-text placeholder-dark-text-tertiary focus:border-dark-accent"
               />
          </div>
     );
};

export default SearchBar;
