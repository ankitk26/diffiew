import { useState, useRef, useEffect } from "react";
import { DiffEditor } from "./diff-editor";
import { Button } from "./ui/button";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useTheme } from "./theme-provider";

export function DiffViewer() {
	const [leftText, setLeftText] = useState("");
	const [rightText, setRightText] = useState("");
	const { theme, setTheme } = useTheme();
	const [isDark, setIsDark] = useState(() => {
		return document.documentElement.classList.contains("dark");
	});
	const leftFileInputRef = useRef<HTMLInputElement>(null);
	const rightFileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const checkDarkMode = () => {
			setIsDark(document.documentElement.classList.contains("dark"));
		};

		// Check immediately
		checkDarkMode();

		// Watch for changes
		const observer = new MutationObserver(checkDarkMode);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, [theme]);

	const toggleTheme = () => {
		setTheme(isDark ? "light" : "dark");
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
		<div className="h-screen flex flex-col bg-background">
			{/* Header */}
			<header className="shrink-0 border-b border-border/50 bg-card/50 backdrop-blur-sm">
				<div className="h-12 px-5 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="size-2 rounded-full bg-primary/80" />
						<h1 className="text-sm font-semibold tracking-tight">
							diffiew
						</h1>
					</div>
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={toggleTheme}
						title={
							isDark
								? "Switch to light mode"
								: "Switch to dark mode"
						}
						className="text-muted-foreground hover:text-foreground"
					>
						{isDark ? (
							<IconSun className="size-3.5" />
						) : (
							<IconMoon className="size-3.5" />
						)}
					</Button>
				</div>
			</header>

			{/* Diff Editor */}
			<main className="flex-1 overflow-hidden">
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
			</main>
		</div>
	);
}
