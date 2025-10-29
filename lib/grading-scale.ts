export interface GradeDescription {
  numericalValue: number | string;
  description: string;
  color: string;
  bgColor: string;
}

export interface GradeRange {
  minPercentage: number;
  maxPercentage: number;
  numericalValue: number;
  description: string;
  color: string;
  bgColor: string;
}

// Grade ranges based on percentage
export const GRADE_RANGES: GradeRange[] = [
  {
    minPercentage: 97,
    maxPercentage: 100,
    numericalValue: 1.00,
    description: "Excellent",
    color: "text-green-700",
    bgColor: "bg-green-100"
  },
  {
    minPercentage: 93,
    maxPercentage: 96,
    numericalValue: 1.25,
    description: "Very Good",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    minPercentage: 89,
    maxPercentage: 92,
    numericalValue: 1.50,
    description: "Very Good",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    minPercentage: 85,
    maxPercentage: 88,
    numericalValue: 1.75,
    description: "Above Average",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    minPercentage: 81,
    maxPercentage: 84,
    numericalValue: 2.00,
    description: "Above Average",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    minPercentage: 77,
    maxPercentage: 80,
    numericalValue: 2.25,
    description: "Average",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50"
  },
  {
    minPercentage: 73,
    maxPercentage: 76,
    numericalValue: 2.50,
    description: "Average",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50"
  },
  {
    minPercentage: 69,
    maxPercentage: 72,
    numericalValue: 2.75,
    description: "Below Average",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  {
    minPercentage: 65,
    maxPercentage: 68,
    numericalValue: 3.00,
    description: "Passed",
    color: "text-orange-700",
    bgColor: "bg-orange-100"
  },
  {
    minPercentage: 0,
    maxPercentage: 64,
    numericalValue: 5.00,
    description: "Failed",
    color: "text-red-700",
    bgColor: "bg-red-100"
  }
];

// Special grade values
export const SPECIAL_GRADES: GradeDescription[] = [
  {
    numericalValue: "INC",
    description: "Incomplete",
    color: "text-gray-700",
    bgColor: "bg-gray-100"
  },
  {
    numericalValue: "DRP",
    description: "Dropped",
    color: "text-gray-600",
    bgColor: "bg-gray-50"
  }
];

/**
 * Get grade description based on percentage score
 */
export function getGradeDescription(percentage: number): GradeDescription {
  // Check for special cases first
  if (percentage < 0) {
    return SPECIAL_GRADES[0]; // INC
  }

  // Find the appropriate grade range
  const gradeRange = GRADE_RANGES.find(
    range => percentage >= range.minPercentage && percentage <= range.maxPercentage
  );

  if (gradeRange) {
    return {
      numericalValue: gradeRange.numericalValue,
      description: gradeRange.description,
      color: gradeRange.color,
      bgColor: gradeRange.bgColor
    };
  }

  // Fallback to failed
  return {
    numericalValue: 5.00,
    description: "Failed",
    color: "text-red-700",
    bgColor: "bg-red-100"
  };
}

/**
 * Get grade description based on numerical value
 */
export function getGradeDescriptionByValue(value: number | string): GradeDescription {
  // Check special grades first
  const specialGrade = SPECIAL_GRADES.find(grade => grade.numericalValue === value);
  if (specialGrade) {
    return specialGrade;
  }

  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Handle numerical grade ranges (1.0-5.0 scale)
  if (typeof numValue === 'number') {
    if (numValue >= 1.0 && numValue < 1.25) {
      return {
        numericalValue: 1.0,
        description: "Excellent",
        color: "text-green-700",
        bgColor: "bg-green-100"
      };
    } else if (numValue >= 1.25 && numValue < 1.5) {
      return {
        numericalValue: 1.25,
        description: "Very Good",
        color: "text-green-600",
        bgColor: "bg-green-50"
      };
    } else if (numValue >= 1.5 && numValue < 1.75) {
      return {
        numericalValue: 1.5,
        description: "Very Good",
        color: "text-green-600",
        bgColor: "bg-green-50"
      };
    } else if (numValue >= 1.75 && numValue < 2.0) {
      return {
        numericalValue: 1.75,
        description: "Above Average",
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      };
    } else if (numValue >= 2.0 && numValue < 2.25) {
      return {
        numericalValue: 2.0,
        description: "Above Average",
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      };
    } else if (numValue >= 2.25 && numValue < 2.5) {
      return {
        numericalValue: 2.25,
        description: "Average",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50"
      };
    } else if (numValue >= 2.5 && numValue < 2.75) {
      return {
        numericalValue: 2.5,
        description: "Satisfactory",
        color: "text-cyan-600",
        bgColor: "bg-cyan-50"
      };
    } else if (numValue >= 2.75 && numValue < 3.0) {
      return {
        numericalValue: 2.75,
        description: "Satisfactory",
        color: "text-cyan-600",
        bgColor: "bg-cyan-50"
      };
    } else if (numValue >= 3.0 && numValue < 5.0) {
      return {
        numericalValue: 3.0,
        description: "Passing",
        color: "text-amber-600",
        bgColor: "bg-amber-50"
      };
    } else if (numValue >= 3.25) {
      return {
        numericalValue: 5.0,
        description: "Failed",
        color: "text-red-700",
        bgColor: "bg-red-100"
      };
    }
  }

  // Find exact match in grade ranges
  const gradeRange = GRADE_RANGES.find(range => range.numericalValue === numValue);
  
  if (gradeRange) {
    return {
      numericalValue: gradeRange.numericalValue,
      description: gradeRange.description,
      color: gradeRange.color,
      bgColor: gradeRange.bgColor
    };
  }

  // Fallback
  return {
    numericalValue: value,
    description: "Unknown",
    color: "text-gray-500",
    bgColor: "bg-gray-50"
  };
}

/**
 * Convert numerical value to percentage (for display purposes)
 */
export function getPercentageFromNumericalValue(numericalValue: number | string): number {
  if (typeof numericalValue === 'string') {
    return 0; // Special grades don't have percentage equivalents
  }

  // Find the grade range and return the middle percentage
  const gradeRange = GRADE_RANGES.find(range => range.numericalValue === numericalValue);
  if (gradeRange) {
    return Math.round((gradeRange.minPercentage + gradeRange.maxPercentage) / 2);
  }

  return 0;
}

/**
 * Get all possible grade descriptions for display
 */
export function getAllGradeDescriptions(): GradeDescription[] {
  const rangeDescriptions = GRADE_RANGES.map(range => ({
    numericalValue: range.numericalValue,
    description: range.description,
    color: range.color,
    bgColor: range.bgColor
  }));

  return [...rangeDescriptions, ...SPECIAL_GRADES];
}

