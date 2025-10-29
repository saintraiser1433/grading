"use client"

import { Badge } from "@/components/ui/badge"
import { getGradeDescription, getGradeDescriptionByValue, type GradeDescription } from "@/lib/grading-scale"

interface GradeBadgeProps {
  grade: number | string;
  showDescription?: boolean;
  showNumericalValue?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function GradeBadge({ 
  grade, 
  showDescription = true, 
  showNumericalValue = true,
  size = "md",
  className = ""
}: GradeBadgeProps) {
  let gradeInfo: GradeDescription;

  // Determine if we're working with a percentage or numerical value
  if (typeof grade === 'number' && grade > 5.0) {
    // It's a percentage (only if it's greater than 5.0)
    gradeInfo = getGradeDescription(grade);
  } else {
    // It's a numerical value or special grade (1.0-5.0 scale)
    gradeInfo = getGradeDescriptionByValue(grade);
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  const displayText = (() => {
    if (showDescription && showNumericalValue) {
      return `${gradeInfo.numericalValue} - ${gradeInfo.description}`;
    } else if (showDescription) {
      return gradeInfo.description;
    } else if (showNumericalValue) {
      return gradeInfo.numericalValue.toString();
    }
    return grade.toString();
  })();

  return (
    <Badge 
      className={`${gradeInfo.bgColor} ${gradeInfo.color} border-0 font-medium ${sizeClasses[size]} ${className}`}
    >
      {displayText}
    </Badge>
  );
}

interface GradeDisplayProps {
  grade: number | string;
  showPercentage?: boolean;
  showNumericalValue?: boolean;
  showDescription?: boolean;
  className?: string;
}

export function GradeDisplay({ 
  grade, 
  showPercentage = false,
  showNumericalValue = true,
  showDescription = true,
  className = ""
}: GradeDisplayProps) {
  let gradeInfo: GradeDescription;

  if (typeof grade === 'number' && grade > 5.0) {
    gradeInfo = getGradeDescription(grade);
  } else {
    gradeInfo = getGradeDescriptionByValue(grade);
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showPercentage && typeof grade === 'number' && grade <= 100 && (
        <span className="text-sm text-muted-foreground">
          {grade}%
        </span>
      )}
      
      <GradeBadge 
        grade={grade}
        showDescription={showDescription}
        showNumericalValue={showNumericalValue}
        size="sm"
      />
    </div>
  );
}

