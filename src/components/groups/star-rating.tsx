
'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
  disabled?: boolean;
};

export function StarRating({ rating, onRatingChange, size = 24, readOnly = false, disabled = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (rate: number) => {
    if (!readOnly && onRatingChange && !disabled) {
      onRatingChange(rate);
    }
  };

  const handleMouseEnter = (rate: number) => {
    if (!readOnly && !disabled) {
      setHoverRating(rate);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly && !disabled) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex items-center" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((star) => {
        const starValue = hoverRating > 0 ? hoverRating : rating;
        let fillPercentage = 0;

        if (starValue >= star) {
            fillPercentage = 100;
        } else if (starValue > star - 1) {
            fillPercentage = (starValue - (star - 1)) * 100;
        }

        return (
          <div
            key={star}
            className={cn('relative', {
              'cursor-pointer': !readOnly && !disabled,
              'cursor-not-allowed opacity-70': disabled,
            })}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            style={{ width: size, height: size }}
          >
            <Star
              className="absolute text-gray-300 dark:text-gray-600"
              fill="currentColor"
              style={{ width: size, height: size }}
            />
            <div
              className="absolute h-full overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star
                className="text-yellow-400"
                fill="currentColor"
                style={{ width: size, height: size }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
