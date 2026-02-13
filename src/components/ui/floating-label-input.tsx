"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    containerClassName?: string;
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
    ({ className, label, id, containerClassName, ...props }, ref) => {
        // Ensure id exists for accessibility and label association
        const inputId = id || `floating-input-${label.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className={cn("floating-input-group", containerClassName)}>
                <input
                    id={inputId}
                    className={cn("floating-input", className)}
                    placeholder=" "
                    ref={ref}
                    {...props}
                />
                <label
                    htmlFor={inputId}
                    className="floating-label"
                >
                    {label}
                </label>
            </div>
        );
    }
);

FloatingLabelInput.displayName = "FloatingLabelInput";

export { FloatingLabelInput };
