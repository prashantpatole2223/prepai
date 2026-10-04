"use client";

import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

interface SkillInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
  maxCharLength?: number;
  disabled?: boolean;
}

const COMMON_SUGGESTIONS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "System Design",
  "SQL",
  "Docker",
  "Next.js",
  "GraphQL",
  "AWS",
  "Algorithms & Data Structures",
];

export default function SkillInput({
  skills,
  onChange,
  maxSkills = 15,
  maxCharLength = 40,
  disabled = false,
}: SkillInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const addSkill = (rawSkill: string) => {
    setInputError(null);
    const trimmed = rawSkill.trim();

    if (!trimmed) return;

    if (trimmed.length > maxCharLength) {
      setInputError(`Skill must be ${maxCharLength} characters or fewer.`);
      return;
    }

    if (skills.length >= maxSkills) {
      setInputError(`Maximum ${maxSkills} skills allowed.`);
      return;
    }

    const alreadyExists = skills.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      setInputError("This skill is already added.");
      return;
    }

    onChange([...skills, trimmed]);
    setInputValue("");
  };

  const removeSkill = (indexToRemove: number) => {
    onChange(skills.filter((_, idx) => idx !== indexToRemove));
    setInputError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === "Backspace" && !inputValue && skills.length > 0) {
      removeSkill(skills.length - 1);
    }
  };

  const availableSuggestions = COMMON_SUGGESTIONS.filter(
    (s) => !skills.some((existing) => existing.toLowerCase() === s.toLowerCase())
  ).slice(0, 6);

  return (
    <div className="space-y-2.5">
      {/* Skill Tags Box */}
      <div
        className={`min-h-[50px] p-2.5 rounded-xl bg-navy-950 border ${
          inputError ? "border-rose-500/80" : "border-slate-700/80 focus-within:border-indigo-500"
        } flex flex-wrap items-center gap-2 transition-colors`}
      >
        {skills.map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium group"
          >
            <span>{skill}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="text-indigo-400/70 hover:text-rose-400 p-0.5 rounded transition-colors"
                aria-label={`Remove ${skill}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </span>
        ))}

        {!disabled && skills.length < maxSkills && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (inputError) setInputError(null);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) addSkill(inputValue);
            }}
            placeholder={
              skills.length === 0
                ? "Type a skill and press Enter (e.g. React, SQL)..."
                : "Add another skill..."
            }
            className="flex-1 min-w-[160px] bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none px-1 py-0.5"
          />
        )}
      </div>

      {/* Info & Counter */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Press Enter or comma to add a skill tag</span>
        <span
          className={
            skills.length >= maxSkills ? "text-amber-400 font-semibold" : ""
          }
        >
          {skills.length}/{maxSkills} skills
        </span>
      </div>

      {inputError && (
        <p className="text-xs text-rose-400">{inputError}</p>
      )}

      {/* Quick Add Suggestions */}
      {!disabled && skills.length < maxSkills && availableSuggestions.length > 0 && (
        <div className="pt-1">
          <span className="text-xs text-slate-500 mr-2">Suggestions:</span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1">
            {availableSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addSkill(suggestion)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white text-xs transition-colors"
              >
                <Plus className="w-3 h-3 text-indigo-400" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
