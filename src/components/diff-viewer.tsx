import { useState, useRef, useEffect } from "react";
import { DiffEditor } from "./diff-editor";
import { Button } from "./ui/button";
import { IconFileUpload, IconSun, IconMoon } from "@tabler/icons-react";

const defaultLeft = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);
`;

const defaultRight = `function greet(name: string, greeting: string = "Hello") {
  return \`\${greeting}, \${name}!\`;
}

const message = greet("World", "Hi");
console.log(message);
`;

export function DiffViewer() {
  const [leftText, setLeftText] = useState(defaultLeft);
  const [rightText, setRightText] = useState(defaultRight);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleFileLoad = (side: "left" | "right", file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (side === "left") {
        setLeftText(content);
      } else {
        setRightText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleFileButtonClick = (side: "left" | "right") => {
    const inputRef = side === "left" ? leftFileInputRef : rightFileInputRef;
    inputRef.current?.click();
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Diffiew</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="h-8 w-8"
          >
            {isDark ? (
              <IconSun className="size-4" />
            ) : (
              <IconMoon className="size-4" />
            )}
          </Button>
        </div>
      </header>
      {/* Diff Editor - Now Editable */}
      <div className="flex-1 overflow-hidden">
        <DiffEditor
          left={leftText}
          right={rightText}
          leftTitle="Original"
          rightTitle="Modified"
          onLeftChange={setLeftText}
          onRightChange={setRightText}
          leftFileInputRef={
            leftFileInputRef as React.RefObject<HTMLInputElement>
          }
          rightFileInputRef={
            rightFileInputRef as React.RefObject<HTMLInputElement>
          }
          onLeftFileClick={() => handleFileButtonClick("left")}
          onRightFileClick={() => handleFileButtonClick("right")}
          onLeftFileLoad={(file) => handleFileLoad("left", file)}
          onRightFileLoad={(file) => handleFileLoad("right", file)}
        />
      </div>
    </div>
  );
}
