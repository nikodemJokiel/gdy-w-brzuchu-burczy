import React, { useState } from "react";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import "./InstructionList.scss";

interface Props {
  instructions: any;
}

export default function InstructionList({ instructions }: Props) {
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());

  const toggleCheck = (key: string) => {
    setCheckedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const components: PortableTextComponents = {
    block: {
      normal: ({ children, value }) => {
        let plainText = "";
        if (value.children && Array.isArray(value.children)) {
          plainText = value.children.map((child: any) => child.text || "").join("");
        }
        
        const hasSmacznego = plainText.toLowerCase().includes("smacznego");

        if (hasSmacznego) {
          return (
            <div className="instruction-step instruction-step--smacznego">
              <p className="instruction-step__text">{children}</p>
            </div>
          );
        }

        const isChecked = checkedKeys.has(value._key);
        return (
          <div 
            className={`instruction-step ${isChecked ? 'is-checked' : ''}`}
            onClick={() => toggleCheck(value._key)}
          >
            <span className={`instruction-step__bullet ${isChecked ? 'is-checked' : ''}`}>
              {isChecked ? '✓' : '•'}
            </span>
            <p className="instruction-step__text">
              {children}
            </p>
          </div>
        );
      }
    }
  };

  if (!instructions) return null;

  return (
    <div className="instruction-list">
      <PortableText value={instructions} components={components} />
    </div>
  );
}
