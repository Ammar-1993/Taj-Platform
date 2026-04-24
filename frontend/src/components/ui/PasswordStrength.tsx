import * as React from "react"
import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrength({ password = "" }: PasswordStrengthProps) {
  const [strength, setStrength] = React.useState(0);

  React.useEffect(() => {
    let score = 0;
    if (!password) {
      setStrength(0);
      return;
    }

    if (password.length > 0) score += 1;
    if (password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (password.length >= 8 && /[^a-zA-Z0-9]/.test(password)) score += 1;

    setStrength(score);
  }, [password]);

  const bars = Array.from({ length: 3 }).map((_, i) => {
    const isActive = i < strength;
    let colorClass = "bg-gray-200";

    if (isActive) {
      if (strength === 1) colorClass = "bg-red-400";
      else if (strength === 2) colorClass = "bg-amber-400";
      else if (strength === 3) colorClass = "bg-emerald-500";
    }

    return (
      <div 
        key={i} 
        className={cn("h-1.5 w-full rounded-full transition-colors duration-300", colorClass)}
      />
    );
  });

  const getLabel = () => {
    if (strength === 0) return "قوة كلمة المرور";
    if (strength === 1) return "ضعيفة";
    if (strength === 2) return "متوسطة";
    if (strength === 3) return "قوية";
  };

  const getLabelColor = () => {
    if (strength === 1) return "text-red-500";
    if (strength === 2) return "text-amber-500";
    if (strength === 3) return "text-emerald-600";
    return "text-gray-400";
  }

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5 animate-fade-in-up">
      <div className="flex gap-1.5">
        {bars}
      </div>
      <div className="flex justify-between items-center text-[10px] font-bold">
        <span className={getLabelColor()}>{getLabel()}</span>
        <span className="text-gray-400">
          {strength < 3 && "استخدم حروف وأرقام ورموز"}
        </span>
      </div>
    </div>
  );
}
