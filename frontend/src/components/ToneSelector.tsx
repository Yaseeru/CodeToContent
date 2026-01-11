import React, { useState } from 'react';

interface ToneSelectorProps {
     onToneChange: (tone: string) => void;
     selectedTone?: string;
}

const PREDEFINED_TONES = [
     'Professional',
     'Casual',
     'Confident',
     'Funny',
     'Meme',
     'Thoughtful',
     'Educational',
];

const ToneSelector: React.FC<ToneSelectorProps> = ({
     onToneChange,
     selectedTone = 'Professional',
}) => {
     const [customTone, setCustomTone] = useState<string>('');
     const [isCustom, setIsCustom] = useState<boolean>(false);

     const handlePredefinedToneSelect = (tone: string) => {
          setIsCustom(false);
          setCustomTone('');
          onToneChange(tone);
     };

     const handleCustomToneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setCustomTone(value);
          setIsCustom(true);
          onToneChange(value);
     };

     return (
          <div className="space-y-4">
               <div>
                    <label className="block text-sm font-medium text-dark-text mb-3">
                         Select Tone
                    </label>
                    <div className="flex flex-wrap gap-2">
                         {PREDEFINED_TONES.map((tone) => (
                              <button
                                   key={tone}
                                   onClick={() => handlePredefinedToneSelect(tone)}
                                   className={`px-4 py-2 rounded-lg border text-sm font-medium ${selectedTone === tone && !isCustom
                                        ? 'bg-dark-accent border-dark-accent text-white'
                                        : 'bg-dark-surface border-dark-border text-dark-text'
                                        }`}
                              >
                                   {tone}
                              </button>
                         ))}
                    </div>
               </div>

               <div>
                    <label
                         htmlFor="custom-tone"
                         className="block text-sm font-medium text-dark-text mb-2"
                    >
                         Custom Tone (Optional)
                    </label>
                    <input
                         id="custom-tone"
                         type="text"
                         value={customTone}
                         onChange={handleCustomToneChange}
                         placeholder="e.g., Inspirational and motivating"
                         className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-base text-dark-text placeholder-dark-text-tertiary focus:border-dark-accent"
                    />
                    {isCustom && customTone && (
                         <p className="mt-2 text-sm text-dark-text-secondary">
                              Using custom tone: "{customTone}"
                         </p>
                    )}
               </div>
          </div>
     );
};

export default ToneSelector;
